import { useCallback, useState } from 'react';

export interface Selection {
  readonly selected: ReadonlySet<number>;
  toggle: (tabId: number) => void;
  selectMany: (tabIds: readonly number[]) => void;
  clearMany: (tabIds: readonly number[]) => void;
  clearAll: () => void;
}

export function useSelection(): Selection {
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());

  const toggle = useCallback((tabId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  }, []);

  const selectMany = useCallback((tabIds: readonly number[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of tabIds) next.add(id);
      return next;
    });
  }, []);

  const clearMany = useCallback((tabIds: readonly number[]) => {
    setSelected((prev) => {
      if (tabIds.every((id) => !prev.has(id))) return prev;
      const next = new Set(prev);
      for (const id of tabIds) next.delete(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  return { selected, toggle, selectMany, clearMany, clearAll };
}
