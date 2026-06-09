import { describe, it, expect } from 'vitest';
import { groupTabs, groupingStrategyFor } from '../../../src/shared/lib/grouping';
import type { Tab } from '../../../src/shared/lib/types';
import { Timestamp } from '../../../src/shared/lib/Timestamp';

const makeTab = (overrides: Partial<Tab>): Tab => ({
  id: 1,
  windowId: 100,
  title: 't',
  url: 'https://example.com',
  domain: 'example.com',
  favIconUrl: null,
  lastAccessed: Timestamp.fromMillis(0),
  group: null,
  ...overrides,
});

describe('groupTabs by flat', () => {
  it('returns an empty array when given no tabs', () => {
    expect(groupTabs([], 'flat')).toEqual([]);
  });

  it('returns a single bucket labeled "All tabs" containing every tab', () => {
    const groups = groupTabs(
      [
        makeTab({ id: 1, windowId: 100 }),
        makeTab({ id: 2, windowId: 200 }),
        makeTab({ id: 3, windowId: 100 }),
      ],
      'flat',
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]!.label).toBe('All tabs');
    expect(groups[0]!.key).toBe('flat-all');
    expect(groups[0]!.tabs.map((t) => t.id).sort()).toEqual([1, 2, 3]);
  });
});

describe('FlatGrouping strategy', () => {
  it('disables drop, allows grouping, and has no section color', () => {
    const strategy = groupingStrategyFor('flat');
    expect(strategy.dropEnabled).toBe(false);
    expect(strategy.allowGrouping).toBe(true);
    expect(strategy.sectionColorOf(undefined)).toBeNull();
  });
});

describe('FlatGrouping intra-bucket sort', () => {
  it('sorts the bucket by lastAccessed descending, ties broken by id ascending', () => {
    const groups = groupTabs(
      [
        makeTab({ id: 3, windowId: 100, lastAccessed: Timestamp.fromMillis(1000) }),
        makeTab({ id: 1, windowId: 100, lastAccessed: Timestamp.fromMillis(3000) }),
        makeTab({ id: 2, windowId: 100, lastAccessed: Timestamp.fromMillis(3000) }),
        makeTab({ id: 4, windowId: 100, lastAccessed: Timestamp.fromMillis(2000) }),
      ],
      'flat',
    );

    expect(groups[0]!.tabs.map((t) => t.id)).toEqual([1, 2, 4, 3]);
  });
});

describe('non-flat strategies preserve input order within a bucket', () => {
  it('does not reorder by-window tabs', () => {
    const groups = groupTabs(
      [
        makeTab({ id: 3, windowId: 100, lastAccessed: Timestamp.fromMillis(1000) }),
        makeTab({ id: 1, windowId: 100, lastAccessed: Timestamp.fromMillis(3000) }),
      ],
      'window',
    );
    expect(groups[0]!.tabs.map((t) => t.id)).toEqual([3, 1]);
  });
});
