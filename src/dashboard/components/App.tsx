import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Tab } from '../../shared/lib/types';
import type { TabsPort } from '../../shared/adapters/tabsPort';
import type { GroupBy } from '../../shared/lib/grouping';
import { filterTabs } from '../../shared/lib/filterTabs';
import { TabList } from './TabList';
import { ViewToggle } from './ViewToggle';

interface Props {
  tabsPort: TabsPort;
  now?: number;
}

export function App({ tabsPort, now: nowOverride }: Props) {
  const [tabs, setTabs] = useState<readonly Tab[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState<number>(() => nowOverride ?? Date.now());
  const [groupBy, setGroupBy] = useState<GroupBy>('window');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const [armedDeleteId, setArmedDeleteId] = useState<number | null>(null);

  const isFiltering = search.trim().length > 0;
  const visibleTabs = useMemo(() => filterTabs(tabs, search), [tabs, search]);
  const summaryTabs = isFiltering ? visibleTabs : tabs;
  const groupedCount = summaryTabs.filter((tab) => tab.group !== null).length;
  const ungroupedCount = summaryTabs.length - groupedCount;

  const refresh = useCallback(async () => {
    setNow(nowOverride ?? Date.now());
    const next = await tabsPort.queryAll();
    setTabs(next);
    setSelected(new Set());
    setLoaded(true);
  }, [tabsPort, nowOverride]);

  useEffect(() => {
    // Initial mount load. No query library yet, so this is the standard
    // useEffect→setState pattern that react-hooks/set-state-in-effect flags by default.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  // When an × is armed for delete, any mousedown that lands outside the armed
  // button disarms it. Listening on mousedown (not click) so a click on the
  // armed button itself still gets to fire its handler with the armed state.
  useEffect(() => {
    if (armedDeleteId === null) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-armed-delete="true"]')) return;
      setArmedDeleteId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [armedDeleteId]);

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

  const handleArmDelete = useCallback((tabId: number) => {
    setArmedDeleteId(tabId);
  }, []);

  const handleDisarm = useCallback(() => {
    setArmedDeleteId(null);
  }, []);

  const handleClose = useCallback(
    (tabId: number) => {
      setArmedDeleteId(null);
      const remainingAfter = tabs.filter((tab) => tab.id !== tabId).length;
      setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
      setSelected((prev) => {
        if (!prev.has(tabId)) return prev;
        const next = new Set(prev);
        next.delete(tabId);
        return next;
      });
      void closeWithLastTabGuard([tabId], remainingAfter);
    },
    [tabs, closeWithLastTabGuard],
  );

  const handleSelectionToggle = useCallback((tabId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  }, []);

  const handleSelectGroup = useCallback((tabIds: readonly number[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of tabIds) next.add(id);
      return next;
    });
  }, []);

  const handleClearGroup = useCallback((tabIds: readonly number[]) => {
    setSelected((prev) => {
      if (tabIds.every((id) => !prev.has(id))) return prev;
      const next = new Set(prev);
      for (const id of tabIds) next.delete(id);
      return next;
    });
  }, []);

  const handleDeleteIds = useCallback(
    (idsToDelete: readonly number[]) => {
      if (idsToDelete.length === 0) return;
      if (idsToDelete.length > 1 && !window.confirm(`Close ${String(idsToDelete.length)} tabs?`)) {
        return;
      }
      const idSet = new Set(idsToDelete);
      const remainingAfter = tabs.filter((tab) => !idSet.has(tab.id)).length;
      setTabs((prev) => prev.filter((tab) => !idSet.has(tab.id)));
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of idsToDelete) next.delete(id);
        return next;
      });
      void closeWithLastTabGuard(idsToDelete, remainingAfter);
    },
    [tabs, closeWithLastTabGuard],
  );

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">browser-zero</h1>
          <p className="text-sm text-slate-500">
            {isFiltering
              ? `${visibleTabs.length} of ${tabs.length} tab${tabs.length === 1 ? '' : 's'} match`
              : `${tabs.length} tab${tabs.length === 1 ? '' : 's'}`}
            {groupedCount > 0 && ` · ${groupedCount} in groups`}
            {ungroupedCount > 0 && ` · ${ungroupedCount} ungrouped`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle value={groupBy} onChange={setGroupBy} />
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-700"
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
        className="mb-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      {loaded ? (
        <TabList
          tabs={visibleTabs}
          now={now}
          groupBy={groupBy}
          selected={selected}
          armedDeleteId={armedDeleteId}
          onSelectionToggle={handleSelectionToggle}
          onSelectGroup={handleSelectGroup}
          onClearGroup={handleClearGroup}
          onDeleteIds={handleDeleteIds}
          onFocus={handleFocus}
          onArmDelete={handleArmDelete}
          onDisarm={handleDisarm}
          onClose={handleClose}
        />
      ) : (
        <p className="text-slate-400">Loading…</p>
      )}
    </main>
  );
}
