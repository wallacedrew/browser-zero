import type { Tab } from './types';

export type GroupBy = 'window' | 'tabgroup' | 'domain';

export interface TabGroup<T extends Tab = Tab> {
  readonly key: string;
  readonly label: string;
  readonly tabs: readonly T[];
}

export function groupTabs<T extends Tab>(tabs: readonly T[], by: GroupBy): TabGroup<T>[] {
  switch (by) {
    case 'window':
      return groupByWindow(tabs);
    case 'tabgroup':
      return groupByTabGroup(tabs);
    case 'domain':
      return groupByDomain(tabs);
  }
}

function bucketBy<T, K>(items: readonly T[], keyOf: (item: T) => K): Map<K, T[]> {
  const buckets = new Map<K, T[]>();
  for (const item of items) {
    const existing = buckets.get(keyOf(item));
    if (existing) existing.push(item);
    else buckets.set(keyOf(item), [item]);
  }
  return buckets;
}

function groupByWindow<T extends Tab>(tabs: readonly T[]): TabGroup<T>[] {
  const byWindow = bucketBy(tabs, (tab) => tab.windowId);
  return [...byWindow.entries()]
    .sort(([leftId], [rightId]) => leftId - rightId)
    .map(([windowId, windowTabs], index) => ({
      key: `window-${String(windowId)}`,
      label: `Window ${String(index + 1)}`,
      tabs: windowTabs,
    }));
}

function groupByDomain<T extends Tab>(tabs: readonly T[]): TabGroup<T>[] {
  const byDomain = bucketBy(tabs, (tab) => tab.domain);
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

const UNGROUPED_KEY = 'ungrouped';

function groupByTabGroup<T extends Tab>(tabs: readonly T[]): TabGroup<T>[] {
  const byTabGroup = bucketBy(tabs, (tab) =>
    tab.group ? `g-${String(tab.group.id)}` : UNGROUPED_KEY,
  );
  return [...byTabGroup.entries()]
    .sort(([leftKey, leftTabs], [rightKey, rightTabs]) => {
      const leftIsUngrouped = leftKey === UNGROUPED_KEY;
      const rightIsUngrouped = rightKey === UNGROUPED_KEY;
      if (leftIsUngrouped !== rightIsUngrouped) return leftIsUngrouped ? 1 : -1;
      const countDelta = rightTabs.length - leftTabs.length;
      if (countDelta !== 0) return countDelta;
      const leftTitle = leftTabs[0]?.group?.title ?? '';
      const rightTitle = rightTabs[0]?.group?.title ?? '';
      return leftTitle.localeCompare(rightTitle);
    })
    .map(([key, groupTabs]) => {
      const label = labelForTabGroup(key, groupTabs[0]);
      return {
        key: `tabgroup-${key}`,
        label,
        tabs: groupTabs,
      };
    });
}

function labelForTabGroup(key: string, firstTab: Tab | undefined): string {
  if (key === UNGROUPED_KEY) return 'Ungrouped';
  const title = firstTab?.group?.title ?? '';
  return title.length > 0 ? title : 'Untitled';
}
