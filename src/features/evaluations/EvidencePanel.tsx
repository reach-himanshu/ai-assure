import type { Evaluation } from '@/lib/types';
import { durationLabel } from '@/lib/dates';
import clsx from 'clsx';

interface Props {
  evaluation: Evaluation;
  highlightedCriterionId: string | null;
  onClickEvidence: (evidenceId: string) => void;
}

export function EvidencePanel({ evaluation, highlightedCriterionId, onClickEvidence }: Props) {
  if (evaluation.evidence.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg mb-2">Evidence</h2>
        <p className="text-sm text-ink-muted">No evidence quotes captured for this evaluation.</p>
      </div>
    );
  }

  // Group evidence by criterion
  const grouped = new Map<string, typeof evaluation.evidence>();
  for (const ev of evaluation.evidence) {
    const arr = grouped.get(ev.criterionId) ?? [];
    arr.push(ev);
    grouped.set(ev.criterionId, arr);
  }

  // Map criterion id to label
  const labelById = new Map<string, string>();
  for (const s of evaluation.sections) {
    for (const c of s.criteria) labelById.set(c.id, c.label);
  }

  return (
    <div className="card">
      <header className="mb-3">
        <h2 className="text-lg">Evidence</h2>
        <p className="text-sm text-ink-muted">Quoted moments mapped to rubric criteria. Click a quote to scroll the transcript.</p>
      </header>
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
        {[...grouped.entries()].map(([critId, quotes]) => (
          <div
            key={critId}
            className={clsx(
              'rounded-xl border p-3 transition',
              highlightedCriterionId === critId
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-line dark:border-line-dark',
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
              {labelById.get(critId) ?? critId}
            </p>
            <div className="space-y-2">
              {quotes.map((q) => (
                <button
                  key={q.id}
                  onClick={() => onClickEvidence(q.id)}
                  className="w-full text-left rounded-lg bg-surface-alt dark:bg-surface-dark px-3 py-2 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {q.speaker && <span className="text-xs font-semibold uppercase text-ink-muted">{q.speaker}</span>}
                    {typeof q.startMs === 'number' && (
                      <span className="text-xs text-ink-muted tabular-nums">
                        {durationLabel(Math.floor(q.startMs / 1000))}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">"{q.text}"</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
