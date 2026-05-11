import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { Channel, Evaluation } from '@/lib/types';
import { CHANNEL_LABEL } from '@/lib/types';
import { ChannelIcon, channelColor } from '@/components/ChannelIcon';
import { avgScore, bucketByChannel, lastNDays, sparklineSeries } from '@/lib/channelMetrics';
import { pct } from '@/lib/format';

interface Props {
  evaluations: Evaluation[];
  /** Header text — tailored per persona ("Your interactions by channel" vs "Team by channel"). */
  title: string;
  /** Optional subtitle. */
  hint?: string;
}

// CSAT is intentionally excluded: it's not a peer channel — every CSAT
// response is tied to one of the four interaction channels via parentChannel.
// Customer-satisfaction analytics live in their own section on the Insights page.
const CHANNELS: Channel[] = ['call', 'email', 'portal', 'chat'];

export function ByChannelSection({ evaluations, title, hint }: Props) {
  const last30 = useMemo(() => lastNDays(evaluations, 30), [evaluations]);
  const buckets = useMemo(() => bucketByChannel(last30), [last30]);

  return (
    <section className="card mb-6">
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-lg">{title}</h2>
          <p className="text-xs text-ink-muted">{hint ?? 'Last 30 days · click any channel to deep-dive'}</p>
        </div>
        <Link to="/app/insights" className="text-sm font-semibold text-brand-700 dark:text-brand-300 hover:underline">
          All insights →
        </Link>
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CHANNELS.map((ch) => {
          const evs = buckets[ch];
          const count = evs.length;
          const avg = avgScore(evs);
          const series = sparklineSeries(evs, 14);
          const hasSeries = series.some((d) => d.count > 0);
          return (
            <Link
              key={ch}
              to={`/app/insights?channel=${ch}`}
              className={clsx(
                'rounded-xl border border-line dark:border-line-dark p-3 transition-all',
                'hover:border-brand-500 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500',
                'flex flex-col gap-1 bg-surface-alt/40 dark:bg-surface-dark',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={clsx('pill', channelColor(ch))}>
                  <ChannelIcon channel={ch} size={11} />
                  {CHANNEL_LABEL[ch]}
                </span>
                <span className="text-[11px] text-ink-muted tabular-nums">{count.toLocaleString()}</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={clsx(
                    'text-2xl font-semibold tabular-nums',
                    avg === null
                      ? 'text-ink-muted'
                      : avg >= 90
                        ? 'text-band-pass'
                        : avg >= 75
                          ? 'text-band-review'
                          : 'text-band-fail',
                  )}
                >
                  {avg === null ? '—' : pct(avg)}
                </span>
                <span className="text-[10px] text-ink-muted uppercase tracking-wide">avg score</span>
              </div>
              <div className="h-8 -mx-1 mt-1">
                {hasSeries ? (
                  <ResponsiveContainer>
                    <LineChart data={series}>
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#2F6B1E"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-ink-muted">no activity</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
