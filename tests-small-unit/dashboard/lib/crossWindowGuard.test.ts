import { describe, it, expect } from 'vitest';
import {
  analyzeForExistingGroup,
  analyzeForNewGroup,
} from '../../../src/dashboard/lib/crossWindowGuard';
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

  it('picks the majority window as host and reorders host-window tabs first', () => {
    const tabs = [tab(1, 100), tab(2, 200), tab(3, 200), tab(4, 200), tab(5, 100)];

    const result = analyzeForNewGroup([1, 2, 3, 4, 5], tabs);

    expect(result).toEqual({
      hostWindowId: 200,
      otherWindowCount: 1,
      orderedTabIds: [2, 3, 4, 1, 5],
    });
  });

  it('breaks ties by picking the lowest windowId as host', () => {
    const tabs = [tab(1, 200), tab(2, 100), tab(3, 200), tab(4, 100)];

    const result = analyzeForNewGroup([1, 2, 3, 4], tabs);

    expect(result?.hostWindowId).toBe(100);
    expect(result?.otherWindowCount).toBe(1);
    expect(result?.orderedTabIds).toEqual([2, 4, 1, 3]);
  });

  it('ignores tabIds that do not match any current tab', () => {
    const tabs = [tab(1, 100), tab(2, 100)];

    const result = analyzeForNewGroup([1, 999, 2, 42], tabs);

    expect(result).toEqual({
      hostWindowId: 100,
      otherWindowCount: 0,
      orderedTabIds: [1, 2],
    });
  });

  it('returns null when every supplied tabId is stale', () => {
    const tabs = [tab(1, 100)];

    expect(analyzeForNewGroup([42, 99], tabs)).toBeNull();
  });
});

function groupedTab(id: number, windowId: number, groupId: number): Tab {
  return { ...tab(id, windowId), group: { id: groupId, title: 'Reading', color: 'blue' } };
}

describe('analyzeForExistingGroup', () => {
  it('returns null when the selection is empty', () => {
    expect(analyzeForExistingGroup([], [tab(1, 100)], 7)).toBeNull();
  });

  it('returns null when no current tab belongs to the target group', () => {
    expect(analyzeForExistingGroup([1, 2], [tab(1, 100), tab(2, 100)], 7)).toBeNull();
  });

  it("hosts on the existing group's window and counts other selection windows", () => {
    const tabs = [tab(1, 100), tab(2, 200), tab(3, 300), groupedTab(99, 200, 7)];

    const result = analyzeForExistingGroup([1, 2, 3], tabs, 7);

    expect(result).toEqual({
      hostWindowId: 200,
      otherWindowCount: 2,
      orderedTabIds: [2, 1, 3],
    });
  });

  it("reports no other windows when every selected tab already lives in the group's window", () => {
    const tabs = [tab(1, 200), tab(2, 200), groupedTab(99, 200, 7)];

    const result = analyzeForExistingGroup([1, 2], tabs, 7);

    expect(result).toEqual({
      hostWindowId: 200,
      otherWindowCount: 0,
      orderedTabIds: [1, 2],
    });
  });
});
