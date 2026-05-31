import { useCallback, useMemo, useState } from 'react';
import type { TabGroupInfo } from '../../shared/lib/types';
import type { TabsPort } from '../../shared/adapters/tabsPort';
import type { GroupBy } from '../../shared/lib/grouping';
import type { Timestamp } from '../../shared/lib/Timestamp';
import { filterTabs } from '../../shared/lib/filterTabs';
import { useArmedDelete } from '../hooks/useArmedDelete';
import { useSelection } from '../hooks/useSelection';
import { useTabsData } from '../hooks/useTabsData';
import { TabList } from './TabList';
import { ViewToggle } from './ViewToggle';

interface Props {
  tabsPort: TabsPort;
  now?: Timestamp;
}

export function App({ tabsPort, now: nowOverride }: Props) {
  const { tabs, setTabs, loaded, now, refreshTabs } = useTabsData(tabsPort, nowOverride);
  const [groupBy, setGroupBy] = useState<GroupBy>('window');
  const [search, setSearch] = useState('');
  const {
    selected,
    toggle: handleSelectionToggle,
    selectMany: handleSelectGroup,
    clearMany: handleClearGroup,
    clearAll: handleClearAllSelection,
  } = useSelection();
  const { armedTabId, arm: handleArmDelete, disarm: handleDisarm } = useArmedDelete();

  const isFiltering = search.trim().length > 0;
  const visibleTabs = useMemo(() => filterTabs(tabs, search), [tabs, search]);
  const summaryTabs = isFiltering ? visibleTabs : tabs;
  const groupedCount = summaryTabs.filter((tab) => tab.group !== null).length;
  const ungroupedCount = summaryTabs.length - groupedCount;
  const windowCount = new Set(summaryTabs.map((tab) => tab.windowId)).size;
  const existingGroups = useMemo<TabGroupInfo[]>(() => {
    const seen = new Map<number, TabGroupInfo>();
    for (const tab of tabs) {
      if (tab.group && !seen.has(tab.group.id)) seen.set(tab.group.id, tab.group);
    }
    return [...seen.values()];
  }, [tabs]);

  const refresh = useCallback(async () => {
    await refreshTabs();
    handleClearAllSelection();
  }, [refreshTabs, handleClearAllSelection]);

  const handleFocus = useCallback(
    (tabId: number, windowId: number) => {
      void tabsPort.focus(tabId, windowId);
    },
    [tabsPort],
  );

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

  const handleClose = useCallback(
    (tabId: number) => {
      handleDisarm();
      const remainingAfter = tabs.filter((tab) => tab.id !== tabId).length;
      setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
      handleClearGroup([tabId]);
      void closeWithLastTabGuard([tabId], remainingAfter);
    },
    [tabs, closeWithLastTabGuard, handleDisarm, handleClearGroup],
  );

  const handleDropOnWindow = useCallback(
    async (tabId: number, targetWindowId: number) => {
      const tab = tabs.find((each) => each.id === tabId);
      if (!tab || tab.windowId === targetWindowId) return;
      await tabsPort.moveToWindow(tabId, targetWindowId);
      await refresh();
    },
    [tabs, tabsPort, refresh],
  );

  const handleDropOnTabGroup = useCallback(
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

  const handleCreateGroup = useCallback(
    async (tabIds: readonly number[], title: string) => {
      if (tabIds.length === 0) return;
      await tabsPort.createGroup(tabIds, title);
      handleClearAllSelection();
      await refresh();
    },
    [tabsPort, refresh, handleClearAllSelection],
  );

  const handleAssignManyToGroup = useCallback(
    async (tabIds: readonly number[], groupId: number) => {
      if (tabIds.length === 0) return;
      await tabsPort.assignManyToGroup(tabIds, groupId);
      handleClearAllSelection();
      await refresh();
    },
    [tabsPort, refresh, handleClearAllSelection],
  );

  const handleDeleteIds = useCallback(
    (idsToDelete: readonly number[]) => {
      if (idsToDelete.length === 0) return;
      if (idsToDelete.length > 1 && !window.confirm(`Close ${String(idsToDelete.length)} tabs?`)) {
        return;
      }
      const idSet = new Set(idsToDelete);
      const remainingAfter = tabs.filter((tab) => !idSet.has(tab.id)).length;
      setTabs((prev) => prev.filter((tab) => !idSet.has(tab.id)));
      handleClearGroup(idsToDelete);
      void closeWithLastTabGuard(idsToDelete, remainingAfter);
    },
    [tabs, closeWithLastTabGuard, handleClearGroup],
  );

  return (
    <main className="min-h-screen bg-white p-8">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">browser-zero</h1>
          <p className="text-base text-slate-500">
            {isFiltering
              ? `${visibleTabs.length} of ${tabs.length} tab${tabs.length === 1 ? '' : 's'} match`
              : `${tabs.length} tab${tabs.length === 1 ? '' : 's'}`}
            {groupedCount > 0 && ` · ${groupedCount} in groups`}
            {ungroupedCount > 0 && ` · ${ungroupedCount} ungrouped`}
            {windowCount > 1 && ` · all across ${windowCount} windows`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle value={groupBy} onChange={setGroupBy} />
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-base font-medium text-white shadow-sm hover:bg-slate-700"
          >
            Refresh
          </button>
        </div>
      </header>
      <input
        type="search"
        aria-label="Filter tabs"
        placeholder="Filter by title, URL, domain, or group…"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
        }}
        className="mb-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      {loaded ? (
        <TabList
          tabs={visibleTabs}
          now={now}
          groupBy={groupBy}
          selection={{ selected, toggle: handleSelectionToggle }}
          armedDelete={{
            armedTabId,
            actions: {
              arm: handleArmDelete,
              disarm: handleDisarm,
              confirm: handleClose,
            },
          }}
          onFocus={handleFocus}
          bulkActions={{
            select: handleSelectGroup,
            clear: handleClearGroup,
            close: handleDeleteIds,
            createGroup: handleCreateGroup,
            assignToGroup: handleAssignManyToGroup,
          }}
          dropCallbacks={{
            onDropOnWindow: handleDropOnWindow,
            onDropOnTabGroup: handleDropOnTabGroup,
          }}
          existingGroups={existingGroups}
        />
      ) : (
        <p className="text-slate-400">Loading…</p>
      )}
    </main>
  );
}
