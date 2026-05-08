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

export function ManualEvaluateModal({ open, onClose, evaluation }: Props) {
  const manualEvaluate = useApp((s) => s.manualEvaluate);
  const toast = useToast();

  const [startBlank, setStartBlank] = useState(true);
  const [reason, setReason] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    manualEvaluate(evaluation.id, { startBlank, reason: reason.trim() || undefined });
    toast(
      startBlank
        ? 'Manual evaluation started. Score each criterion to publish.'
        : 'Switched to manual mode. AI scores kept as a starting point.',
      'success',
    );
    onClose();
  };

  const Choice = ({
    value,
    title,
    body,
  }: {
    value: boolean;
    title: string;
    body: string;
  }) => (
    <button
      type="button"
      onClick={() => setStartBlank(value)}
      className={
        'text-left rounded-xl border px-4 py-3 transition ' +
        (startBlank === value
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
      title="Manually evaluate this interaction"
      description="Switches the evaluation status to Manual. Use this when the AI grader is being tuned, or when you want to override the AI's scoring from scratch."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <Choice
            value={true}
            title="Start from blank"
            body="All criteria reset to N/A. Score each one fresh, the way you would in Verint."
          />
          <Choice
            value={false}
            title="Start from current AI scores"
            body="Keeps the AI's per-criterion picks as a starting point so you only adjust where it got it wrong."
          />
        </div>

        <div>
          <label className="label">Reason (optional)</label>
          <textarea
            className="input mt-1 min-h-[80px]"
            placeholder="e.g., AI grader being recalibrated; sensitive PHI flow needs human eyes."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 px-4 py-3 text-sm">
          The agent will see your final scoring and any comments you add — same as today. Manual evaluations follow the same audit trail.
        </div>

        <footer className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Switch to manual</button>
        </footer>
      </form>
    </Modal>
  );
}
