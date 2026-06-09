import { describe, it, expect } from 'vitest';
import { analyzeForNewGroup } from '../../../src/dashboard/lib/crossWindowGuard';
import type { Tab } from '../../../src/shared/lib/types';
import { Timestamp } from '../../../src/shared/lib/Timestamp';

const now = Timestamp.fromMillis(0);

function tab(id: number, windowId: number): Tab {
  return {
    id,
    windowId,
    title: `tab-${String(id)}`,
    url: `https://example.com/${String(id)}`,
    domain: 'example.com',
    favIconUrl: null,
    lastAccessed: now,
    group: null,
  };
}

describe('analyzeForNewGroup', () => {
  it('returns null when no tabIds are supplied', () => {
    expect(analyzeForNewGroup([], [tab(1, 100)])).toBeNull();
  });

  it('keeps tabId order and reports no other windows when all tabs share one window', () => {
    const tabs = [tab(1, 100), tab(2, 100), tab(3, 100)];

    const result = analyzeForNewGroup([3, 1, 2], tabs);

    expect(result).toEqual({
      hostWindowId: 100,
      otherWindowCount: 0,
      orderedTabIds: [3, 1, 2],
    });
  });
});
