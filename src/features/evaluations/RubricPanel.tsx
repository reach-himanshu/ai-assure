import { useState } from 'react';
import clsx from 'clsx';
import type { Evaluation, RubricCriterion, RubricSection } from '@/lib/types';
import { CONTRIBUTION_LABEL } from '@/lib/types';
import { useApp, useCurrentUser } from '@/stores';
import { useToast } from '@/components/Toast';
import { pct } from '@/lib/format';

interface Props {
  evaluation: Evaluation;
  onEvidenceFocus: (criterionId: string) => void;
}

const FPNNA: RubricCriterion['value'][] = ['full', 'partial', 'none', 'na'];
const YNNA: RubricCriterion['value'][] = ['yes', 'no', 'na'];

export function RubricPanel({ evaluation, onEvidenceFocus }: Props) {
  const me = useCurrentUser();
  const overrideCriterion = useApp((s) => s.overrideCriterion);
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(evaluation.sections[0]?.id ?? null);

  const canOverride = me?.role === 'qa_admin' || me?.role === 'supervisor';

  if (evaluation.channel === 'csat') {
    return <CSATPanel evaluation={evaluation} />;
  }

  return (
    <div className="card">
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg">Rubric</h2>
        {evaluation.channel !== 'call' && (
          <span className="text-xs text-ink-muted">Weighted · sections must total 100%</span>
        )}
      </header>
      <div className="space-y-3">
        {evaluation.sections.map((section) => (
          <SectionPanel
            key={section.id}
            section={section}
            isOpen={openId === section.id}
            onToggle={() => setOpenId((id) => (id === section.id ? null : section.id))}
            canOverride={canOverride}
            channelType={evaluation.channel === 'call' ? 'fpnna' : 'ynna'}
            onOverride={(criterionId, value) => {
              overrideCriterion(evaluation.id, section.id, criterionId, value);
              toast(`Updated "${value}" — score recalculated.`, 'success');
            }}
            onEvidenceFocus={onEvidenceFocus}
          />
        ))}
      </div>
    </div>
  );
}

function SectionPanel({
  section,
  isOpen,
  onToggle,
  canOverride,
  channelType,
  onOverride,
  onEvidenceFocus,
}: {
  section: RubricSection;
  isOpen: boolean;
  onToggle: () => void;
  canOverride: boolean;
  channelType: 'fpnna' | 'ynna';
  onOverride: (criterionId: string, value: RubricCriterion['value']) => void;
  onEvidenceFocus: (criterionId: string) => void;
}) {
  const sectionScore = section.sectionScorePct;
  const tone =
    sectionScore >= 90 ? 'text-band-pass' : sectionScore >= 75 ? 'text-band-review' : 'text-band-fail';

  return (
    <div className="rounded-xl border border-line dark:border-line-dark overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-alt dark:bg-surface-dark hover:bg-brand-50 dark:hover:bg-brand-900/20 transition"
      >
        <div className="flex items-center gap-3 text-left">
          <svg
            className={clsx('w-4 h-4 text-ink-muted transition-transform', isOpen && 'rotate-90')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <div>
            <div className="font-semibold">
              {section.label}
              {typeof section.weightPct === 'number' && (
                <span className="text-xs text-ink-muted font-normal ml-2">{section.weightPct}%</span>
              )}
            </div>
            <div className="text-xs text-ink-muted">
              Contribution: {CONTRIBUTION_LABEL[section.contribution]}
            </div>
          </div>
        </div>
        <span className={clsx('font-semibold tabular-nums', tone)}>{pct(sectionScore)}</span>
      </button>
      {isOpen && (
        <div className="divide-y divide-line dark:divide-line-dark">
          {section.criteria.map((c) => (
            <CriterionRow
              key={c.id}
              criterion={c}
              channelType={channelType}
              canOverride={canOverride}
              onOverride={(v) => onOverride(c.id, v)}
              onEvidenceFocus={() => onEvidenceFocus(c.id)}
            />
          ))}
          {section.comments && (
            <div className="px-4 py-3 bg-brand-50/50 dark:bg-brand-900/10 text-sm">
              <p className="label mb-1">Reviewer comments</p>
              <p className="text-ink dark:text-[#F1F5EE]">{section.comments}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CriterionRow({
  criterion,
  channelType,
  canOverride,
  onOverride,
  onEvidenceFocus,
}: {
  criterion: RubricCriterion;
  channelType: 'fpnna' | 'ynna';
  canOverride: boolean;
  onOverride: (v: RubricCriterion['value']) => void;
  onEvidenceFocus: () => void;
}) {
  const options = channelType === 'fpnna' ? FPNNA : YNNA;
  const valueColor = (v: string) => {
    if (v === 'full' || v === 'yes') return 'bg-band-pass text-white';
    if (v === 'partial') return 'bg-band-review text-white';
    if (v === 'none' || v === 'no') return 'bg-band-fail text-white';
    return 'bg-surface-alt dark:bg-surface-dark text-ink-muted';
  };
  const valueLabel = (v: string) => {
    if (v === 'full') return 'Full';
    if (v === 'partial') return 'Partial';
    if (v === 'none') return 'None';
    if (v === 'yes') return 'Yes';
    if (v === 'no') return 'No';
    return 'N/A';
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium">{criterion.label}</div>
          {typeof criterion.weightPct === 'number' && (
            <div className="text-xs text-ink-muted">{criterion.weightPct}% weight</div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {options.map((opt) => (
            <button
              key={opt}
              disabled={!canOverride}
              onClick={() => canOverride && onOverride(opt)}
              className={clsx(
                'rounded-lg text-xs font-semibold px-2 py-1 transition-all',
                criterion.value === opt
                  ? valueColor(opt) + ' shadow-sm'
                  : 'bg-surface-alt dark:bg-surface-dark text-ink-muted hover:bg-brand-100 dark:hover:bg-brand-900/40',
                !canOverride && 'cursor-default',
              )}
              aria-pressed={criterion.value === opt}
            >
              {valueLabel(opt)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-start justify-between gap-4">
        <p className="text-xs text-ink-muted leading-relaxed flex-1">{criterion.rationale}</p>
        {criterion.evidenceQuoteIds.length > 0 && (
          <button onClick={onEvidenceFocus} className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:underline shrink-0">
            View evidence ({criterion.evidenceQuoteIds.length})
          </button>
        )}
      </div>
    </div>
  );
}

function CSATPanel({ evaluation }: { evaluation: Evaluation }) {
  if (!evaluation.csat) return null;
  return (
    <div className="card space-y-4">
      <header>
        <h2 className="text-lg">CSAT response</h2>
        <p className="text-sm text-ink-muted">Customer survey response and theme analysis.</p>
      </header>
      <div className="grid grid-cols-2 gap-4">
        <Stat label="Score" value={`${evaluation.csat.score}/5`} />
        <Stat label="Sentiment" value={evaluation.csat.sentiment === 'pos' ? 'Positive' : evaluation.csat.sentiment === 'neg' ? 'Negative' : 'Neutral'} />
      </div>
      <div>
        <p className="label mb-1">Verbatim</p>
        <p className="italic">"{evaluation.csat.verbatim}"</p>
      </div>
      <div>
        <p className="label mb-2">Detected themes</p>
        <div className="flex gap-2 flex-wrap">
          {evaluation.csat.themes.map((t) => (
            <span key={t} className="pill bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-2xl font-semibold mt-0.5">{value}</p>
    </div>
  );
}
