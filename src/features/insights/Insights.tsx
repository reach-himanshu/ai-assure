import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useApp, useCurrentUser } from '@/stores';
import { KpiTile } from '@/components/KpiTile';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, Legend } from 'recharts';
import { compactNumber, excludeNesting, pct } from '@/lib/format';

export function Insights() {
  const me = useCurrentUser();
  const evaluations = useApp((s) => s.evaluations);
  const users = useApp((s) => s.users);

  const visibleEvals = useMemo(() => {
    if (!me) return [] as typeof evaluations;
    if (me.role === 'supervisor') {
      const team = new Set(users.filter((u) => u.supervisorId === me.id).map((u) => u.id));
      return evaluations.filter((e) => team.has(e.agentId));
    }
    return evaluations;
  }, [evaluations, users, me]);

  const last30 = visibleEvals.filter((e) => dayjs(e.caseDateTime).isAfter(dayjs().subtract(30, 'day')));

  // Calibration: AI confidence vs. resulting band
  const calibration = useMemo(() => {
    const buckets = [
      { range: '60-69', min: 60, max: 70 },
      { range: '70-79', min: 70, max: 80 },
      { range: '80-89', min: 80, max: 90 },
      { range: '90-99', min: 90, max: 100 },
    ];
    return buckets.map((b) => {
      const inB = visibleEvals.filter((e) => e.aiConfidencePct >= b.min && e.aiConfidencePct < b.max);
      const passed = inB.filter((e) => e.band === 'pass').length;
      return {
        range: b.range,
        confidence: b.min + 5,
        actualPassRate: inB.length ? Math.round((passed / inB.length) * 100) : 0,
        n: inB.length,
      };
    });
  }, [visibleEvals]);

  // Sentiment over time
  const sentiment = useMemo(() => {
    const days: { date: string; pos: number; neu: number; neg: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = dayjs().subtract(i, 'day');
      const dayCsat = visibleEvals.filter((e) => e.csat && dayjs(e.caseDateTime).isSame(day, 'day'));
      days.push({
        date: day.format('MMM D'),
        pos: dayCsat.filter((e) => e.csat?.sentiment === 'pos').length,
        neu: dayCsat.filter((e) => e.csat?.sentiment === 'neu').length,
        neg: dayCsat.filter((e) => e.csat?.sentiment === 'neg').length,
      });
    }
    return days;
  }, [visibleEvals]);

  // Per-criterion fail frequency
  const failingCriteria = useMemo(() => {
    const counts: Record<string, { label: string; fails: number; sectionLabel: string }> = {};
    for (const e of last30) {
      for (const s of e.sections) {
        for (const c of s.criteria) {
          if (c.value === 'no' || c.value === 'none' || c.value === 'partial') {
            counts[c.id] = counts[c.id] ?? { label: c.label, fails: 0, sectionLabel: s.label };
            counts[c.id]!.fails += 1;
          }
        }
      }
    }
    return Object.values(counts).sort((a, b) => b.fails - a.fails).slice(0, 8);
  }, [last30]);

  // Themes
  const themes = useMemo(() => {
    const counts: Record<string, { theme: string; count: number; pos: number; neg: number }> = {};
    for (const e of last30) {
      if (!e.csat) continue;
      for (const t of e.csat.themes) {
        counts[t] = counts[t] ?? { theme: t, count: 0, pos: 0, neg: 0 };
        counts[t]!.count += 1;
        if (e.csat.sentiment === 'pos') counts[t]!.pos += 1;
        if (e.csat.sentiment === 'neg') counts[t]!.neg += 1;
      }
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [last30]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl">Insights</h1>
        <p className="text-sm text-ink-muted mt-1">Calibration, sentiment, and failure modes across evaluations.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile label="Evaluations (30d)" value={compactNumber(last30.length)} />
        <KpiTile label="CSAT responses (30d)" value={last30.filter((e) => e.csat).length.toString()} />
        <KpiTile label="Avg score" value={pct((() => { const c = excludeNesting(last30); return c.reduce((s, e) => s + e.overallPct, 0) / Math.max(c.length, 1); })())} />
        <KpiTile label="Themes tracked" value={themes.length.toString()} hint="from CSAT" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">Calibration</h2>
            <p className="text-xs text-ink-muted">Actual pass rate by AI confidence band</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={calibration}>
                <XAxis dataKey="range" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="actualPassRate" name="Actual pass %" fill="#2F6B1E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">CSAT sentiment trend</h2>
            <p className="text-xs text-ink-muted">Daily count by sentiment</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={sentiment}>
                <XAxis dataKey="date" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pos" name="Positive" stroke="#2F6B1E" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="neu" name="Neutral" stroke="#B26B00" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="neg" name="Negative" stroke="#A4262C" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">Top failing criteria</h2>
            <p className="text-xs text-ink-muted">Last 30 days · across the rubric</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={failingCriteria} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" stroke="#5B6760" fontSize={11} width={210} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="fails" radius={[0, 6, 6, 0]} fill="#A4262C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">CSAT themes</h2>
            <p className="text-xs text-ink-muted">Surfaced in survey verbatims</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={themes} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="theme" stroke="#5B6760" fontSize={11} width={130} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {themes.map((t) => (
                    <Cell key={t.theme} fill={t.neg > t.pos ? '#A4262C' : '#2F6B1E'} />
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
