import type { Band } from './types';

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}

export function pct1(n: number): string {
  return `${(Math.round(n * 10) / 10).toFixed(1)}%`;
}

export function bandColor(band: Band): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  switch (band) {
    case 'pass':
      return {
        bg: 'bg-band-pass/10 dark:bg-band-pass/20',
        text: 'text-band-pass dark:text-brand-300',
        border: 'border-band-pass/30',
        ring: 'ring-band-pass/40',
      };
    case 'needs_review':
      return {
        bg: 'bg-band-review/10 dark:bg-band-review/20',
        text: 'text-band-review',
        border: 'border-band-review/30',
        ring: 'ring-band-review/40',
      };
    case 'fail':
      return {
        bg: 'bg-band-fail/10 dark:bg-band-fail/20',
        text: 'text-band-fail',
        border: 'border-band-fail/30',
        ring: 'ring-band-fail/40',
      };
  }
}

export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return `${n}`;
}

export function id(prefix: string, n: number): string {
  return `${prefix}-${n.toString().padStart(5, '0')}`;
}
