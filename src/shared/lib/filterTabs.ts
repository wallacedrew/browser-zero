import type { Tab } from './types';

export function filterTabs(tabs: readonly Tab[], query: string): readonly Tab[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return tabs;
  return tabs.filter((tab) => tabMatches(tab, trimmed));
}

function tabMatches(tab: Tab, lowercasedQuery: string): boolean {
  if (tab.title.toLowerCase().includes(lowercasedQuery)) return true;
  if (tab.url.toLowerCase().includes(lowercasedQuery)) return true;
  if (tab.domain.toLowerCase().includes(lowercasedQuery)) return true;
  if (tab.group && tab.group.title.toLowerCase().includes(lowercasedQuery)) return true;
  return false;
}
