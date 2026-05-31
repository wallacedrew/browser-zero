import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { Tab } from '../../shared/lib/types';
import type { TabsPort } from '../../shared/adapters/tabsPort';
import { Timestamp } from '../../shared/lib/Timestamp';

export interface TabsData {
  readonly tabs: readonly Tab[];
  readonly setTabs: Dispatch<SetStateAction<readonly Tab[]>>;
  readonly loaded: boolean;
  readonly now: Timestamp;
  refreshTabs: () => Promise<void>;
}

export function useTabsData(tabsPort: TabsPort, nowOverride: Timestamp | undefined): TabsData {
  const [tabs, setTabs] = useState<readonly Tab[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState<Timestamp>(() => nowOverride ?? Timestamp.now());

  const refreshTabs = useCallback(async () => {
    setNow(nowOverride ?? Timestamp.now());
    const next = await tabsPort.queryAll();
    setTabs(next);
    setLoaded(true);
  }, [tabsPort, nowOverride]);

  useEffect(() => {
    // Initial mount load. No query library yet, so this is the standard
    // useEffect→setState pattern that react-hooks/set-state-in-effect flags by default.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshTabs();
  }, [refreshTabs]);

  return { tabs, setTabs, loaded, now, refreshTabs };
}
