import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useApp, useCurrentUser } from '@/stores';
import { KpiTile } from '@/components/KpiTile';
import { ChannelChips } from '@/components/ChannelChips';
import { TimeRangeChips, type RangeDays } from '@/components/TimeRangeChips';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';
import { compactNumber, excludeNesting, pct } from '@/lib/format';
import { bucketByChannel } from '@/lib/channelMetrics';
import { CHANNEL_LABEL, type Channel } from '@/lib/types';
import { CallDurationHistogram } from './widgets/CallDurationHistogram';
import { ResponseTimeHistogram } from './widgets/ResponseTimeHistogram';
import { PerSectionPassRate } from './widgets/PerSectionPassRate';
import { CSATSection } from './widgets/CSATSection';

const CHANNEL_QUERY_KEY = 'channel';
const RANGE_QUERY_KEY = 'range';
// CSAT excluded: it's a cross-channel dimension (every CSAT is *about* an
// interaction on one of these channels), not a peer. Its own section lives below.
const VALID_CHANNELS: ('all' | Channel)[] = ['all', 'call', 'email', 'portal', 'chat'];
const VALID_RANGES: RangeDays[] = [7, 14, 30, 60];

export function Insights() {
  const me = useCurrentUser();
  const evaluations = useApp((s) => s.evaluations);
  const users = useApp((s) => s.users);
  const storedRange = useApp((s) => s.insightsRangeDays);
  const setStoredRange = useApp((s) => s.setInsightsRangeDays);
  const [searchParams, setSearchParams] = useSearchParams();

  const visibleEvals = useMemo(() => {
    if (!me) return [] as typeof evaluations;
    if (me.role === 'supervisor') {
      const team = new Set(users.filter((u) => u.supervisorId === me.id).map((u) => u.id));
      return evaluations.filter((e) => team.has(e.agentId));
    }
    return evaluations;
  }, [evaluations, users, me]);

  // Channel filter — URL is the source of truth. Reading via searchParams means
  // direct navigation (Dashboard's ByChannelSection link) and chip clicks both
  // stay in sync via the same mechanism.
  const channelParam = searchParams.get(CHANNEL_QUERY_KEY);
  const channel: 'all' | Channel = VALID_CHANNELS.includes(channelParam as 'all' | Channel)
    ? (channelParam as 'all' | Channel)
    : 'all';
  const setChannel = (next: 'all' | Channel) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete(CHANNEL_QUERY_KEY);
    else params.set(CHANNEL_QUERY_KEY, next);
    setSearchParams(params, { replace: true });
  };

  // Time range — URL ?range= wins; otherwise the user's last choice from
  // localStorage; otherwise default 30d.
  const rangeParam = parseInt(searchParams.get(RANGE_QUERY_KEY) ?? '', 10);
  const rangeDays: RangeDays = VALID_RANGES.includes(rangeParam as RangeDays)
    ? (rangeParam as RangeDays)
    : storedRange;
  const setRangeDays = (next: RangeDays) => {
    setStoredRange(next);
    const params = new URLSearchParams(searchParams);
    if (next === 30) params.delete(RANGE_QUERY_KEY); // 30d is the default; clean URL
    else params.set(RANGE_QUERY_KEY, String(next));
    setSearchParams(params, { replace: true });
  };

  const filtered = useMemo(
    () => (channel === 'all' ? visibleEvals : visibleEvals.filter((e) => e.channel === channel)),
    [visibleEvals, channel],
  );

  // Evaluations within the chosen time range. All downstream useMemos depend on
  // this so the entire page re-renders when the range chip changes.
  const last30 = useMemo(
    () => filtered.filter((e) => dayjs(e.caseDateTime).isAfter(dayjs().subtract(rangeDays, 'day'))),
    [filtered, rangeDays],
  );
  const rangeLabel = rangeDays === 7 ? 'last 7 days' : rangeDays === 14 ? 'last 14 days' : rangeDays === 30 ? 'last 30 days' : 'last 60 days';
  const counts = useMemo(() => {
    // Exclude CSAT from chip counts — it's not a peer channel.
    const b = bucketByChannel(visibleEvals);
    const nonCsatCount = b.call.length + b.email.length + b.portal.length + b.chat.length;
    return {
      all: nonCsatCount,
      call: b.call.length,
      email: b.email.length,
      portal: b.portal.length,
      chat: b.chat.length,
    };
  }, [visibleEvals]);

  // Calibration: AI confidence vs. resulting band (filtered by channel)
  const calibration = useMemo(() => {
    const buckets = [
      { range: '60-69', min: 60, max: 70 },
      { range: '70-79', min: 70, max: 80 },
      { range: '80-89', min: 80, max: 90 },
      { range: '90-99', min: 90, max: 100 },
    ];
    return buckets.map((b) => {
      const inB = filtered.filter((e) => e.aiConfidencePct >= b.min && e.aiConfidencePct < b.max);
      const passed = inB.filter((e) => e.band === 'pass').length;
      return {
        range: b.range,
        confidence: b.min + 5,
        actualPassRate: inB.length ? Math.round((passed / inB.length) * 100) : 0,
        n: inB.length,
      };
    });
  }, [filtered]);

  // Per-criterion fail frequency (CSAT skipped — CSATSection handles its own analysis)
  const failingCriteria = useMemo(() => {
    const counts: Record<string, { label: string; fails: number; sectionLabel: string }> = {};
    for (const e of last30) {
      if (e.channel === 'csat') continue;
      for (const s of e.sections) {
        for (const c of s.criteria) {
          if (c.value === 'no' || c.value === 'none' || c.value === 'partial') {
            counts[c.id] = counts[c.id] ?? { label: c.label, fails: 0, sectionLabel: s.label };
            counts[c.id]!.fails += 1;
          }
        }
      }
    }
    return Object.values(counts).sort((a, b) => b.fails - a.fails).slice(0, 8);
  }, [last30]);

  const channelLabel = channel === 'all' ? 'All channels' : CHANNEL_LABEL[channel];

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl">Insights</h1>
          <p className="text-sm text-ink-muted mt-1">Calibration, sentiment, and failure modes across evaluations.</p>
        </div>
        <TimeRangeChips value={rangeDays} onChange={setRangeDays} />
      </div>

      <div className="card-tight mb-5">
        <p className="label mb-2">Channel</p>
        <ChannelChips value={channel} onChange={setChannel} counts={counts} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile label={`Evaluations (${rangeLabel} · ${channelLabel})`} value={compactNumber(last30.length)} />
        <KpiTile label="Avg score" value={(() => { const c = excludeNesting(last30); return c.length === 0 ? '—' : pct(c.reduce((s, e) => s + e.overallPct, 0) / c.length); })()} />
        <KpiTile label="Pass rate" value={(() => { const c = excludeNesting(last30); return c.length === 0 ? '—' : pct((c.filter((e) => e.band === 'pass').length / c.length) * 100); })()} tone="pass" />
        <KpiTile label="Failing criteria tracked" value={failingCriteria.length.toString()} hint={rangeLabel} />
      </div>

      {/* Channel-native widgets — only when a specific channel is selected.
          The universal "Top failing criteria" panel below is already Call-scoped
          via the channel filter, so we don't duplicate it here. */}
      {channel === 'call' && (
        <div className="mb-5">
          <CallDurationHistogram evaluations={last30} />
        </div>
      )}

      {channel === 'email' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          <ResponseTimeHistogram evaluations={last30} channelLabel="Email" />
          <PerSectionPassRate evaluations={last30} title="Section performance · Email" />
        </div>
      )}

      {/* Quality charts — Calibration + Top failing criteria */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">Calibration</h2>
            <p className="text-xs text-ink-muted">Actual pass rate by AI confidence band · {channelLabel}</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={calibration}>
                <XAxis dataKey="range" stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#5B6760" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="actualPassRate" name="Actual pass %" fill="#2F6B1E" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <header className="mb-3">
            <h2 className="text-lg">Top failing criteria</h2>
            <p className="text-xs text-ink-muted capitalize-first">{rangeLabel} · {channelLabel}</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={failingCriteria} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" stroke="#5B6760" fontSize={11} width={210} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="fails" radius={[0, 6, 6, 0]} fill="#A4262C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Customer satisfaction — dedicated section, always visible, filters by
          parentChannel against the active chip. CSAT is a cross-channel dimension,
          not a peer channel, so it lives here rather than as a chip option. */}
      <CSATSection evaluations={visibleEvals} channel={channel} rangeDays={rangeDays} rangeLabel={rangeLabel} />
    </div>
  );
}
