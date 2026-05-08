import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { useApp } from '@/stores';
import { useToast } from '@/components/Toast';
import { isWithinAppealWindow, formatDate, daysSince } from '@/lib/dates';
import type { Evaluation } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  evaluation: Evaluation;
}

const REASONS = [
  'Evidence does not support the criterion scoring.',
  'Standard closing was provided — please re-review.',
  "Empathy score does not reflect the customer's tone.",
  'Authentication path was alternate but compliant.',
  'Documentation criterion was met outside the cited window.',
  'Other',
];

export function AppealModal({ open, onClose, evaluation }: Props) {
  const fileAppeal = useApp((s) => s.fileAppeal);
  const config = useApp((s) => s.config);
  const toast = useToast();

  const [reason, setReason] = useState(REASONS[0]!);
  const [comment, setComment] = useState('');
  const [attachment, setAttachment] = useState<string | undefined>();

  const within = isWithinAppealWindow(evaluation.caseDateTime, config.appealWindowDays);
  const daysOpen = daysSince(evaluation.caseDateTime);
  const daysLeft = config.appealWindowDays - daysOpen;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    fileAppeal(evaluation.id, {
      reason,
      agentComment: comment.trim(),
      attachmentName: attachment,
    });
    toast(`Appeal filed. Your supervisor will review within ${config.appealWindowDays} days.`, 'success');
    setComment('');
    setAttachment(undefined);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="File an appeal"
      description="Tell your supervisor what should be re-reviewed. Be specific so they can find the moment quickly."
    >
      {!within ? (
        <div className="rounded-xl border border-band-fail/30 bg-band-fail/10 p-4 text-sm">
          <p className="font-semibold text-band-fail">Appeal window has closed</p>
          <p className="mt-1 text-ink dark:text-[#F1F5EE]">
            This evaluation is from {formatDate(evaluation.caseDateTime)} ({daysOpen} days ago). Appeals must be filed
            within {config.appealWindowDays} days of the interaction. Reach out to your supervisor directly
            if you'd still like a re-review.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-900/40 px-4 py-3 text-sm">
            <span className="font-semibold">Within window:</span> {daysLeft} day{daysLeft === 1 ? '' : 's'} remaining to file.
          </div>
          <div>
            <label className="label">Reason</label>
            <select className="input mt-1" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Your comment <span className="text-band-fail">*</span></label>
            <textarea
              className="input mt-1 min-h-[120px]"
              required
              placeholder="Walk us through the moment in question — quote the transcript or call out the timestamp."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <p className="text-xs text-ink-muted mt-1">
              {comment.length}/600 characters
            </p>
          </div>
          <div>
            <label className="label">Supporting evidence (optional)</label>
            <div className="mt-1 flex items-center gap-3">
              <label className="btn-secondary text-sm cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAttachment(e.target.files?.[0]?.name)}
                />
                Attach file
              </label>
              {attachment && (
                <span className="text-sm text-ink-muted">{attachment}</span>
              )}
            </div>
          </div>
          <footer className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!comment.trim()}>
              File appeal
            </button>
          </footer>
        </form>
      )}
    </Modal>
  );
}
