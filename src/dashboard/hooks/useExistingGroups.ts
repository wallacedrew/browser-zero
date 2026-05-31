import { useMemo } from 'react';
import type { Tab, TabGroupInfo } from '../../shared/lib/types';

export function useExistingGroups(tabs: readonly Tab[]): readonly TabGroupInfo[] {
  return useMemo<TabGroupInfo[]>(() => {
    const seen = new Map<number, TabGroupInfo>();
    for (const tab of tabs) {
      if (tab.group && !seen.has(tab.group.id)) seen.set(tab.group.id, tab.group);
    }
    return [...seen.values()];
  }, [tabs]);
}
