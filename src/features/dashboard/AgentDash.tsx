import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { useApp, useCurrentUser } from '@/stores';
import { KpiTile } from '@/components/KpiTile';
import { ScoreBadge } from '@/components/ScoreBadge';
import { ChannelIcon, channelColor } from '@/components/ChannelIcon';
import { CHANNEL_LABEL } from '@/lib/types';
import { fromNow, formatDate } from '@/lib/dates';
import { excludeNesting, pct } from '@/lib/format';
import clsx from 'clsx';

export function AgentDash() {
  const me = useCurrentUser();
  const evaluations = useApp((s) => s.evaluations);

  const mine = useMemo(
    () => evaluations.filter((e) => e.agentId === me?.id).sort((a, b) => new Date(b.caseDateTime).getTime() - new Date(a.caseDateTime).getTime()),
    [evaluations, me],
  );

  const last30 = mine.filter((e) => dayjs(e.caseDateTime).isAfter(dayjs().subtract(30, 'day')));
  // Nesting evals are visible in the list/trend but excluded from average + pass rate.
  const last30Counted = excludeNesting(last30);
  const avg = last30Counted.reduce((s, e) => s + e.overallPct, 0) / Math.max(last30Counted.length, 1);
  const passRate = (last30Counted.filter((e) => e.band === 'pass').length / Math.max(last30Counted.length, 1)) * 100;
  const nestingCount = last30.length - last30Counted.length;
  const openAppeals = mine.filter((e) => e.appeal && e.appeal.status === 'open').length;
  const decidedAppeals = mine.filter((e) => e.appeal && e.appeal.status !== 'open').length;

  // Trend: 14-day rolling
  const trendData = useMemo(() => {
    const days: { date: string; score: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = dayjs().subtract(i, 'day');
      const dayEvals = mine.filter((e) => dayjs(e.caseDateTime).isSame(day, 'day'));
      const dayAvg = dayEvals.reduce((s, e) => s + e.overallPct, 0) / Math.max(dayEvals.length, 1);
      days.push({ date: day.format('MMM D'), score: dayEvals.length ? Math.round(dayAvg) : 0, count: dayEvals.length });
    }
    return days.filter((d) => d.count > 0);
  }, [mine]);

  // Channel breakdown
  const channelData = useMemo(() => {
    const buckets: Record<string, { channel: string; avg: number; count: number; total: number }> = {};
    for (const e of last30) {
      const k = e.channel;
      buckets[k] = buckets[k] ?? { channel: CHANNEL_LABEL[e.channel], avg: 0, count: 0, total: 0 };
      buckets[k]!.count += 1;
      buckets[k]!.total += e.overallPct;
    }
    return Object.values(buckets).map((b) => ({ ...b, avg: Math.round(b.total / b.count) }));
  }, [last30]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl">Hi, {me?.name.split(' ')[0]} 👋</h1>
        <p className="text-sm text-ink-muted mt-1">Here is how your interactions have been scoring lately.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile
          label="30-day average"
          value={pct(avg || 0)}
          tone={avg >= 90 ? 'pass' : avg >= 75 ? 'review' : 'fail'}
          hint={nestingCount > 0 ? `${last30Counted.length} counted · ${nestingCount} in nesting` : `${last30Counted.length} evals`}
        />
        <KpiTile label="Pass rate" value={pct(passRate)} tone="pass" hint="≥ 90%" />
        <KpiTile label="Open appeals" value={openAppeals.toString()} hint="awaiting supervisor" />
        <KpiTile label="Decided appeals" value={decidedAppeals.toString()} hint="all-time" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="card lg:col-span-2">
          <header className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg">14-day score trend</h2>
            <span className="text-xs text-ink-muted">Daily average across all interactions</span>
          </header>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <XAxis dataKey="date" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E3E7DF' }} />
                <Line type="monotone" dataKey="score" stroke="#2F6B1E" strokeWidth={2.5} dot={{ r: 3, fill: '#2F6B1E' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">By channel</h2>
            <p className="text-xs text-ink-muted">Average score · last 30 days</p>
          </header>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={channelData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="channel" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                  {channelData.map((d) => (
                    <Cell key={d.channel} fill={d.avg >= 90 ? '#2F6B1E' : d.avg >= 75 ? '#B26B00' : '#A4262C'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <header className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg">Recent evaluations</h2>
          <Link to="/app/evaluations" className="text-sm font-semibold text-brand-700 dark:text-brand-300 hover:underline">View all →</Link>
        </header>
        <div className="space-y-2">
          {mine.slice(0, 8).map((e) => (
            <Link key={e.id} to={`/app/evaluations/${e.id}`} className="flex items-center gap-4 py-3 px-3 rounded-xl hover:bg-surface-alt dark:hover:bg-surface-dark transition">
              <span className={clsx('pill', channelColor(e.channel))}>
                <ChannelIcon channel={e.channel} size={12} />
                {CHANNEL_LABEL[e.channel]}
              </span>
              <span className="font-mono text-xs text-ink-muted shrink-0">{e.id}</span>
              <span className="text-sm flex-1 truncate">{e.summary}</span>
              <ScoreBadge band={e.band} pct={e.overallPct} size="sm" />
              <span className="text-xs text-ink-muted whitespace-nowrap" title={formatDate(e.caseDateTime)}>{fromNow(e.caseDateTime)}</span>
            </Link>
          ))}
          {mine.length === 0 && <p className="text-sm text-ink-muted text-center py-6">No evaluations yet.</p>}
        </div>
      </div>
    </div>
  );
}
