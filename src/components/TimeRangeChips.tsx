import clsx from 'clsx';

export type RangeDays = 7 | 14 | 30 | 60;

const RANGES: { value: RangeDays; label: string }[] = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
];

interface Props {
  value: RangeDays;
  onChange: (v: RangeDays) => void;
  className?: string;
}

export function TimeRangeChips({ value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Time range"
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark-alt p-0.5',
        className,
      )}
    >
      {RANGES.map((r) => {
        const active = value === r.value;
        return (
          <button
            key={r.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r.value)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all tabular-nums',
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-ink-muted hover:text-ink dark:hover:text-[#F1F5EE] hover:bg-surface-alt dark:hover:bg-surface-dark',
            )}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
