import dayjs from 'dayjs';
import type { Channel, Evaluation } from './types';
import { excludeNesting } from './format';

/** Group evaluations by channel. */
export function bucketByChannel(evals: Evaluation[]): Record<Channel, Evaluation[]> {
  const out: Record<Channel, Evaluation[]> = {
    call: [],
    email: [],
    portal: [],
    chat: [],
    csat: [],
  };
  for (const e of evals) out[e.channel].push(e);
  return out;
}

/** Average overall score, excluding nesting evals. Returns null when no countable evals. */
export function avgScore(evals: Evaluation[]): number | null {
  const counted = excludeNesting(evals);
  if (counted.length === 0) return null;
  return counted.reduce((s, e) => s + e.overallPct, 0) / counted.length;
}

/** Pass rate (≥ 90% band) excluding nesting. */
export function passRate(evals: Evaluation[]): number | null {
  const counted = excludeNesting(evals);
  if (counted.length === 0) return null;
  return (counted.filter((e) => e.band === 'pass').length / counted.length) * 100;
}

/** N-day daily-average sparkline series. Returns [{date, score, count}], one per day with data. */
export function sparklineSeries(evals: Evaluation[], days: number): { date: string; score: number; count: number }[] {
  const out: { date: string; score: number; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = dayjs().subtract(i, 'day');
    const dayEvals = excludeNesting(evals.filter((e) => dayjs(e.caseDateTime).isSame(day, 'day')));
    out.push({
      date: day.format('MMM D'),
      score: dayEvals.length ? Math.round(dayEvals.reduce((s, e) => s + e.overallPct, 0) / dayEvals.length) : 0,
      count: dayEvals.length,
    });
  }
  return out;
}

/** Bucketed call-duration histogram. Returns counts per duration band. */
export function durationDistribution(evals: Evaluation[]): { bucket: string; count: number }[] {
  const buckets = [
    { label: '0–2m', test: (s: number) => s < 120 },
    { label: '2–5m', test: (s: number) => s >= 120 && s < 300 },
    { label: '5–10m', test: (s: number) => s >= 300 && s < 600 },
    { label: '10m+', test: (s: number) => s >= 600 },
  ];
  const counts = buckets.map((b) => ({ bucket: b.label, count: 0 }));
  for (const e of evals) {
    const sec = e.genesys?.durationSec;
    if (typeof sec !== 'number') continue;
    const i = buckets.findIndex((b) => b.test(sec));
    if (i >= 0) counts[i]!.count += 1;
  }
  return counts;
}

/** Bucketed response-time histogram for text channels. */
export function responseTimeDistribution(evals: Evaluation[]): { bucket: string; count: number }[] {
  const buckets = [
    { label: '< 15m', test: (m: number) => m < 15 },
    { label: '15–60m', test: (m: number) => m >= 15 && m < 60 },
    { label: '1–4h', test: (m: number) => m >= 60 && m < 240 },
    { label: '4–24h', test: (m: number) => m >= 240 && m < 1440 },
    { label: '> 24h', test: (m: number) => m >= 1440 },
  ];
  const counts = buckets.map((b) => ({ bucket: b.label, count: 0 }));
  for (const e of evals) {
    const mins = e.responseTimeMin;
    if (typeof mins !== 'number') continue;
    const i = buckets.findIndex((b) => b.test(mins));
    if (i >= 0) counts[i]!.count += 1;
  }
  return counts;
}

/** Average per-section pass rate (% of evals where the section's contribution is 'exceptional' or 'full'). */
export function perSectionPassRate(evals: Evaluation[]): { section: string; score: number }[] {
  const buckets: Record<string, { label: string; total: number; passed: number }> = {};
  for (const e of excludeNesting(evals)) {
    if (e.channel === 'csat') continue;
    for (const s of e.sections) {
      const key = s.id;
      buckets[key] = buckets[key] ?? { label: s.label, total: 0, passed: 0 };
      buckets[key]!.total += 1;
      if (s.contribution === 'exceptional' || s.contribution === 'full') {
        buckets[key]!.passed += 1;
      }
    }
  }
  return Object.values(buckets).map((b) => ({
    section: b.label,
    score: b.total === 0 ? 0 : Math.round((b.passed / b.total) * 100),
  }));
}

/** Top N failing criteria across the evals (counts criteria scored none/no/partial). */
export function topFailingCriteria(evals: Evaluation[], limit = 6): { label: string; fails: number }[] {
  const counts: Record<string, { label: string; fails: number }> = {};
  for (const e of evals) {
    if (e.channel === 'csat') continue;
    for (const s of e.sections) {
      for (const c of s.criteria) {
        if (c.value === 'no' || c.value === 'none' || c.value === 'partial') {
          counts[c.id] = counts[c.id] ?? { label: c.label, fails: 0 };
          counts[c.id]!.fails += 1;
        }
      }
    }
  }
  return Object.values(counts).sort((a, b) => b.fails - a.fails).slice(0, limit);
}

export function lastNDays(evals: Evaluation[], n: number): Evaluation[] {
  const cutoff = dayjs().subtract(n, 'day');
  return evals.filter((e) => dayjs(e.caseDateTime).isAfter(cutoff));
}
