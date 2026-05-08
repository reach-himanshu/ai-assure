import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { isWithinAppealWindow } from '@/lib/dates';

describe('appeal window guard', () => {
  it('allows appeals filed within window', () => {
    const ts = dayjs().subtract(3, 'day').toISOString();
    expect(isWithinAppealWindow(ts, 7)).toBe(true);
  });

  it('blocks appeals after window has expired', () => {
    const ts = dayjs().subtract(8, 'day').toISOString();
    expect(isWithinAppealWindow(ts, 7)).toBe(false);
  });

  it('respects a 14-day window', () => {
    const ts = dayjs().subtract(13, 'day').toISOString();
    expect(isWithinAppealWindow(ts, 14)).toBe(true);
    expect(isWithinAppealWindow(ts, 7)).toBe(false);
  });
});
