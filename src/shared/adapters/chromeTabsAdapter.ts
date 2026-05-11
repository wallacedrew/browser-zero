import type { Tab } from '../lib/types';
import type { TabsPort } from './tabsPort';
import { extractDomain } from '../lib/extractDomain';
import { inferIntent } from '../lib/intents';

export class ChromeTabsAdapter implements TabsPort {
  async queryAll(): Promise<readonly Tab[]> {
    const chromeTabs = await chrome.tabs.query({});
    return chromeTabs.filter(isResolvableTab).map(toDomainTab);
  }

  async focus(tabId: number, windowId: number): Promise<void> {
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(windowId, { focused: true });
  }

  async close(tabId: number): Promise<void> {
    await chrome.tabs.remove(tabId);
  }
}

type ResolvableChromeTab = chrome.tabs.Tab & { id: number };

function isResolvableTab(tab: chrome.tabs.Tab): tab is ResolvableChromeTab {
  return tab.id !== undefined;
}

function toDomainTab(chromeTab: ResolvableChromeTab): Tab {
  const url = chromeTab.url ?? chromeTab.pendingUrl ?? '';
  return {
    id: chromeTab.id,
    windowId: chromeTab.windowId,
    title: chromeTab.title ?? '(no title)',
    url,
    domain: extractDomain(url),
    intent: inferIntent(url),
    lastAccessed: chromeTab.lastAccessed ?? Date.now(),
  };
}
