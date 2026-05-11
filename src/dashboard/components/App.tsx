import { useCallback, useEffect, useState } from 'react';
import type { Tab } from '../../shared/lib/types';
import type { TabsPort } from '../../shared/adapters/tabsPort';
import { TabList } from './TabList';

interface Props {
  tabsPort: TabsPort;
  now?: number;
}

export function App({ tabsPort, now: nowOverride }: Props) {
  const [tabs, setTabs] = useState<readonly Tab[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState<number>(() => nowOverride ?? Date.now());

  const refresh = useCallback(async () => {
    setNow(nowOverride ?? Date.now());
    const next = await tabsPort.queryAll();
    setTabs(next);
    setLoaded(true);
  }, [tabsPort, nowOverride]);

  useEffect(() => {
    // Initial mount load. No query library in slice 1, so this is the standard
    // useEffect→setState pattern that react-hooks/set-state-in-effect flags by default.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const handleFocus = useCallback(
    (tabId: number, windowId: number) => {
      void tabsPort.focus(tabId, windowId);
    },
    [tabsPort],
  );

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">browser-zero</h1>
          <p className="text-sm text-slate-500">
            {tabs.length} tab{tabs.length === 1 ? '' : 's'} across all windows
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-700"
        >
          Refresh
        </button>
      </header>
      {loaded ? (
        <TabList tabs={tabs} now={now} onFocus={handleFocus} />
      ) : (
        <p className="text-slate-400">Loading…</p>
      )}
    </main>
  );
}
