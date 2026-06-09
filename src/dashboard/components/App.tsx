import { useCallback, useMemo, useState } from 'react';
import type { TabsPort } from '../../shared/adapters/tabsPort';
import type { GroupBy } from '../../shared/lib/grouping';
import type { Timestamp } from '../../shared/lib/Timestamp';
import { filterTabs } from '../../shared/lib/filterTabs';
import type { LayoutBy } from '../lib/layout';
import { useArmedDelete } from '../hooks/useArmedDelete';
import { useExistingGroups } from '../hooks/useExistingGroups';
import { useSelection } from '../hooks/useSelection';
import { useTabMutations } from '../hooks/useTabMutations';
import { useTabsData } from '../hooks/useTabsData';
import { useTabSummary } from '../hooks/useTabSummary';
import { DashboardHeader } from './DashboardHeader';
import { TabList } from './TabList';
import { TabSearchInput } from './TabSearchInput';

interface Props {
  tabsPort: TabsPort;
  now?: Timestamp;
}

export function App({ tabsPort, now: nowOverride }: Props) {
  const { tabs, setTabs, loaded, now, refreshTabs } = useTabsData(tabsPort, nowOverride);
  const [groupBy, setGroupBy] = useState<GroupBy>('window');
  const [layoutBy, setLayoutBy] = useState<LayoutBy>('list');
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
  const summary = useTabSummary(isFiltering ? visibleTabs : tabs);
  const existingGroups = useExistingGroups(tabs);

  const refresh = useCallback(async () => {
    await refreshTabs();
    handleClearAllSelection();
  }, [refreshTabs, handleClearAllSelection]);

  const mutations = useTabMutations({
    tabsPort,
    tabs,
    setTabs,
    refresh,
    clearSelection: handleClearGroup,
    clearAllSelection: handleClearAllSelection,
    disarmDelete: handleDisarm,
  });

  return (
    <main className="min-h-screen bg-white p-8">
      <DashboardHeader
        totalCount={tabs.length}
        visibleCount={visibleTabs.length}
        isFiltering={isFiltering}
        summary={summary}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        layoutBy={layoutBy}
        onLayoutByChange={setLayoutBy}
        onRefresh={() => void refresh()}
      />
      <TabSearchInput value={search} onChange={setSearch} />
      {loaded ? (
        <TabList
          tabs={visibleTabs}
          now={now}
          groupBy={groupBy}
          layoutBy={layoutBy}
          selection={{ selected, toggle: handleSelectionToggle }}
          armedDelete={{
            armedTabId,
            actions: {
              arm: handleArmDelete,
              disarm: handleDisarm,
              confirm: mutations.close,
            },
          }}
          onFocus={mutations.focus}
          bulkActions={{
            select: handleSelectGroup,
            clear: handleClearGroup,
            close: mutations.deleteMany,
            createGroup: mutations.createGroup,
            assignToGroup: mutations.assignManyToGroup,
          }}
          dropCallbacks={{
            onDropOnWindow: mutations.dropOnWindow,
            onDropOnTabGroup: mutations.dropOnTabGroup,
          }}
          existingGroups={existingGroups}
        />
      ) : (
        <p className="text-slate-400">Loading…</p>
      )}
    </main>
  );
}
