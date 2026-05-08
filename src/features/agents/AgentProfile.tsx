import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useApp } from '@/stores';
import { Avatar } from '@/components/Avatar';
import { KpiTile } from '@/components/KpiTile';
import { ScoreBadge } from '@/components/ScoreBadge';
import { ChannelIcon, channelColor } from '@/components/ChannelIcon';
import { CHANNEL_LABEL } from '@/lib/types';
import { fromNow } from '@/lib/dates';
import { excludeNesting, pct } from '@/lib/format';
import { isNestingNow } from '@/lib/dates';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import clsx from 'clsx';

export function AgentProfile() {
  const { id } = useParams<{ id: string }>();
  const agent = useApp((s) => s.users.find((u) => u.id === id));
  const supervisor = useApp((s) => s.users.find((u) => u.id === agent?.supervisorId));
  const allEvaluations = useApp((s) => s.evaluations);
  const evaluations = useMemo(
    () => allEvaluations.filter((e) => e.agentId === id),
    [allEvaluations, id],
  );

  const last30 = useMemo(
    () => evaluations.filter((e) => dayjs(e.caseDateTime).isAfter(dayjs().subtract(30, 'day'))),
    [evaluations],
  );
  const last30Counted = excludeNesting(last30);
  const avg = last30Counted.reduce((s, e) => s + e.overallPct, 0) / Math.max(last30Counted.length, 1);
  const passRate = (last30Counted.filter((e) => e.band === 'pass').length / Math.max(last30Counted.length, 1)) * 100;
  const fails = last30Counted.filter((e) => e.band === 'fail').length;
  const openAppeals = evaluations.filter((e) => e.appeal && e.appeal.status === 'open').length;
  const nestingNow = isNestingNow(agent?.trainingCompleteDate);

  const trend = useMemo(() => {
    const days: { date: string; score: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = dayjs().subtract(i, 'day');
      const dayEvals = evaluations.filter((e) => dayjs(e.caseDateTime).isSame(day, 'day'));
      const dayAvg = dayEvals.reduce((s, e) => s + e.overallPct, 0) / Math.max(dayEvals.length, 1);
      days.push({ date: day.format('MMM D'), score: dayEvals.length ? Math.round(dayAvg) : 0 });
    }
    return days.filter((d) => d.score > 0);
  }, [evaluations]);

  const channelBreakdown = useMemo(() => {
    const buckets: Record<string, { channel: string; avg: number; count: number; total: number }> = {};
    for (const e of last30) {
      buckets[e.channel] = buckets[e.channel] ?? { channel: CHANNEL_LABEL[e.channel], avg: 0, count: 0, total: 0 };
      buckets[e.channel]!.count += 1;
      buckets[e.channel]!.total += e.overallPct;
    }
    return Object.values(buckets).map((b) => ({ ...b, avg: Math.round(b.total / b.count) }));
  }, [last30]);

  if (!agent) {
    return (
      <div className="card text-center py-12">
        <p className="text-ink-muted">Agent not found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <Link to="/app/dashboard" className="text-sm text-brand-700 dark:text-brand-300 hover:underline mb-3 inline-block">← Back</Link>
        <div className="flex items-center gap-4">
          <Avatar initials={agent.initials} color={agent.avatarColor} size="lg" />
          <div>
            <h1 className="text-2xl flex items-center gap-2">
              {agent.name}
              {nestingNow && (
                <span className="pill bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 text-xs">
                  Nesting
                </span>
              )}
              {agent.employmentType === 'contractor' && agent.vendor && (
                <span className="pill bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 text-xs">
                  Contractor · {agent.vendor}
                </span>
              )}
              {agent.employmentType === 'associate' && (
                <span className="pill bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200 text-xs">
                  Associate
                </span>
              )}
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              {agent.title} · {agent.team}{supervisor && <> · reports to {supervisor.name}</>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile
          label="30-day average"
          value={last30Counted.length === 0 ? '—' : pct(avg)}
          tone={last30Counted.length === 0 ? 'default' : avg >= 90 ? 'pass' : avg >= 75 ? 'review' : 'fail'}
          hint={last30.length !== last30Counted.length ? `${last30Counted.length} counted · ${last30.length - last30Counted.length} in nesting` : `${last30Counted.length} evals`}
        />
        <KpiTile label="Pass rate" value={last30Counted.length === 0 ? '—' : pct(passRate)} tone={last30Counted.length === 0 ? 'default' : 'pass'} />
        <KpiTile label="Fails (30d)" value={fails.toString()} tone={fails > 5 ? 'fail' : 'default'} />
        <KpiTile label="Open appeals" value={openAppeals.toString()} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="card xl:col-span-2">
          <header className="mb-3">
            <h2 className="text-lg">30-day score trend</h2>
          </header>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <XAxis dataKey="date" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2F6B1E" strokeWidth={2.5} dot={{ r: 3, fill: '#2F6B1E' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">By channel</h2>
          </header>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={channelBreakdown}>
                <XAxis dataKey="channel" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                  {channelBreakdown.map((d) => (
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
          <span className="text-xs text-ink-muted">{evaluations.length} total</span>
        </header>
        <div className="space-y-2">
          {evaluations
            .sort((a, b) => new Date(b.caseDateTime).getTime() - new Date(a.caseDateTime).getTime())
            .slice(0, 10)
            .map((e) => (
              <Link key={e.id} to={`/app/evaluations/${e.id}`} className="flex items-center gap-4 py-2.5 px-3 rounded-xl hover:bg-surface-alt dark:hover:bg-surface-dark transition">
                <span className={clsx('pill', channelColor(e.channel))}>
                  <ChannelIcon channel={e.channel} size={12} />
                  {CHANNEL_LABEL[e.channel]}
                </span>
                <span className="font-mono text-xs text-ink-muted">{e.id}</span>
                <span className="text-sm flex-1 truncate">{e.summary}</span>
                <ScoreBadge band={e.band} pct={e.overallPct} size="sm" />
                <span className="text-xs text-ink-muted whitespace-nowrap">{fromNow(e.caseDateTime)}</span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
