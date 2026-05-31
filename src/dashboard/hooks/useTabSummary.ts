import { useMemo } from 'react';
import type { Tab } from '../../shared/lib/types';

export interface TabSummary {
  readonly totalCount: number;
  readonly groupedCount: number;
  readonly ungroupedCount: number;
  readonly windowCount: number;
}

export function useTabSummary(tabs: readonly Tab[]): TabSummary {
  return useMemo<TabSummary>(() => {
    const totalCount = tabs.length;
    const groupedCount = tabs.filter((tab) => tab.group !== null).length;
    const ungroupedCount = totalCount - groupedCount;
    const windowCount = new Set(tabs.map((tab) => tab.windowId)).size;
    return { totalCount, groupedCount, ungroupedCount, windowCount };
  }, [tabs]);
}
