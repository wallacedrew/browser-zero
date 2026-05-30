import { useMemo } from 'react';
import type { Tab } from '../../shared/lib/types';
import type { Timestamp } from '../../shared/lib/Timestamp';

export type TabRowViewModel = Tab & { readonly lastAccessedLabel: string };

export function useTabViewModels(tabs: readonly Tab[], now: Timestamp): readonly TabRowViewModel[] {
  return useMemo(
    () =>
      tabs.map((tab) => ({
        ...tab,
        lastAccessedLabel: tab.lastAccessed.relativeLabelFrom(now),
      })),
    [tabs, now],
  );
}
