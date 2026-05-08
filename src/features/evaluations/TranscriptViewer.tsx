import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import type { Evaluation, TranscriptTurn } from '@/lib/types';
import { durationLabel } from '@/lib/dates';
import clsx from 'clsx';

export interface TranscriptViewerHandle {
  highlightTurn: (turnId: string) => void;
}

interface Props {
  evaluation: Evaluation;
  highlightedEvidenceId: string | null;
  /** Optional: when the channel is 'call', clicking a turn fires this with the turn's ms timestamp. */
  onTurnClick?: (ms: number) => void;
}

export const TranscriptViewer = forwardRef<TranscriptViewerHandle, Props>(function TranscriptViewer(
  { evaluation, highlightedEvidenceId, onTurnClick },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightedTurnId = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    highlightTurn(turnId: string) {
      const el = containerRef.current?.querySelector<HTMLElement>(`[data-turn="${turnId}"]`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el.classList.add('ring-2', 'ring-brand-500');
        setTimeout(() => el.classList.remove('ring-2', 'ring-brand-500'), 1800);
      }
    },
  }));

  // Identify which turn maps to a given evidence id
  const evidenceToTurnId = new Map<string, string>();
  evaluation.evidence.forEach((q) => {
    const turn = (evaluation.transcript ?? []).find((t) => t.text === q.text && t.speaker === q.speaker);
    if (turn) evidenceToTurnId.set(q.id, turn.id);
  });

  useEffect(() => {
    if (highlightedEvidenceId) {
      const turnId = evidenceToTurnId.get(highlightedEvidenceId);
      if (turnId && turnId !== highlightedTurnId.current) {
        highlightedTurnId.current = turnId;
        const el = containerRef.current?.querySelector<HTMLElement>(`[data-turn="${turnId}"]`);
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
    }
  }, [highlightedEvidenceId, evidenceToTurnId]);

  if (evaluation.channel === 'email' || evaluation.channel === 'portal') {
    return <EmailViewer body={evaluation.emailBody ?? ''} />;
  }

  if (evaluation.channel === 'csat') {
    return (
      <div className="card">
        <p className="label">Verbatim</p>
        <p className="mt-2 text-base italic">"{evaluation.csat?.verbatim}"</p>
      </div>
    );
  }

  const turns = evaluation.transcript ?? [];
  const isCall = evaluation.channel === 'call';

  return (
    <div ref={containerRef} className="card max-h-[600px] overflow-y-auto space-y-3">
      {turns.length === 0 && <p className="text-sm text-ink-muted">No transcript available.</p>}
      {turns.map((t) => (
        <Turn key={t.id} turn={t} isCall={isCall} onClick={() => {
          if (isCall && typeof t.timestampMs === 'number' && onTurnClick) onTurnClick(t.timestampMs);
        }} />
      ))}
    </div>
  );
});

function Turn({ turn, isCall, onClick }: { turn: TranscriptTurn; isCall: boolean; onClick?: () => void }) {
  const isAgent = turn.speaker === 'agent';
  return (
    <div
      data-turn={turn.id}
      onClick={onClick}
      className={clsx(
        'flex gap-3 transition-shadow rounded-xl',
        isAgent ? 'flex-row' : 'flex-row-reverse',
        isCall && 'cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/10 -mx-1 px-1',
      )}
    >
      <div
        className={clsx(
          'shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold',
          isAgent
            ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
            : 'bg-surface-alt dark:bg-surface-dark text-ink-muted',
        )}
      >
        {isAgent ? 'A' : 'C'}
      </div>
      <div
        className={clsx(
          'rounded-2xl px-4 py-2.5 max-w-xl',
          isAgent ? 'bg-brand-50 dark:bg-brand-900/20' : 'bg-surface-alt dark:bg-surface-dark',
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase text-ink-muted">{turn.speaker}</span>
          {isCall && typeof turn.timestampMs === 'number' && (
            <span className="text-xs text-ink-muted tabular-nums">{durationLabel(Math.floor(turn.timestampMs / 1000))}</span>
          )}
        </div>
        <p className="text-sm leading-relaxed">{turn.text}</p>
      </div>
    </div>
  );
}

function EmailViewer({ body }: { body: string }) {
  const paragraphs = body.split(/\n\n+/);
  return (
    <article className="card max-h-[600px] overflow-y-auto">
      <div className="prose prose-sm max-w-none">
        {paragraphs.map((p, i) => (
          <p key={i} className="leading-relaxed whitespace-pre-line">{p}</p>
        ))}
      </div>
    </article>
  );
}
