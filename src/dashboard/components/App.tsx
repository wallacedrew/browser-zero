import { useCallback, useMemo, useState } from 'react';
import type { TabsPort } from '../../shared/adapters/tabsPort';
import { groupTabs, groupingStrategyFor, type GroupBy } from '../../shared/lib/grouping';
import type { Timestamp } from '../../shared/lib/Timestamp';
import { filterTabs } from '../../shared/lib/filterTabs';
import { layoutStrategyFor, type LayoutBy } from '../lib/layout';
import { useArmedDelete } from '../hooks/useArmedDelete';
import { useExistingGroups } from '../hooks/useExistingGroups';
import { useGroupSectionNavigation } from '../hooks/useGroupSectionNavigation';
import { useSelection } from '../hooks/useSelection';
import { useTabMutations } from '../hooks/useTabMutations';
import { useTabsData } from '../hooks/useTabsData';
import { useTabSummary } from '../hooks/useTabSummary';
import { useTabViewModels } from '../hooks/useTabViewModels';
import { DashboardHeader } from './DashboardHeader';
import { GroupNav } from './GroupNav';
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

  const viewModels = useTabViewModels(visibleTabs, now);
  const strategy = groupingStrategyFor(groupBy);
  const layout = layoutStrategyFor(layoutBy);
  const groups = useMemo(() => groupTabs(viewModels, groupBy), [viewModels, groupBy]);
  const groupKeysList = useMemo(() => groups.map((group) => group.key), [groups]);
  const navGroups = useMemo(
    () =>
      groups.map((group) => ({
        key: group.key,
        label: group.label,
        count: group.tabs.length,
        // Only by-tab-group has an intrinsic color per group (the Chrome tab
        // group color). by-window and by-domain have no inherent group color,
        // so they fall back to the slate default in GroupNav.
        color: strategy.sectionColorOf(group.tabs[0]),
      })),
    [groups, strategy],
  );
  const navigation = useGroupSectionNavigation(groupKeysList);

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
    <main className="min-h-screen bg-white">
      <div ref={navigation.containerRef}>
        <div
          data-sticky-header
          className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-8 pt-8 pb-3 backdrop-blur"
        >
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
          <GroupNav
            groups={navGroups}
            activeKey={navigation.resolvedActiveKey}
            onSelect={navigation.scrollToGroup}
          />
        </div>
        <div className="px-8 pt-4 pb-8">
          {loaded ? (
            <TabList
              groups={groups}
              groupKeysList={groupKeysList}
              strategy={strategy}
              layout={layout}
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
        </div>
      </div>
    </main>
  );
}
