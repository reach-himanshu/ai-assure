import clsx from 'clsx';
import type { Band } from '@/lib/types';
import { BAND_LABEL } from '@/lib/types';
import { bandColor, pct } from '@/lib/format';

interface Props {
  band: Band;
  pct: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ScoreBadge({ band, pct: value, size = 'md', showLabel = true, className }: Props) {
  const c = bandColor(band);
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border font-semibold tabular-nums',
        c.bg,
        c.text,
        c.border,
        size === 'sm' && 'text-xs px-2.5 py-0.5',
        size === 'md' && 'text-sm px-3 py-1',
        size === 'lg' && 'text-base px-4 py-1.5',
        className,
      )}
    >
      <span>{pct(value)}</span>
      {showLabel && <span className="opacity-80">·</span>}
      {showLabel && <span>{BAND_LABEL[band]}</span>}
    </span>
  );
}

export function ConfidencePill({ pct: value }: { pct: number }) {
  const tone = value >= 90 ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200' : value >= 80 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200';
  return (
    <span className={clsx('pill', tone)}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      AI {pct(value)}
    </span>
  );
}
