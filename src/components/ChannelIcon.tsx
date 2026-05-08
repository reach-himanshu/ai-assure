import type { Channel } from '@/lib/types';
import clsx from 'clsx';

interface Props {
  channel: Channel;
  size?: number;
  className?: string;
}

export function ChannelIcon({ channel, size = 16, className }: Props) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 1.8, stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: clsx(className) };
  switch (channel) {
    case 'call':
      return (
        <svg {...props}>
          <path d="M5 4h3l2 5-2 1c1 3 3 5 6 6l1-2 5 2v3c0 1-1 2-2 2A14 14 0 0 1 3 6c0-1 1-2 2-2z" />
        </svg>
      );
    case 'email':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...props}>
          <path d="M21 12a8 8 0 0 1-8 8H6l-3 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
        </svg>
      );
    case 'portal':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 14h6M8 17h4" />
        </svg>
      );
    case 'csat':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
        </svg>
      );
  }
}

export function channelColor(channel: Channel): string {
  switch (channel) {
    case 'call': return 'text-brand-700 bg-brand-100 dark:bg-brand-900/40 dark:text-brand-300';
    case 'email': return 'text-sky-700 bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300';
    case 'chat': return 'text-violet-700 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300';
    case 'portal': return 'text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300';
    case 'csat': return 'text-rose-700 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300';
  }
}
