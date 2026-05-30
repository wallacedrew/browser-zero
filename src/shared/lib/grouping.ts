import type { Tab } from './types';

export type GroupBy = 'window' | 'tabgroup' | 'domain';

export interface TabGroup<T extends Tab = Tab> {
  readonly key: string;
  readonly label: string;
  readonly tabs: readonly T[];
}

interface GroupingStrategy {
  keyOf(tab: Tab): string;
  compareEntries<T extends Tab>(a: [string, readonly T[]], b: [string, readonly T[]]): number;
  makeOutputKey(bucketKey: string): string;
  makeLabel<T extends Tab>(bucketKey: string, tabs: readonly T[], index: number): string;
}

export function groupTabs<T extends Tab>(tabs: readonly T[], by: GroupBy): TabGroup<T>[] {
  return materializeGroups(tabs, STRATEGIES[by]);
}

function materializeGroups<T extends Tab>(
  tabs: readonly T[],
  strategy: GroupingStrategy,
): TabGroup<T>[] {
  const buckets = bucketBy(tabs, (tab) => strategy.keyOf(tab));
  return [...buckets.entries()]
    .sort((a, b) => strategy.compareEntries(a, b))
    .map(([bucketKey, bucketTabs], index) => ({
      key: strategy.makeOutputKey(bucketKey),
      label: strategy.makeLabel(bucketKey, bucketTabs, index),
      tabs: bucketTabs,
    }));
}

function bucketBy<T, K>(items: readonly T[], keyOf: (item: T) => K): Map<K, T[]> {
  const buckets = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const existing = buckets.get(key);
    if (existing) existing.push(item);
    else buckets.set(key, [item]);
  }
  return buckets;
}

const WindowGrouping: GroupingStrategy = {
  keyOf: (tab) => String(tab.windowId),
  compareEntries: ([leftKey], [rightKey]) => Number(leftKey) - Number(rightKey),
  makeOutputKey: (bucketKey) => `window-${bucketKey}`,
  makeLabel: (_bucketKey, _tabs, index) => `Window ${String(index + 1)}`,
};

const DomainGrouping: GroupingStrategy = {
  keyOf: (tab) => tab.domain,
  compareEntries: ([leftKey, leftTabs], [rightKey, rightTabs]) => {
    const countDelta = rightTabs.length - leftTabs.length;
    if (countDelta !== 0) return countDelta;
    return leftKey.localeCompare(rightKey);
  },
  makeOutputKey: (bucketKey) => `domain-${bucketKey}`,
  makeLabel: (bucketKey) => bucketKey,
};

const UNGROUPED_KEY = 'ungrouped';

const TabGroupGrouping: GroupingStrategy = {
  keyOf: (tab) => (tab.group ? `g-${String(tab.group.id)}` : UNGROUPED_KEY),
  compareEntries: ([leftKey, leftTabs], [rightKey, rightTabs]) => {
    const leftIsUngrouped = leftKey === UNGROUPED_KEY;
    const rightIsUngrouped = rightKey === UNGROUPED_KEY;
    if (leftIsUngrouped !== rightIsUngrouped) return leftIsUngrouped ? 1 : -1;
    const countDelta = rightTabs.length - leftTabs.length;
    if (countDelta !== 0) return countDelta;
    const leftTitle = leftTabs[0]?.group?.title ?? '';
    const rightTitle = rightTabs[0]?.group?.title ?? '';
    return leftTitle.localeCompare(rightTitle);
  },
  makeOutputKey: (bucketKey) => `tabgroup-${bucketKey}`,
  makeLabel: (bucketKey, tabs) => {
    if (bucketKey === UNGROUPED_KEY) return 'Ungrouped';
    const title = tabs[0]?.group?.title ?? '';
    return title.length > 0 ? title : 'Untitled';
  },
};

const STRATEGIES: Record<GroupBy, GroupingStrategy> = {
  window: WindowGrouping,
  domain: DomainGrouping,
  tabgroup: TabGroupGrouping,
};
