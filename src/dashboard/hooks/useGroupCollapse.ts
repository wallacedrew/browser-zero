import { useState } from 'react';

export interface GroupCollapseState {
  readonly collapsedKeys: ReadonlySet<string>;
  readonly allCollapsed: boolean;
  toggleCollapsed: (groupKey: string) => void;
  toggleAllCollapsed: () => void;
}

export function useGroupCollapse(visibleGroupKeys: readonly string[]): GroupCollapseState {
  const [collapsedKeys, setCollapsedKeys] = useState<ReadonlySet<string>>(() => new Set());

  // "All collapsed" is computed against the currently-visible groups, not
  // stale keys from a previous groupBy / search state — so e.g. switching
  // to a brand-new view always reads as "all expanded" from the toggle's
  // perspective even if collapsedKeys still holds keys from the old view.
  const allCollapsed =
    visibleGroupKeys.length > 0 && visibleGroupKeys.every((key) => collapsedKeys.has(key));

  const toggleCollapsed = (groupKey: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const toggleAllCollapsed = () => {
    if (allCollapsed) {
      setCollapsedKeys(new Set());
    } else {
      setCollapsedKeys(new Set(visibleGroupKeys));
    }
  };

  return { collapsedKeys, allCollapsed, toggleCollapsed, toggleAllCollapsed };
}
