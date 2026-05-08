import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp, useCurrentUser } from '@/stores';
import { ScoreBadge, ConfidencePill } from '@/components/ScoreBadge';
import { ChannelIcon, channelColor } from '@/components/ChannelIcon';
import { Avatar } from '@/components/Avatar';
import { CHANNEL_LABEL, STATUS_LABEL } from '@/lib/types';
import { TranscriptViewer, type TranscriptViewerHandle } from './TranscriptViewer';
import { RubricPanel } from './RubricPanel';
import { EvidencePanel } from './EvidencePanel';
import { IntegrationSidebar } from './IntegrationSidebar';
import { AppealModal } from '@/features/appeals/AppealModal';
import { AppealDecisionModal } from '@/features/appeals/AppealDecisionModal';
import { isWithinAppealWindow, formatDateTime, fromNow } from '@/lib/dates';
import clsx from 'clsx';
import { useToast } from '@/components/Toast';

export function EvaluationDetail() {
  const { id } = useParams<{ id: string }>();
  const me = useCurrentUser();
  const evaluation = useApp((s) => s.evaluations.find((e) => e.id === id));
  const config = useApp((s) => s.config);
  const approveEvaluation = useApp((s) => s.approveEvaluation);
  const addComment = useApp((s) => s.addComment);
  const toast = useToast();

  const transcriptRef = useRef<TranscriptViewerHandle>(null);
  const [highlightedCriterionId, setHighlightedCriterionId] = useState<string | null>(null);
  const [highlightedEvidenceId, setHighlightedEvidenceId] = useState<string | null>(null);
  const [appealOpen, setAppealOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [newComment, setNewComment] = useState('');

  const supervisorOfAgent = useApp((s) => {
    if (!evaluation) return null;
    const agent = s.users.find((u) => u.id === evaluation.agentId);
    if (!agent?.supervisorId) return null;
    return s.users.find((u) => u.id === agent.supervisorId) ?? null;
  });

  const canFileAppeal = useMemo(() => {
    if (!evaluation || !me) return false;
    if (me.role !== 'agent' || me.id !== evaluation.agentId) return false;
    if (evaluation.appeal && evaluation.appeal.status === 'open') return false;
    return isWithinAppealWindow(evaluation.caseDateTime, config.appealWindowDays);
  }, [evaluation, me, config]);

  const canDecideAppeal = useMemo(() => {
    if (!evaluation || !me) return false;
    if (!evaluation.appeal || evaluation.appeal.status !== 'open') return false;
    if (me.role === 'supervisor' && supervisorOfAgent?.id === me.id) return true;
    return false;
  }, [evaluation, me, supervisorOfAgent]);

  const canApprove = useMemo(() => {
    if (!evaluation || !me) return false;
    if (evaluation.status !== 'pending_review' && evaluation.status !== 'pii_hold') return false;
    if (me.role === 'qa_admin') return true;
    if (me.role === 'supervisor' && supervisorOfAgent?.id === me.id) return true;
    return false;
  }, [evaluation, me, supervisorOfAgent]);

  if (!evaluation) {
    return (
      <div className="card text-center py-12">
        <p className="text-ink-muted">Evaluation not found.</p>
        <Link to="/app/evaluations" className="btn-secondary mt-4 inline-flex">Back to evaluations</Link>
      </div>
    );
  }

  const onClickEvidence = (eid: string) => {
    setHighlightedEvidenceId(eid);
    transcriptRef.current?.highlightTurn(
      // try to find a transcript turn whose text matches the evidence text
      (() => {
        const ev = evaluation.evidence.find((e) => e.id === eid);
        if (!ev || !evaluation.transcript) return '';
        const turn = evaluation.transcript.find((t) => t.text === ev.text && t.speaker === ev.speaker);
        return turn?.id ?? '';
      })(),
    );
  };

  const onSendComment = () => {
    if (!newComment.trim()) return;
    addComment(evaluation.id, newComment.trim());
    toast('Comment added.', 'success');
    setNewComment('');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/app/evaluations" className="text-sm text-brand-700 dark:text-brand-300 hover:underline mb-2 inline-block">
            ← All evaluations
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={clsx('pill', channelColor(evaluation.channel))}>
              <ChannelIcon channel={evaluation.channel} size={12} />
              {CHANNEL_LABEL[evaluation.channel]}
            </span>
            <h1 className="text-2xl font-mono">{evaluation.id}</h1>
            <span className="text-sm text-ink-muted">{formatDateTime(evaluation.caseDateTime)}</span>
          </div>
          <p className="mt-2 text-ink-muted max-w-3xl">{evaluation.summary}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ScoreBadge band={evaluation.band} pct={evaluation.overallPct} size="lg" />
          <div className="flex items-center gap-2">
            <ConfidencePill pct={evaluation.aiConfidencePct} />
            <span className="pill bg-surface-alt dark:bg-surface-dark border border-line dark:border-line-dark">
              {STATUS_LABEL[evaluation.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      {(canFileAppeal || canDecideAppeal || canApprove || evaluation.appeal) && (
        <div className="card-tight mb-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Avatar initials={evaluation.agentName.split(' ').map((p) => p[0]).join('').slice(0, 2)} color="#2F6B1E" size="sm" />
            <div>
              <p className="text-sm font-semibold">{evaluation.agentName}</p>
              {supervisorOfAgent && (
                <p className="text-xs text-ink-muted">Reports to {supervisorOfAgent.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canApprove && (
              <button className="btn-secondary" onClick={() => { approveEvaluation(evaluation.id); toast('Evaluation approved.', 'success'); }}>
                Approve
              </button>
            )}
            {canDecideAppeal && (
              <button className="btn-primary" onClick={() => setDecisionOpen(true)}>
                Decide appeal
              </button>
            )}
            {canFileAppeal && (
              <button className="btn-primary" onClick={() => setAppealOpen(true)}>
                File appeal
              </button>
            )}
            {!canFileAppeal && me?.role === 'agent' && me.id === evaluation.agentId && !evaluation.appeal && (
              <button disabled className="btn-secondary">
                Appeal window closed
              </button>
            )}
          </div>
        </div>
      )}

      {/* Appeal banner */}
      {evaluation.appeal && (
        <AppealBanner appeal={evaluation.appeal} />
      )}

      {/* Body */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left: Rubric + Comments */}
        <div className="xl:col-span-5 space-y-5">
          <RubricPanel evaluation={evaluation} onEvidenceFocus={(critId) => {
            setHighlightedCriterionId(critId);
            // Pick first evidence for that criterion
            const ev = evaluation.evidence.find((q) => q.criterionId === critId);
            if (ev) onClickEvidence(ev.id);
          }} />

          <CommentsPanel
            evaluation={evaluation}
            onSend={onSendComment}
            value={newComment}
            onChange={setNewComment}
            canPost={me?.role === 'qa_admin' || me?.role === 'supervisor'}
          />
        </div>

        {/* Middle: Transcript / Body */}
        <div className="xl:col-span-4">
          <h2 className="text-lg mb-3">{evaluation.channel === 'email' || evaluation.channel === 'portal' ? 'Message body' : 'Transcript'}</h2>
          <TranscriptViewer
            ref={transcriptRef}
            evaluation={evaluation}
            highlightedEvidenceId={highlightedEvidenceId}
          />
          <div className="mt-4">
            <EvidencePanel
              evaluation={evaluation}
              highlightedCriterionId={highlightedCriterionId}
              onClickEvidence={onClickEvidence}
            />
          </div>
        </div>

        {/* Right: Integration sidebar */}
        <div className="xl:col-span-3">
          <IntegrationSidebar evaluation={evaluation} />
        </div>
      </div>

      <AppealModal open={appealOpen} onClose={() => setAppealOpen(false)} evaluation={evaluation} />
      {evaluation.appeal && (
        <AppealDecisionModal open={decisionOpen} onClose={() => setDecisionOpen(false)} evaluation={evaluation} />
      )}
    </div>
  );
}

function AppealBanner({ appeal }: { appeal: NonNullable<import('@/lib/types').Evaluation['appeal']> }) {
  const tone =
    appeal.status === 'open' ? 'border-band-review/30 bg-band-review/10 text-band-review' :
    appeal.status === 'overturned' ? 'border-band-pass/30 bg-band-pass/10 text-band-pass' :
    appeal.status === 'partially_adjusted' ? 'border-brand-500/30 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' :
    'border-line dark:border-line-dark bg-surface-alt dark:bg-surface-dark text-ink-muted';
  const label = appeal.status === 'open' ? 'Appeal pending review' : `Appeal ${appeal.status.replace('_', ' ')}`;
  return (
    <div className={clsx('rounded-2xl border p-4 mb-5', tone)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-sm mt-0.5 text-ink-muted">
            Filed {fromNow(appeal.filedAt)} · "{appeal.reason}"
          </p>
          <p className="text-sm mt-1 text-ink dark:text-[#F1F5EE]">{appeal.agentComment}</p>
          {appeal.decisionNotes && (
            <p className="text-sm mt-2 italic">
              <span className="font-semibold">Decision · </span>{appeal.decisionNotes}
              {typeof appeal.scoreDeltaPct === 'number' && appeal.scoreDeltaPct !== 0 && (
                <> (Δ {appeal.scoreDeltaPct > 0 ? '+' : ''}{appeal.scoreDeltaPct} pts)</>
              )}
            </p>
          )}
        </div>
        {appeal.attachmentName && (
          <span className="pill bg-surface dark:bg-surface-dark-alt border border-line dark:border-line-dark">
            📎 {appeal.attachmentName}
          </span>
        )}
      </div>
    </div>
  );
}

function CommentsPanel({
  evaluation,
  value,
  onChange,
  onSend,
  canPost,
}: {
  evaluation: import('@/lib/types').Evaluation;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  canPost: boolean;
}) {
  return (
    <div className="card">
      <header className="mb-3">
        <h2 className="text-lg">Coaching & comments</h2>
        <p className="text-sm text-ink-muted">QA admin and supervisor notes — visible to the agent.</p>
      </header>
      <div className="space-y-3">
        {evaluation.comments.length === 0 ? (
          <p className="text-sm text-ink-muted italic">No comments yet.</p>
        ) : (
          evaluation.comments.map((c) => (
            <div key={c.id} className="rounded-xl bg-brand-50 dark:bg-brand-900/20 px-4 py-3">
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="text-sm font-semibold">{c.authorName} <span className="text-xs text-ink-muted font-normal">· {c.authorRole.replace('_', ' ')}</span></p>
                <p className="text-xs text-ink-muted">{fromNow(c.at)}</p>
              </div>
              <p className="text-sm leading-relaxed">{c.text}</p>
            </div>
          ))
        )}
      </div>
      {canPost && (
        <div className="mt-4">
          <textarea
            className="input min-h-[80px]"
            placeholder="Add coaching notes the agent will see..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button className="btn-primary" disabled={!value.trim()} onClick={onSend}>
              Add comment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
