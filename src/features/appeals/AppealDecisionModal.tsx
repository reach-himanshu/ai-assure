import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { useApp } from '@/stores';
import { useToast } from '@/components/Toast';
import type { Evaluation } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  evaluation: Evaluation;
}

type Outcome = 'upheld' | 'overturned' | 'partially_adjusted';

export function AppealDecisionModal({ open, onClose, evaluation }: Props) {
  const decideAppeal = useApp((s) => s.decideAppeal);
  const toast = useToast();

  const [outcome, setOutcome] = useState<Outcome>('upheld');
  const [delta, setDelta] = useState<number>(8);
  const [notes, setNotes] = useState('');

  if (!evaluation.appeal) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    decideAppeal(evaluation.appeal!.id, {
      status: outcome,
      scoreDeltaPct: outcome === 'partially_adjusted' ? delta : outcome === 'overturned' ? Math.max(0, 90 - evaluation.overallPct) : 0,
      decisionNotes: notes.trim(),
    });
    toast(
      outcome === 'upheld'
        ? 'Original score upheld.'
        : outcome === 'overturned'
        ? 'Decision overturned — score raised to passing band.'
        : `Score adjusted by ${delta > 0 ? '+' : ''}${delta} pts.`,
      'success',
    );
    onClose();
  };

  const Choice = ({ value, title, body }: { value: Outcome; title: string; body: string }) => (
    <button
      type="button"
      onClick={() => setOutcome(value)}
      className={
        'text-left rounded-xl border px-4 py-3 transition ' +
        (outcome === value
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-line dark:border-line-dark hover:border-brand-300')
      }
    >
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-ink-muted mt-1">{body}</p>
    </button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Decide appeal"
      description="Choose an outcome, adjust the score if needed, and document your reasoning. The agent will see your decision."
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-xl bg-surface-alt dark:bg-surface-dark p-4">
          <p className="label">Agent's appeal</p>
          <p className="text-sm mt-1">"{evaluation.appeal.reason}"</p>
          <p className="text-sm mt-2 italic text-ink-muted">{evaluation.appeal.agentComment}</p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Choice value="upheld" title="Uphold original score" body="Original scoring stands. No score change." />
          <Choice value="partially_adjusted" title="Partially adjust" body="Adjust the score by a specific delta you choose below." />
          <Choice value="overturned" title="Overturn" body="Raise the score to passing (≥ 90%)." />
        </div>

        {outcome === 'partially_adjusted' && (
          <div>
            <label className="label">Score delta (pts)</label>
            <input
              type="range"
              min={-20}
              max={20}
              step={1}
              value={delta}
              onChange={(e) => setDelta(parseInt(e.target.value, 10))}
              className="w-full mt-2"
            />
            <p className="text-sm mt-1 tabular-nums">
              <span className="font-semibold">{delta > 0 ? '+' : ''}{delta} pts</span>
              <span className="text-ink-muted"> · final score will be {(Math.max(0, Math.min(100, evaluation.overallPct + delta))).toFixed(0)}%</span>
            </p>
          </div>
        )}

        <div>
          <label className="label">Decision notes <span className="text-band-fail">*</span></label>
          <textarea
            required
            className="input mt-1 min-h-[100px]"
            placeholder="What did you find? Reference specific moments or rubric criteria."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <footer className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!notes.trim()}>
            Submit decision
          </button>
        </footer>
      </form>
    </Modal>
  );
}
