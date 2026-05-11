import clsx from 'clsx';
import { ChannelIcon, channelColor } from './ChannelIcon';
import { CHANNEL_LABEL, type Channel } from '@/lib/types';

interface Props {
  value: 'all' | Channel;
  onChange: (v: 'all' | Channel) => void;
  /** Optional counts to show on each chip (e.g., # of evals per channel). */
  counts?: Partial<Record<'all' | Channel, number>>;
  /** Pass `true` to render in a more compact form (smaller padding). */
  compact?: boolean;
  className?: string;
}

// CSAT is intentionally excluded: it's a customer-feedback dimension *about*
// an interaction on one of the four channels, not a peer channel. CSAT has
// its own dedicated section on Insights, filtered by parentChannel.
const CHANNELS: ('all' | Channel)[] = ['all', 'call', 'email', 'portal', 'chat'];

export function ChannelChips({ value, onChange, counts, compact, className }: Props) {
  return (
    <div className={clsx('flex items-center gap-2 flex-wrap', className)} role="tablist" aria-label="Filter by channel">
      {CHANNELS.map((c) => {
        const active = value === c;
        const label = c === 'all' ? 'All channels' : CHANNEL_LABEL[c as Channel];
        const count = counts?.[c];
        return (
          <button
            key={c}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(c)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all',
              compact ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
              active
                ? 'bg-brand-600 text-white border-brand-700 shadow-sm'
                : 'bg-surface dark:bg-surface-dark-alt border-line dark:border-line-dark text-ink-muted hover:border-brand-400 hover:text-ink dark:hover:text-[#F1F5EE]',
            )}
          >
            {c !== 'all' && (
              <span className={clsx('inline-flex items-center', active && 'opacity-90')}>
                <ChannelIcon channel={c as Channel} size={compact ? 11 : 13} className={!active ? channelColor(c as Channel).split(' ')[0] : ''} />
              </span>
            )}
            <span>{label}</span>
            {typeof count === 'number' && (
              <span
                className={clsx(
                  'tabular-nums rounded-full px-1.5',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-alt dark:bg-surface-dark text-ink-muted',
                  compact ? 'text-[10px] py-0.5' : 'text-[11px] py-0.5',
                )}
              >
                {count.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
