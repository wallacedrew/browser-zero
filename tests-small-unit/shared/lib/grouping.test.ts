import { describe, it, expect } from 'vitest';
import { groupTabs } from '../../../src/shared/lib/grouping';
import type { Tab } from '../../../src/shared/lib/types';

const makeTab = (overrides: Partial<Tab>): Tab => ({
  id: 1,
  windowId: 100,
  title: 't',
  url: 'https://example.com',
  domain: 'example.com',
  intent: 'Other',
  lastAccessed: 0,
  group: null,
  ...overrides,
});

describe('groupTabs by window', () => {
  it('returns an empty array when given no tabs', () => {
    expect(groupTabs([], 'window')).toEqual([]);
  });

  it('labels windows as "Window N" by 1-indexed position in sorted windowId order', () => {
    const result = groupTabs(
      [
        makeTab({ id: 1, windowId: 200 }),
        makeTab({ id: 2, windowId: 100 }),
        makeTab({ id: 3, windowId: 200 }),
      ],
      'window',
    );
    expect(result.map((group) => group.label)).toEqual(['Window 1', 'Window 2']);
    expect(result[0]?.tabs.map((tab) => tab.id)).toEqual([2]);
    expect(result[1]?.tabs.map((tab) => tab.id)).toEqual([1, 3]);
  });
});

describe('groupTabs by domain', () => {
  it('returns an empty array when given no tabs', () => {
    expect(groupTabs([], 'domain')).toEqual([]);
  });

  it('groups tabs by domain and sorts groups by count descending', () => {
    const result = groupTabs(
      [
        makeTab({ id: 1, domain: 'youtube.com' }),
        makeTab({ id: 2, domain: 'github.com' }),
        makeTab({ id: 3, domain: 'github.com' }),
        makeTab({ id: 4, domain: 'youtube.com' }),
        makeTab({ id: 5, domain: 'github.com' }),
      ],
      'domain',
    );
    expect(result.map((group) => group.label)).toEqual(['github.com', 'youtube.com']);
    expect(result[0]?.tabs).toHaveLength(3);
    expect(result[1]?.tabs).toHaveLength(2);
  });

  it('breaks count ties alphabetically by domain ascending', () => {
    const result = groupTabs(
      [
        makeTab({ id: 1, domain: 'youtube.com' }),
        makeTab({ id: 2, domain: 'github.com' }),
        makeTab({ id: 3, domain: 'amazon.com' }),
      ],
      'domain',
    );
    expect(result.map((group) => group.label)).toEqual(['amazon.com', 'github.com', 'youtube.com']);
  });
});

describe('groupTabs by category', () => {
  it('returns an empty array when given no tabs', () => {
    expect(groupTabs([], 'category')).toEqual([]);
  });

  it('groups tabs by intent and sorts groups by count descending', () => {
    const result = groupTabs(
      [
        makeTab({ id: 1, intent: 'Entertainment' }),
        makeTab({ id: 2, intent: 'Dev' }),
        makeTab({ id: 3, intent: 'Dev' }),
        makeTab({ id: 4, intent: 'Entertainment' }),
        makeTab({ id: 5, intent: 'Dev' }),
      ],
      'category',
    );
    expect(result.map((group) => group.label)).toEqual(['Dev', 'Entertainment']);
    expect(result[0]?.tabs).toHaveLength(3);
    expect(result[1]?.tabs).toHaveLength(2);
  });

  it('breaks count ties alphabetically by category ascending', () => {
    const result = groupTabs(
      [
        makeTab({ id: 1, intent: 'Entertainment' }),
        makeTab({ id: 2, intent: 'Dev' }),
        makeTab({ id: 3, intent: 'Comms' }),
      ],
      'category',
    );
    expect(result.map((group) => group.label)).toEqual(['Comms', 'Dev', 'Entertainment']);
  });

  it("uses the tab group's title as the category when a tab is in a named group", () => {
    const result = groupTabs(
      [
        makeTab({
          id: 1,
          intent: 'Dev',
          group: { id: 10, title: 'ai audio, voice', color: 'blue' },
        }),
        makeTab({
          id: 2,
          intent: 'Other',
          group: { id: 10, title: 'ai audio, voice', color: 'blue' },
        }),
        makeTab({ id: 3, intent: 'Other', group: null }),
      ],
      'category',
    );
    expect(result.map((group) => group.label)).toEqual(['ai audio, voice', 'Other']);
    expect(result[0]?.tabs.map((tab) => tab.id)).toEqual([1, 2]);
    expect(result[1]?.tabs.map((tab) => tab.id)).toEqual([3]);
  });

  it("falls back to the tab's intent when it isn't in any group", () => {
    const result = groupTabs(
      [
        makeTab({ id: 1, intent: 'Dev', group: null }),
        makeTab({ id: 2, intent: 'Comms', group: null }),
      ],
      'category',
    );
    expect(result.map((group) => group.label)).toEqual(['Comms', 'Dev']);
  });

  it('labels untitled-group tabs as "Untitled" rather than their intent', () => {
    const result = groupTabs(
      [makeTab({ id: 1, intent: 'Dev', group: { id: 10, title: '', color: 'grey' } })],
      'category',
    );
    expect(result.map((group) => group.label)).toEqual(['Untitled']);
  });
});

describe('groupTabs by tab group', () => {
  it('returns an empty array when given no tabs', () => {
    expect(groupTabs([], 'tabgroup')).toEqual([]);
  });

  it('groups tabs by Chrome tab group id and labels by the group title', () => {
    const result = groupTabs(
      [
        makeTab({ id: 1, group: { id: 10, title: 'Q3 planning', color: 'blue' } }),
        makeTab({ id: 2, group: { id: 20, title: 'shopping', color: 'red' } }),
        makeTab({ id: 3, group: { id: 10, title: 'Q3 planning', color: 'blue' } }),
      ],
      'tabgroup',
    );
    expect(result.map((group) => group.label)).toEqual(['Q3 planning', 'shopping']);
    expect(result[0]?.tabs.map((tab) => tab.id)).toEqual([1, 3]);
    expect(result[1]?.tabs.map((tab) => tab.id)).toEqual([2]);
  });

  it('puts ungrouped tabs into an "Ungrouped" bucket sorted last', () => {
    const result = groupTabs(
      [
        makeTab({ id: 1, group: null }),
        makeTab({ id: 2, group: { id: 10, title: 'planning', color: 'blue' } }),
        makeTab({ id: 3, group: null }),
        makeTab({ id: 4, group: { id: 10, title: 'planning', color: 'blue' } }),
      ],
      'tabgroup',
    );
    expect(result.map((group) => group.label)).toEqual(['planning', 'Ungrouped']);
    expect(result[1]?.tabs.map((tab) => tab.id)).toEqual([1, 3]);
  });

  it('labels untitled groups as "Untitled"', () => {
    const result = groupTabs(
      [makeTab({ id: 1, group: { id: 10, title: '', color: 'grey' } })],
      'tabgroup',
    );
    expect(result.map((group) => group.label)).toEqual(['Untitled']);
  });
});
