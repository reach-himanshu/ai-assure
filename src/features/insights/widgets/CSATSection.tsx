import { useMemo } from 'react';
import dayjs from 'dayjs';
import clsx from 'clsx';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  LabelList,
} from 'recharts';
import type { Channel, Evaluation } from '@/lib/types';
import { CHANNEL_LABEL } from '@/lib/types';
import { ChannelIcon, channelColor } from '@/components/ChannelIcon';

interface Props {
  /** All visible evaluations (persona-scoped) — the section selects CSATs itself. */
  evaluations: Evaluation[];
  /** Active channel chip — when set to a specific channel, filter to that
   *  parentChannel; when 'all', show org-wide + the source-channel breakdown. */
  channel: 'all' | Channel;
  /** Time-range window, in days. Defaults to 30 for back-compat. */
  rangeDays?: number;
  /** Human-readable range label for the header (e.g., "last 30 days"). */
  rangeLabel?: string;
}

export function CSATSection({ evaluations, channel, rangeDays = 30, rangeLabel = 'last 30 days' }: Props) {
  // Always work from CSAT evals only, then optionally filter by parentChannel.
  const allCsat = useMemo(() => evaluations.filter((e) => e.channel === 'csat' && e.csat), [evaluations]);
  const filtered = useMemo(() => {
    if (channel === 'all' || channel === 'csat') return allCsat;
    return allCsat.filter((e) => e.csat?.parentChannel === channel);
  }, [allCsat, channel]);

  const last30 = useMemo(
    () => filtered.filter((e) => dayjs(e.caseDateTime).isAfter(dayjs().subtract(rangeDays, 'day'))),
    [filtered, rangeDays],
  );

  const totalResponses = last30.length;
  const avgScore = totalResponses === 0 ? 0 : last30.reduce((s, e) => s + (e.csat?.score ?? 0), 0) / totalResponses;
  const promoters = last30.filter((e) => (e.csat?.score ?? 0) >= 4).length;
  const detractors = last30.filter((e) => (e.csat?.score ?? 0) <= 2).length;
  const npsLike = totalResponses === 0 ? 0 : Math.round(((promoters - detractors) / totalResponses) * 100);

  // 1-5 distribution
  const distribution = useMemo(() => {
    const buckets = [1, 2, 3, 4, 5].map((s) => ({ score: `${s}★`, count: 0 }));
    for (const e of last30) {
      const s = e.csat?.score ?? 0;
      if (s >= 1 && s <= 5) buckets[s - 1]!.count += 1;
    }
    return buckets;
  }, [last30]);

  // Sentiment trend over the chosen window
  const sentimentTrend = useMemo(() => {
    const days: { date: string; pos: number; neu: number; neg: number }[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const day = dayjs().subtract(i, 'day');
      const dayCsat = filtered.filter((e) => dayjs(e.caseDateTime).isSame(day, 'day'));
      days.push({
        date: day.format('MMM D'),
        pos: dayCsat.filter((e) => e.csat?.sentiment === 'pos').length,
        neu: dayCsat.filter((e) => e.csat?.sentiment === 'neu').length,
        neg: dayCsat.filter((e) => e.csat?.sentiment === 'neg').length,
      });
    }
    return days;
  }, [filtered, rangeDays]);

  // Themes (top 8)
  const themes = useMemo(() => {
    const counts: Record<string, { theme: string; count: number; pos: number; neg: number }> = {};
    for (const e of last30) {
      if (!e.csat) continue;
      for (const t of e.csat.themes) {
        counts[t] = counts[t] ?? { theme: t, count: 0, pos: 0, neg: 0 };
        counts[t]!.count += 1;
        if (e.csat.sentiment === 'pos') counts[t]!.pos += 1;
        if (e.csat.sentiment === 'neg') counts[t]!.neg += 1;
      }
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [last30]);

  // Source-channel breakdown (only meaningful when chip is 'all')
  const sourceBreakdown = useMemo(() => {
    const channels: ('call' | 'email' | 'portal' | 'chat')[] = ['call', 'email', 'portal', 'chat'];
    return channels.map((ch) => {
      const inCh = last30.filter((e) => e.csat?.parentChannel === ch);
      const avg = inCh.length === 0 ? 0 : inCh.reduce((s, e) => s + (e.csat?.score ?? 0), 0) / inCh.length;
      return { channel: ch, label: CHANNEL_LABEL[ch], count: inCh.length, avg: Number(avg.toFixed(2)) };
    });
  }, [last30]);

  const scopeLabel = channel === 'all' ? 'all channels' : `${CHANNEL_LABEL[channel as Channel]} interactions`;

  return (
    <section className="card-tight p-0 border-2 border-rose-200/50 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10 mb-5 overflow-hidden">
      <header className="px-5 py-4 border-b border-rose-200/50 dark:border-rose-900/30 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg flex items-center gap-2">
            <ChannelIcon channel="csat" size={18} className="text-rose-700 dark:text-rose-300" />
            Customer satisfaction
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            {totalResponses.toLocaleString()} CSAT responses · about {scopeLabel} · {rangeLabel}
          </p>
        </div>
        {channel !== 'all' && totalResponses === 0 && (
          <span className="pill bg-ink-muted/10 text-ink-muted">No CSAT for this channel yet</span>
        )}
      </header>
      <div className="p-5 space-y-5">
        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <CsatKpi label="Avg score" value={totalResponses === 0 ? '—' : `${avgScore.toFixed(2)} / 5`} tone={avgScore >= 4 ? 'good' : avgScore >= 3 ? 'mid' : 'bad'} />
          <CsatKpi
            label="Net satisfaction"
            value={totalResponses === 0 ? '—' : `${npsLike > 0 ? '+' : ''}${npsLike}%`}
            hint="(% promoters − % detractors), NPS-style"
            tone={npsLike >= 40 ? 'good' : npsLike >= 0 ? 'mid' : 'bad'}
          />
          <CsatKpi label="Promoters (4–5★)" value={promoters.toLocaleString()} tone="good" />
          <CsatKpi label="Detractors (1–2★)" value={detractors.toLocaleString()} tone="bad" />
        </div>

        {/* Charts grid — adapts when chip is 'all' (3 charts) vs specific (2 charts) */}
        <div className={clsx('grid gap-5', channel === 'all' ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1 xl:grid-cols-2')}>
          {/* Score distribution */}
          <div className="card">
            <header className="mb-3">
              <h3 className="text-base font-semibold">Score distribution</h3>
              <p className="text-xs text-ink-muted">1–5★ counts</p>
            </header>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={distribution} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <XAxis dataKey="score" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(164,38,44,0.06)' }} contentStyle={{ borderRadius: 12, border: '1px solid #E3E7DF', fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {distribution.map((d, i) => (
                      <Cell key={i} fill={i >= 3 ? '#2F6B1E' : i === 2 ? '#B26B00' : '#A4262C'} />
                    ))}
                    <LabelList dataKey="count" position="top" fontSize={11} fontWeight={600} fill="#0E1411" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sentiment trend */}
          <div className="card">
            <header className="mb-3">
              <h3 className="text-base font-semibold">Sentiment trend</h3>
              <p className="text-xs text-ink-muted">Daily count by sentiment</p>
            </header>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={sentimentTrend}>
                  <XAxis dataKey="date" stroke="#5B6760" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#5B6760" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E3E7DF', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="pos" name="Positive" stroke="#2F6B1E" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="neu" name="Neutral" stroke="#B26B00" strokeWidth={2.2} dot={false} />
                  <Line type="monotone" dataKey="neg" name="Negative" stroke="#A4262C" strokeWidth={2.2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Source-channel breakdown — only on 'all' */}
          {channel === 'all' && (
            <div className="card">
              <header className="mb-3">
                <h3 className="text-base font-semibold">CSAT by source channel</h3>
                <p className="text-xs text-ink-muted">Where did these CSAT responses come from?</p>
              </header>
              <div className="space-y-2 mt-2">
                {sourceBreakdown.map((s) => {
                  const maxCount = Math.max(1, ...sourceBreakdown.map((x) => x.count));
                  const widthPct = (s.count / maxCount) * 100;
                  return (
                    <div key={s.channel} className="flex items-center gap-2">
                      <span className={clsx('pill shrink-0', channelColor(s.channel as Channel))}>
                        <ChannelIcon channel={s.channel as Channel} size={11} />
                        {s.label}
                      </span>
                      <div className="flex-1 h-6 bg-surface-alt dark:bg-surface-dark rounded-md overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 bg-rose-300/60 dark:bg-rose-700/40" style={{ width: `${widthPct}%` }} />
                        <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium">
                          <span className="text-ink-muted tabular-nums">{s.count.toLocaleString()}</span>
                          <span className="tabular-nums">{s.avg.toFixed(2)} / 5</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Themes — always at the bottom */}
        <div className="card">
          <header className="mb-3">
            <h3 className="text-base font-semibold">Top themes from verbatims</h3>
            <p className="text-xs text-ink-muted">Auto-extracted from CSAT comments · green = mostly positive, red = mostly negative</p>
          </header>
          <div className="h-56">
            {themes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-ink-muted">No themes detected in this window.</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={themes} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="theme" stroke="#5B6760" fontSize={11} width={130} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E3E7DF', fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {themes.map((t) => (
                      <Cell key={t.theme} fill={t.neg > t.pos ? '#A4262C' : '#2F6B1E'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CsatKpi({ label, value, tone, hint }: { label: string; value: string; tone?: 'good' | 'mid' | 'bad'; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface dark:bg-surface-dark-alt border border-line dark:border-line-dark px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <p
        className={clsx(
          'text-2xl font-semibold tabular-nums mt-1',
          tone === 'good' && 'text-band-pass',
          tone === 'mid' && 'text-band-review',
          tone === 'bad' && 'text-band-fail',
        )}
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-ink-muted mt-0.5">{hint}</p>}
    </div>
  );
}
