import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from '../../../src/shared/lib/formatRelativeTime';

describe('formatRelativeTime', () => {
  const now = new Date(2026, 4, 10, 12).getTime();

  it('returns "just now" for under 60 seconds', () => {
    expect(formatRelativeTime(now - 30_000, now)).toBe('just now');
  });

  it('reports minutes under one hour', () => {
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5 min ago');
  });

  it('reports hours under one day', () => {
    expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe('3 hr ago');
  });

  it('singularises "1 day ago"', () => {
    expect(formatRelativeTime(now - 24 * 3_600_000, now)).toBe('1 day ago');
  });

  it('pluralises multi-day durations', () => {
    expect(formatRelativeTime(now - 3 * 24 * 3_600_000, now)).toBe('3 days ago');
  });

  it('formats older timestamps as "Mon DD"', () => {
    const olderTimestamp = new Date(2026, 2, 15, 12).getTime();
    expect(formatRelativeTime(olderTimestamp, now)).toBe('Mar 15');
  });

  it('treats future timestamps as "just now" (clock skew safety)', () => {
    expect(formatRelativeTime(now + 60_000, now)).toBe('just now');
  });
});
