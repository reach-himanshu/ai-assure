import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useApp, useCurrentUser } from '@/stores';
import { KpiTile } from '@/components/KpiTile';
import { ScoreBadge } from '@/components/ScoreBadge';
import { Avatar } from '@/components/Avatar';
import { fromNow } from '@/lib/dates';
import { pct } from '@/lib/format';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

export function SupervisorDash() {
  const me = useCurrentUser();
  const evaluations = useApp((s) => s.evaluations);
  const users = useApp((s) => s.users);

  const team = useMemo(() => users.filter((u) => u.supervisorId === me?.id), [users, me]);
  const teamIds = useMemo(() => new Set(team.map((u) => u.id)), [team]);

  const teamEvals = useMemo(
    () => evaluations.filter((e) => teamIds.has(e.agentId)),
    [evaluations, teamIds],
  );

  const last30 = teamEvals.filter((e) => dayjs(e.caseDateTime).isAfter(dayjs().subtract(30, 'day')));
  const teamAvg = last30.reduce((s, e) => s + e.overallPct, 0) / Math.max(last30.length, 1);
  const passRate = (last30.filter((e) => e.band === 'pass').length / Math.max(last30.length, 1)) * 100;
  const openAppeals = teamEvals.filter((e) => e.appeal && e.appeal.status === 'open').length;
  const lowConfQueue = teamEvals.filter((e) => e.flags.includes('low_confidence') && (e.status === 'pending_review' || e.status === 'auto_approved')).length;

  // Per-agent scorecard
  const agentRows = useMemo(() => {
    return team.map((u) => {
      const eu = last30.filter((e) => e.agentId === u.id);
      const avg = eu.length ? eu.reduce((s, e) => s + e.overallPct, 0) / eu.length : 0;
      const fails = eu.filter((e) => e.band === 'fail').length;
      const open = teamEvals.filter((e) => e.agentId === u.id && e.appeal && e.appeal.status === 'open').length;
      return { agent: u, avg, count: eu.length, fails, openAppeals: open };
    }).sort((a, b) => b.avg - a.avg);
  }, [team, last30, teamEvals]);

  // Trend
  const trend = useMemo(() => {
    const days: { date: string; score: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = dayjs().subtract(i, 'day');
      const dayEvals = teamEvals.filter((e) => dayjs(e.caseDateTime).isSame(day, 'day'));
      const dayAvg = dayEvals.reduce((s, e) => s + e.overallPct, 0) / Math.max(dayEvals.length, 1);
      days.push({ date: day.format('MMM D'), score: dayEvals.length ? Math.round(dayAvg) : 0 });
    }
    return days.filter((d) => d.score > 0);
  }, [teamEvals]);

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl">{me?.team} team</h1>
          <p className="text-sm text-ink-muted mt-1">{team.length} agents · last 30 days</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app/queue" className="btn-primary">Open queue</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile label="Team average" value={pct(teamAvg)} tone={teamAvg >= 90 ? 'pass' : teamAvg >= 75 ? 'review' : 'fail'} hint={`${last30.length} evals`} />
        <KpiTile label="Pass rate" value={pct(passRate)} tone="pass" />
        <KpiTile label="Open appeals" value={openAppeals.toString()} tone={openAppeals > 0 ? 'review' : 'default'} hint="needs your decision" />
        <KpiTile label="Low-confidence queue" value={lowConfQueue.toString()} hint="awaiting review" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="card xl:col-span-2">
          <header className="mb-3">
            <h2 className="text-lg">14-day team trend</h2>
            <p className="text-xs text-ink-muted">Daily average score across the team</p>
          </header>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
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
            <h2 className="text-lg">Per-agent average</h2>
            <p className="text-xs text-ink-muted">Last 30 days</p>
          </header>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={agentRows.map((r) => ({ name: r.agent.name.split(' ')[0], avg: Math.round(r.avg) }))} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} width={70} />
                <Tooltip />
                <Bar dataKey="avg" radius={[0, 6, 6, 0]}>
                  {agentRows.map((r) => (
                    <Cell key={r.agent.id} fill={r.avg >= 90 ? '#2F6B1E' : r.avg >= 75 ? '#B26B00' : '#A4262C'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <header className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg">Team scorecard</h2>
          <span className="text-xs text-ink-muted">Click an agent to drill in</span>
        </header>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-b border-line dark:border-line-dark">
              <th className="px-3 py-2 font-semibold">Agent</th>
              <th className="px-3 py-2 font-semibold">Evals</th>
              <th className="px-3 py-2 font-semibold">Avg score</th>
              <th className="px-3 py-2 font-semibold">Fails</th>
              <th className="px-3 py-2 font-semibold">Open appeals</th>
              <th className="px-3 py-2 font-semibold">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {agentRows.map((r) => {
              const last = teamEvals.find((e) => e.agentId === r.agent.id);
              return (
                <tr key={r.agent.id} className="border-b border-line dark:border-line-dark last:border-b-0 hover:bg-surface-alt/60 dark:hover:bg-surface-dark">
                  <td className="px-3 py-3">
                    <Link to={`/app/agents/${r.agent.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar initials={r.agent.initials} color={r.agent.avatarColor} size="sm" />
                      <span className="font-medium">{r.agent.name}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{r.count}</td>
                  <td className="px-3 py-3"><ScoreBadge band={r.avg >= 90 ? 'pass' : r.avg >= 75 ? 'needs_review' : 'fail'} pct={r.avg} size="sm" /></td>
                  <td className="px-3 py-3 tabular-nums">{r.fails}</td>
                  <td className="px-3 py-3 tabular-nums">{r.openAppeals}</td>
                  <td className="px-3 py-3 text-ink-muted">{last ? fromNow(last.caseDateTime) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
