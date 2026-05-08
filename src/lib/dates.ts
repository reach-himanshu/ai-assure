import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

dayjs.extend(relativeTime);
dayjs.extend(duration);

export function fromNow(iso: string): string {
  return dayjs(iso).fromNow();
}

export function formatDateTime(iso: string): string {
  return dayjs(iso).format('MMM D, YYYY · h:mm A');
}

export function formatDate(iso: string): string {
  return dayjs(iso).format('MMM D, YYYY');
}

export function daysSince(iso: string): number {
  return dayjs().diff(dayjs(iso), 'day');
}

export function isWithinAppealWindow(
  caseDateTime: string,
  windowDays: number,
): boolean {
  const filed = dayjs();
  const caseDate = dayjs(caseDateTime);
  return filed.diff(caseDate, 'day', true) <= windowDays;
}

export function durationLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function nowIso(): string {
  return dayjs().toISOString();
}

/** Was the agent in their 90-day nesting window at the given moment? */
export function isNestingAt(trainingCompleteDate: string | undefined, atIso: string): boolean {
  if (!trainingCompleteDate) return false;
  const at = dayjs(atIso);
  const start = dayjs(trainingCompleteDate);
  if (!at.isAfter(start)) return false;          // before training complete
  return at.diff(start, 'day') <= 90;
}

export function isNestingNow(trainingCompleteDate: string | undefined): boolean {
  return isNestingAt(trainingCompleteDate, nowIso());
}
