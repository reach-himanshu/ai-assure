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
