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
});
