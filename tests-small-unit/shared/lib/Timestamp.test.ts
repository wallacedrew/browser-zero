import { describe, it, expect } from 'vitest';
import { Timestamp } from '../../../src/shared/lib/Timestamp';

describe('Timestamp.relativeLabelFrom', () => {
  const now = Timestamp.fromMillis(new Date(2026, 4, 10, 12).getTime());

  it('returns "just now" for under 60 seconds', () => {
    const recent = Timestamp.fromMillis(now.toMillis() - 30_000);
    expect(recent.relativeLabelFrom(now)).toBe('just now');
  });

  it('reports minutes under one hour', () => {
    const fiveMinAgo = Timestamp.fromMillis(now.toMillis() - 5 * 60_000);
    expect(fiveMinAgo.relativeLabelFrom(now)).toBe('5 min ago');
  });

  it('reports hours under one day', () => {
    const threeHoursAgo = Timestamp.fromMillis(now.toMillis() - 3 * 3_600_000);
    expect(threeHoursAgo.relativeLabelFrom(now)).toBe('3 hr ago');
  });

  it('singularises "1 day ago"', () => {
    const oneDayAgo = Timestamp.fromMillis(now.toMillis() - 24 * 3_600_000);
    expect(oneDayAgo.relativeLabelFrom(now)).toBe('1 day ago');
  });

  it('pluralises multi-day durations', () => {
    const threeDaysAgo = Timestamp.fromMillis(now.toMillis() - 3 * 24 * 3_600_000);
    expect(threeDaysAgo.relativeLabelFrom(now)).toBe('3 days ago');
  });

  it('formats older timestamps as "Mon DD"', () => {
    const older = Timestamp.fromMillis(new Date(2026, 2, 15, 12).getTime());
    expect(older.relativeLabelFrom(now)).toBe('Mar 15');
  });

  it('treats future timestamps as "just now" (clock skew safety)', () => {
    const future = Timestamp.fromMillis(now.toMillis() + 60_000);
    expect(future.relativeLabelFrom(now)).toBe('just now');
  });
});

describe('Timestamp.equals', () => {
  it('is true for same millis', () => {
    expect(Timestamp.fromMillis(1234).equals(Timestamp.fromMillis(1234))).toBe(true);
  });

  it('is false for different millis', () => {
    expect(Timestamp.fromMillis(1234).equals(Timestamp.fromMillis(5678))).toBe(false);
  });
});
