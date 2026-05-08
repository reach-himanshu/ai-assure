import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useCurrentUser } from '@/stores';
import { ScoreBadge } from '@/components/ScoreBadge';
import { ChannelIcon, channelColor } from '@/components/ChannelIcon';
import { CHANNEL_LABEL } from '@/lib/types';
import { fromNow } from '@/lib/dates';
import { EmptyState } from '@/components/EmptyState';
import clsx from 'clsx';

export function Appeals() {
  const me = useCurrentUser();
  const evaluations = useApp((s) => s.evaluations);
  const users = useApp((s) => s.users);

  const [tab, setTab] = useState<'open' | 'decided'>('open');

  const myAppeals = useMemo(() => {
    if (!me) return [];
    if (me.role === 'agent') {
      return evaluations.filter((e) => e.agentId === me.id && e.appeal);
    }
    if (me.role === 'supervisor') {
      const teamAgents = new Set(users.filter((u) => u.supervisorId === me.id).map((u) => u.id));
      return evaluations.filter((e) => teamAgents.has(e.agentId) && e.appeal);
    }
    return evaluations.filter((e) => e.appeal);
  }, [evaluations, users, me]);

  const filtered = myAppeals.filter((e) =>
    tab === 'open' ? e.appeal!.status === 'open' : e.appeal!.status !== 'open',
  );

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl">Appeals</h1>
        <p className="text-sm text-ink-muted mt-1">
          {me?.role === 'agent'
            ? 'Your filed appeals and the supervisor decisions on them.'
            : me?.role === 'supervisor'
            ? "Appeals filed by agents on your team. Decide and document."
            : "All appeals across HR4U."}
        </p>
      </div>

      <div className="card-tight mb-5 inline-flex items-center gap-1 p-1">
        <TabBtn active={tab === 'open'} onClick={() => setTab('open')} count={myAppeals.filter((e) => e.appeal!.status === 'open').length}>Open</TabBtn>
        <TabBtn active={tab === 'decided'} onClick={() => setTab('decided')} count={myAppeals.filter((e) => e.appeal!.status !== 'open').length}>Decided</TabBtn>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={tab === 'open' ? 'No open appeals' : 'No decided appeals yet'}
          body={tab === 'open' ? 'When agents file appeals they will land here.' : 'Once decisions are made they will show up here for reference.'}
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-surface-alt dark:bg-surface-dark border-b border-line dark:border-line-dark">
                <th className="px-4 py-3 font-semibold">Eval</th>
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold">Channel</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Filed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const a = e.appeal!;
                return (
                  <tr key={e.id} className="border-b border-line dark:border-line-dark last:border-b-0 hover:bg-surface-alt/60 dark:hover:bg-surface-dark">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link to={`/app/evaluations/${e.id}`} className="text-brand-700 dark:text-brand-300 hover:underline">{e.id}</Link>
                    </td>
                    <td className="px-4 py-3">{e.agentName}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('pill', channelColor(e.channel))}>
                        <ChannelIcon channel={e.channel} size={12} />
                        {CHANNEL_LABEL[e.channel]}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-md truncate">{a.reason}</td>
                    <td className="px-4 py-3"><ScoreBadge band={e.band} pct={e.overallPct} size="sm" /></td>
                    <td className="px-4 py-3">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{fromNow(a.filedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count: number }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2 rounded-lg text-sm font-medium transition',
        active ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-surface-alt dark:hover:bg-surface-dark',
      )}
    >
      {children} <span className="ml-1 opacity-70 tabular-nums">{count}</span>
    </button>
  );
}

function StatusPill({ status }: { status: 'open' | 'upheld' | 'overturned' | 'partially_adjusted' }) {
  const tone =
    status === 'open' ? 'bg-band-review/15 text-band-review' :
    status === 'overturned' ? 'bg-band-pass/15 text-band-pass' :
    status === 'upheld' ? 'bg-surface-alt dark:bg-surface-dark text-ink-muted' :
    'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200';
  const label = status === 'open' ? 'Open' : status === 'overturned' ? 'Overturned' : status === 'upheld' ? 'Upheld' : 'Adjusted';
  return <span className={clsx('pill', tone)}>{label}</span>;
}
