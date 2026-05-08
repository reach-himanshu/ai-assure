import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/stores';
import { KpiTile } from '@/components/KpiTile';
import { compactNumber, excludeNesting, pct } from '@/lib/format';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import dayjs from 'dayjs';

export function LeaderDash() {
  const evaluations = useApp((s) => s.evaluations);
  const monthly = useApp((s) => s.channelMonthlyVolumes);

  const totalEvals = evaluations.length;
  const last30 = evaluations.filter((e) => dayjs(e.caseDateTime).isAfter(dayjs().subtract(30, 'day')));
  const last30Counted = excludeNesting(last30);
  const overallAvg = last30Counted.reduce((s, e) => s + e.overallPct, 0) / Math.max(last30Counted.length, 1);
  const csat = last30.filter((e) => e.csat);
  const csatAvg = csat.reduce((s, e) => s + (e.csat?.score ?? 0), 0) / Math.max(csat.length, 1);
  const promoters = csat.filter((e) => (e.csat?.score ?? 0) >= 4).length;
  const detractors = csat.filter((e) => (e.csat?.score ?? 0) <= 2).length;
  const npsLike = ((promoters - detractors) / Math.max(csat.length, 1)) * 100;

  // Trend
  const trend = useMemo(() => {
    const days: { date: string; score: number; csat: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = dayjs().subtract(i, 'day');
      const dayEvals = evaluations.filter((e) => dayjs(e.caseDateTime).isSame(day, 'day'));
      const dayCsat = dayEvals.filter((e) => e.csat);
      days.push({
        date: day.format('MMM D'),
        score: dayEvals.length ? Math.round(dayEvals.reduce((s, e) => s + e.overallPct, 0) / dayEvals.length) : 0,
        csat: dayCsat.length ? Number((dayCsat.reduce((s, e) => s + (e.csat?.score ?? 0), 0) / dayCsat.length).toFixed(2)) : 0,
      });
    }
    return days;
  }, [evaluations]);

  // Themes (top from CSAT)
  const themeData = useMemo(() => {
    const counts: Record<string, { theme: string; pos: number; neg: number; total: number }> = {};
    for (const e of last30) {
      if (!e.csat) continue;
      for (const t of e.csat.themes) {
        counts[t] = counts[t] ?? { theme: t, pos: 0, neg: 0, total: 0 };
        counts[t]!.total += 1;
        if (e.csat.sentiment === 'pos') counts[t]!.pos += 1;
        if (e.csat.sentiment === 'neg') counts[t]!.neg += 1;
      }
    }
    return Object.values(counts).sort((a, b) => b.total - a.total).slice(0, 7);
  }, [last30]);

  // Score by section radar (last 30)
  const radarData = useMemo(() => {
    const sectionScores: Record<string, { section: string; total: number; n: number }> = {};
    for (const e of last30) {
      if (e.channel === 'csat') continue;
      for (const s of e.sections) {
        sectionScores[s.id] = sectionScores[s.id] ?? { section: s.label, total: 0, n: 0 };
        sectionScores[s.id]!.total += s.sectionScorePct;
        sectionScores[s.id]!.n += 1;
      }
    }
    return Object.values(sectionScores).map((r) => ({ section: r.section, score: Math.round(r.total / Math.max(r.n, 1)) }));
  }, [last30]);

  // Channel mix monthly
  const monthlyData = monthly.map((m) => ({
    name: m.month,
    Calls: m.calls,
    Emails: m.emails,
    Chats: m.chats,
    Portal: m.portal,
    CSAT: m.csat,
  }));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl">HR4U Service Excellence — at a glance</h1>
        <p className="text-sm text-ink-muted mt-1">Org-wide quality, CSAT, and channel mix · 60-day window</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile label="30-day avg score" value={pct(overallAvg)} tone={overallAvg >= 90 ? 'pass' : overallAvg >= 75 ? 'review' : 'fail'} delta={{ sign: 'up', text: '+1.4 pts MoM' }} />
        <KpiTile label="CSAT avg" value={csatAvg.toFixed(2) + ' / 5'} tone={csatAvg >= 4 ? 'pass' : 'review'} delta={{ sign: 'up', text: '+0.06' }} />
        <KpiTile label="NPS-style" value={Math.round(npsLike).toString()} delta={{ sign: 'flat', text: 'no change' }} hint="promoters − detractors" />
        <KpiTile label="Total evaluations" value={compactNumber(totalEvals)} hint="last 60 days" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="card xl:col-span-2">
          <header className="mb-3">
            <h2 className="text-lg">Quality and CSAT trend</h2>
            <p className="text-xs text-ink-muted">Daily averages · last 30 days</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="score" domain={[0, 100]} stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="csat" orientation="right" domain={[0, 5]} stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line yAxisId="score" type="monotone" dataKey="score" name="Quality score" stroke="#2F6B1E" strokeWidth={2.5} dot={false} />
                <Line yAxisId="csat" type="monotone" dataKey="csat" name="CSAT" stroke="#B26B00" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">Section performance</h2>
            <p className="text-xs text-ink-muted">Average across all evaluations</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="section" fontSize={11} stroke="#5B6760" />
                <Radar name="Score" dataKey="score" stroke="#2F6B1E" fill="#2F6B1E" fillOpacity={0.25} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2">
          <header className="mb-3">
            <h2 className="text-lg">Monthly channel volume</h2>
            <p className="text-xs text-ink-muted">Recorded volume across all channels</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={monthlyData}>
                <XAxis dataKey="name" stroke="#5B6760" fontSize={12} />
                <YAxis stroke="#5B6760" fontSize={12} tickFormatter={compactNumber} />
                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                <Legend />
                <Area type="monotone" dataKey="Calls" stackId="1" stroke="#2F6B1E" fill="#2F6B1E" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Emails" stackId="1" stroke="#3D7DB3" fill="#3D7DB3" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Chats" stackId="1" stroke="#7B5EA7" fill="#7B5EA7" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Portal" stackId="1" stroke="#B26B00" fill="#B26B00" fillOpacity={0.6} />
                <Area type="monotone" dataKey="CSAT" stackId="1" stroke="#A4262C" fill="#A4262C" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg">Top CSAT themes</h2>
            <Link to="/app/insights" className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:underline">More →</Link>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={themeData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="theme" stroke="#5B6760" fontSize={12} width={90} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {themeData.map((d) => (
                    <Cell key={d.theme} fill={d.neg > d.pos ? '#A4262C' : '#2F6B1E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
