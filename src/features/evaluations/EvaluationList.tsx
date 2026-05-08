import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useCurrentUser, useVisibleEvaluations } from '@/stores';
import { ScoreBadge, ConfidencePill } from '@/components/ScoreBadge';
import { ChannelIcon, channelColor } from '@/components/ChannelIcon';
import { CHANNEL_LABEL, type Channel, type Band } from '@/lib/types';
import { fromNow, formatDate } from '@/lib/dates';
import { EmptyState } from '@/components/EmptyState';
import clsx from 'clsx';

export function EvaluationList() {
  const evaluations = useVisibleEvaluations();
  const me = useCurrentUser();
  const users = useApp((s) => s.users);

  const [channel, setChannel] = useState<'all' | Channel>('all');
  const [band, setBand] = useState<'all' | Band>('all');
  const [agentId, setAgentId] = useState<'all' | string>('all');
  const [search, setSearch] = useState('');

  const visibleAgents = useMemo(() => {
    if (!me) return [];
    if (me.role === 'supervisor') return users.filter((u) => u.supervisorId === me.id);
    if (me.role === 'agent') return users.filter((u) => u.id === me.id);
    return users.filter((u) => u.role === 'agent');
  }, [users, me]);

  const filtered = useMemo(() => {
    return evaluations
      .filter((e) => channel === 'all' || e.channel === channel)
      .filter((e) => band === 'all' || e.band === band)
      .filter((e) => agentId === 'all' || e.agentId === agentId)
      .filter((e) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          e.id.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.agentName.toLowerCase().includes(q) ||
          e.servicenow.caseId.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.caseDateTime).getTime() - new Date(a.caseDateTime).getTime());
  }, [evaluations, channel, band, agentId, search]);

  const display = filtered.slice(0, 200);

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl">Evaluations</h1>
          <p className="text-sm text-ink-muted mt-1">
            {filtered.length.toLocaleString()} interactions match your filters · showing the most recent {Math.min(display.length, filtered.length)}
          </p>
        </div>
      </div>

      <div className="card-tight mb-5 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="label">Channel</label>
          <select className="input mt-1" value={channel} onChange={(e) => setChannel(e.target.value as 'all' | Channel)}>
            <option value="all">All channels</option>
            {(['call', 'email', 'chat', 'portal', 'csat'] as Channel[]).map((c) => (
              <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Score band</label>
          <select className="input mt-1" value={band} onChange={(e) => setBand(e.target.value as 'all' | Band)}>
            <option value="all">All bands</option>
            <option value="pass">Pass (≥ 90%)</option>
            <option value="needs_review">Needs review (75–89%)</option>
            <option value="fail">Fail (&lt; 75%)</option>
          </select>
        </div>
        <div>
          <label className="label">Agent</label>
          <select className="input mt-1" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="all">All agents</option>
            {visibleAgents.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Search</label>
          <input
            className="input mt-1"
            placeholder="ID, summary, case number, agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No evaluations match those filters"
          body="Try widening the channel or score band, or clear the search."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-surface-alt dark:bg-surface-dark border-b border-line dark:border-line-dark">
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
              {display.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-line dark:border-line-dark last:border-b-0 hover:bg-surface-alt/60 dark:hover:bg-surface-dark"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to={`/app/evaluations/${e.id}`} className="text-brand-700 dark:text-brand-300 hover:underline">
                      {e.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('pill', channelColor(e.channel))}>
                      <ChannelIcon channel={e.channel} size={12} />
                      {CHANNEL_LABEL[e.channel]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {e.agentName}
                    {e.nestingAtTime && (
                      <span className="pill bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 ml-2 text-[10px]">
                        Nesting
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-md truncate">{e.summary}</td>
                  <td className="px-4 py-3"><ScoreBadge band={e.band} pct={e.overallPct} size="sm" /></td>
                  <td className="px-4 py-3"><ConfidencePill pct={e.aiConfidencePct} /></td>
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap" title={formatDate(e.caseDateTime)}>{fromNow(e.caseDateTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
