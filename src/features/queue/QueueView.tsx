import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useCurrentUser } from '@/stores';
import { ScoreBadge, ConfidencePill } from '@/components/ScoreBadge';
import { ChannelIcon, channelColor } from '@/components/ChannelIcon';
import { CHANNEL_LABEL, type Evaluation } from '@/lib/types';
import { fromNow } from '@/lib/dates';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import clsx from 'clsx';

type Tab = 'low_confidence' | 'random_sample' | 'pii' | 'appeals';

export function QueueView() {
  const me = useCurrentUser();
  const evaluations = useApp((s) => s.evaluations);
  const users = useApp((s) => s.users);
  const approveBulk = useApp((s) => s.approveBulk);
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('low_confidence');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    if (!me) return [] as Evaluation[];
    if (me.role === 'supervisor') {
      const team = new Set(users.filter((u) => u.supervisorId === me.id).map((u) => u.id));
      return evaluations.filter((e) => team.has(e.agentId));
    }
    return evaluations;
  }, [evaluations, users, me]);

  const buckets = useMemo(() => ({
    low_confidence: visible.filter((e) => e.flags.includes('low_confidence') && (e.status === 'pending_review' || e.status === 'auto_approved')),
    random_sample: visible.filter((e) => e.flags.includes('random_sample') && e.status !== 'reviewer_approved' && e.status !== 'overridden'),
    pii: visible.filter((e) => e.flags.includes('pii') || e.flags.includes('exception')),
    appeals: visible.filter((e) => e.appeal && e.appeal.status === 'open'),
  }), [visible]);

  const items = buckets[tab];

  const toggle = (id: string) => setSelected((cur) => {
    const next = new Set(cur);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const toggleAll = () => setSelected((cur) => {
    if (allSelected) {
      const next = new Set(cur);
      items.forEach((i) => next.delete(i.id));
      return next;
    }
    const next = new Set(cur);
    items.forEach((i) => next.add(i.id));
    return next;
  });

  const onBulkApprove = () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(`Approve ${ids.length} evaluation${ids.length === 1 ? '' : 's'}? This is logged in the audit trail.`)) return;
    approveBulk(ids);
    toast(`${ids.length} evaluation${ids.length === 1 ? '' : 's'} approved.`, 'success');
    setSelected(new Set());
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl">Review queue</h1>
        <p className="text-sm text-ink-muted mt-1">
          Items waiting for human review. Approve in bulk to clear high-volume runs quickly.
        </p>
      </div>

      <div className="card-tight mb-5 flex items-center gap-1 p-1 flex-wrap">
        <TabBtn active={tab === 'low_confidence'} onClick={() => { setTab('low_confidence'); setSelected(new Set()); }} count={buckets.low_confidence.length} tone="amber">
          Low confidence
        </TabBtn>
        <TabBtn active={tab === 'random_sample'} onClick={() => { setTab('random_sample'); setSelected(new Set()); }} count={buckets.random_sample.length} tone="brand">
          Random sample
        </TabBtn>
        <TabBtn active={tab === 'pii'} onClick={() => { setTab('pii'); setSelected(new Set()); }} count={buckets.pii.length} tone="rose">
          PII / exception
        </TabBtn>
        <TabBtn active={tab === 'appeals'} onClick={() => { setTab('appeals'); setSelected(new Set()); }} count={buckets.appeals.length} tone="violet">
          Appeals
        </TabBtn>
      </div>

      {selected.size > 0 && tab !== 'appeals' && (
        <div className="card-tight mb-4 flex items-center justify-between">
          <p className="text-sm">
            <span className="font-semibold">{selected.size}</span> selected
          </p>
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-sm" onClick={() => setSelected(new Set())}>Clear</button>
            <button className="btn-primary text-sm" onClick={onBulkApprove}>Approve selected</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Queue is clear"
          body="Nothing in this bucket right now — nicely done."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-surface-alt dark:bg-surface-dark border-b border-line dark:border-line-dark">
                {tab !== 'appeals' && (
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                  </th>
                )}
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Channel</th>
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold">Summary</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">AI conf.</th>
                <th className="px-4 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 100).map((e) => (
                <tr key={e.id} className="border-b border-line dark:border-line-dark last:border-b-0 hover:bg-surface-alt/60 dark:hover:bg-surface-dark">
                  {tab !== 'appeals' && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(e.id)}
                        onChange={() => toggle(e.id)}
                        aria-label={`Select ${e.id}`}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to={`/app/evaluations/${e.id}`} className="text-brand-700 dark:text-brand-300 hover:underline">{e.id}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('pill', channelColor(e.channel))}>
                      <ChannelIcon channel={e.channel} size={12} />
                      {CHANNEL_LABEL[e.channel]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{e.agentName}</td>
                  <td className="px-4 py-3 max-w-md truncate">{tab === 'appeals' ? e.appeal!.reason : e.summary}</td>
                  <td className="px-4 py-3"><ScoreBadge band={e.band} pct={e.overallPct} size="sm" /></td>
                  <td className="px-4 py-3"><ConfidencePill pct={e.aiConfidencePct} /></td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{fromNow(e.caseDateTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
  tone: 'amber' | 'brand' | 'rose' | 'violet';
}) {
  const toneClasses = active
    ? tone === 'amber' ? 'bg-amber-500 text-white' :
      tone === 'rose' ? 'bg-band-fail text-white' :
      tone === 'violet' ? 'bg-violet-600 text-white' :
      'bg-brand-600 text-white'
    : 'text-ink-muted hover:bg-surface-alt dark:hover:bg-surface-dark';
  return (
    <button
      onClick={onClick}
      className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition', toneClasses)}
    >
      {children} <span className="ml-1 opacity-70 tabular-nums">{count}</span>
    </button>
  );
}
