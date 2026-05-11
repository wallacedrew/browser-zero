import type { Tab } from './types';

export type GroupBy = 'window' | 'domain' | 'category';

export interface TabGroup {
  readonly key: string;
  readonly label: string;
  readonly tabs: readonly Tab[];
}

export function groupTabs(tabs: readonly Tab[], by: GroupBy): TabGroup[] {
  switch (by) {
    case 'window':
      return groupByWindow(tabs);
    case 'domain':
      return groupByDomain(tabs);
    case 'category':
      return groupByCategory(tabs);
  }
}

function groupByWindow(tabs: readonly Tab[]): TabGroup[] {
  const byWindow = new Map<number, Tab[]>();
  for (const tab of tabs) {
    const existing = byWindow.get(tab.windowId);
    if (existing) existing.push(tab);
    else byWindow.set(tab.windowId, [tab]);
  }
  return [...byWindow.entries()]
    .sort(([leftId], [rightId]) => leftId - rightId)
    .map(([windowId, windowTabs], index) => ({
      key: `window-${String(windowId)}`,
      label: `Window ${String(index + 1)}`,
      tabs: windowTabs,
    }));
}

function groupByDomain(tabs: readonly Tab[]): TabGroup[] {
  const byDomain = new Map<string, Tab[]>();
  for (const tab of tabs) {
    const existing = byDomain.get(tab.domain);
    if (existing) existing.push(tab);
    else byDomain.set(tab.domain, [tab]);
  }
  return [...byDomain.entries()]
    .sort(([leftDomain, leftTabs], [rightDomain, rightTabs]) => {
      const countDelta = rightTabs.length - leftTabs.length;
      if (countDelta !== 0) return countDelta;
      return leftDomain.localeCompare(rightDomain);
    })
    .map(([domain, domainTabs]) => ({
      key: `domain-${domain}`,
      label: domain,
      tabs: domainTabs,
    }));
}

function groupByCategory(tabs: readonly Tab[]): TabGroup[] {
  const byCategory = new Map<string, Tab[]>();
  for (const tab of tabs) {
    const existing = byCategory.get(tab.intent);
    if (existing) existing.push(tab);
    else byCategory.set(tab.intent, [tab]);
  }
  return [...byCategory.entries()]
    .sort(([leftCategory, leftTabs], [rightCategory, rightTabs]) => {
      const countDelta = rightTabs.length - leftTabs.length;
      if (countDelta !== 0) return countDelta;
      return leftCategory.localeCompare(rightCategory);
    })
    .map(([category, categoryTabs]) => ({
      key: `category-${category}`,
      label: category,
      tabs: categoryTabs,
    }));
}
