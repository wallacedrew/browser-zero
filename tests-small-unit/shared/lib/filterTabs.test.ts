import { describe, it, expect } from 'vitest';
import { filterTabs } from '../../../src/shared/lib/filterTabs';
import type { Tab } from '../../../src/shared/lib/types';

const makeTab = (overrides: Partial<Tab>): Tab => ({
  id: 1,
  windowId: 100,
  title: 'GitHub Pull Request',
  url: 'https://github.com/me/repo/pull/123',
  domain: 'github.com',
  lastAccessed: 0,
  group: null,
  ...overrides,
});

describe('filterTabs', () => {
  it('returns every tab when the query is empty', () => {
    const tabs = [makeTab({ id: 1 }), makeTab({ id: 2, title: 'Other' })];
    expect(filterTabs(tabs, '')).toEqual(tabs);
  });

  it('treats whitespace-only queries as empty', () => {
    const tabs = [makeTab({ id: 1 }), makeTab({ id: 2 })];
    expect(filterTabs(tabs, '   ')).toEqual(tabs);
  });

  it('matches against the title (case-insensitive)', () => {
    const tabs = [
      makeTab({ id: 1, title: 'Inbox' }),
      makeTab({ id: 2, title: 'GitHub Pull Request' }),
    ];
    expect(filterTabs(tabs, 'INBOX').map((tab) => tab.id)).toEqual([1]);
  });

  it('matches against the URL', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://github.com/me/repo' }),
      makeTab({ id: 2, url: 'https://mail.google.com/u/0' }),
    ];
    expect(filterTabs(tabs, 'mail.google').map((tab) => tab.id)).toEqual([2]);
  });

  it('matches against the domain', () => {
    const tabs = [
      makeTab({ id: 1, domain: 'github.com' }),
      makeTab({ id: 2, domain: 'youtube.com' }),
    ];
    expect(filterTabs(tabs, 'youtube').map((tab) => tab.id)).toEqual([2]);
  });

  it('matches against the Chrome tab group title', () => {
    const tabs = [
      makeTab({ id: 1, group: { id: 10, title: 'Q3 planning', color: 'blue' } }),
      makeTab({ id: 2, group: null }),
    ];
    expect(filterTabs(tabs, 'planning').map((tab) => tab.id)).toEqual([1]);
  });

  it('returns multiple matches when several tabs satisfy the query', () => {
    const tabs = [
      makeTab({ id: 1, title: 'Claude' }),
      makeTab({ id: 2, title: 'Anthropic Claude docs' }),
      makeTab({ id: 3, title: 'Unrelated' }),
    ];
    expect(filterTabs(tabs, 'claude').map((tab) => tab.id)).toEqual([1, 2]);
  });

  it('returns an empty array when nothing matches', () => {
    const tabs = [makeTab({ id: 1, title: 'GitHub' })];
    expect(filterTabs(tabs, 'zzz no match zzz')).toEqual([]);
  });
});
