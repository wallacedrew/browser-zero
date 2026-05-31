import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { Tab } from '../../shared/lib/types';
import type { TabsPort } from '../../shared/adapters/tabsPort';

export interface TabMutations {
  focus: (tabId: number, windowId: number) => void;
  close: (tabId: number) => void;
  deleteMany: (tabIds: readonly number[]) => void;
  dropOnWindow: (tabId: number, targetWindowId: number) => Promise<void>;
  dropOnTabGroup: (tabId: number, targetGroupId: number | null) => Promise<void>;
  createGroup: (tabIds: readonly number[], title: string) => Promise<void>;
  assignManyToGroup: (tabIds: readonly number[], groupId: number) => Promise<void>;
}

interface Deps {
  tabsPort: TabsPort;
  tabs: readonly Tab[];
  setTabs: Dispatch<SetStateAction<readonly Tab[]>>;
  refresh: () => Promise<void>;
  clearSelection: (tabIds: readonly number[]) => void;
  clearAllSelection: () => void;
  disarmDelete: () => void;
}

export function useTabMutations({
  tabsPort,
  tabs,
  setTabs,
  refresh,
  clearSelection,
  clearAllSelection,
  disarmDelete,
}: Deps): TabMutations {
  // Closing the very last tab in Chrome would either close the only window or
  // (on some platforms) quit Chrome. Open a fresh new-tab page first so the
  // browser always has somewhere to land.
  const closeWithLastTabGuard = useCallback(
    async (idsToClose: readonly number[], remainingAfter: number): Promise<void> => {
      if (idsToClose.length === 0) return;
      if (remainingAfter === 0) {
        await tabsPort.openNewTab();
      }
      await tabsPort.closeMany(idsToClose);
    },
    [tabsPort],
  );

  const focus = useCallback(
    (tabId: number, windowId: number) => {
      void tabsPort.focus(tabId, windowId);
    },
    [tabsPort],
  );

  const close = useCallback(
    (tabId: number) => {
      disarmDelete();
      const remainingAfter = tabs.filter((tab) => tab.id !== tabId).length;
      setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
      clearSelection([tabId]);
      void closeWithLastTabGuard([tabId], remainingAfter);
    },
    [tabs, setTabs, closeWithLastTabGuard, disarmDelete, clearSelection],
  );

  const deleteMany = useCallback(
    (idsToDelete: readonly number[]) => {
      if (idsToDelete.length === 0) return;
      if (idsToDelete.length > 1 && !window.confirm(`Close ${String(idsToDelete.length)} tabs?`)) {
        return;
      }
      const idSet = new Set(idsToDelete);
      const remainingAfter = tabs.filter((tab) => !idSet.has(tab.id)).length;
      setTabs((prev) => prev.filter((tab) => !idSet.has(tab.id)));
      clearSelection(idsToDelete);
      void closeWithLastTabGuard(idsToDelete, remainingAfter);
    },
    [tabs, setTabs, closeWithLastTabGuard, clearSelection],
  );

  const dropOnWindow = useCallback(
    async (tabId: number, targetWindowId: number) => {
      const tab = tabs.find((each) => each.id === tabId);
      if (!tab || tab.windowId === targetWindowId) return;
      await tabsPort.moveToWindow(tabId, targetWindowId);
      await refresh();
    },
    [tabs, tabsPort, refresh],
  );

  const dropOnTabGroup = useCallback(
    async (tabId: number, targetGroupId: number | null) => {
      const tab = tabs.find((each) => each.id === tabId);
      if (!tab) return;
      const currentGroupId = tab.group?.id ?? null;
      if (currentGroupId === targetGroupId) return;
      if (targetGroupId === null) {
        await tabsPort.removeFromGroup(tabId);
      } else {
        await tabsPort.assignToGroup(tabId, targetGroupId);
      }
      await refresh();
    },
    [tabs, tabsPort, refresh],
  );

  const createGroup = useCallback(
    async (tabIds: readonly number[], title: string) => {
      if (tabIds.length === 0) return;
      await tabsPort.createGroup(tabIds, title);
      clearAllSelection();
      await refresh();
    },
    [tabsPort, refresh, clearAllSelection],
  );

  const assignManyToGroup = useCallback(
    async (tabIds: readonly number[], groupId: number) => {
      if (tabIds.length === 0) return;
      await tabsPort.assignManyToGroup(tabIds, groupId);
      clearAllSelection();
      await refresh();
    },
    [tabsPort, refresh, clearAllSelection],
  );

  return {
    focus,
    close,
    deleteMany,
    dropOnWindow,
    dropOnTabGroup,
    createGroup,
    assignManyToGroup,
  };
}
