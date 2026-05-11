import type { Tab, TabGroupInfo } from '../lib/types';
import type { TabsPort } from './tabsPort';
import { extractDomain } from '../lib/extractDomain';
import { inferIntent } from '../lib/intents';

export class ChromeTabsAdapter implements TabsPort {
  async queryAll(): Promise<readonly Tab[]> {
    const [chromeTabs, chromeGroups] = await Promise.all([
      chrome.tabs.query({}),
      queryTabGroupsSafe(),
    ]);
    const groupsById = new Map<number, chrome.tabGroups.TabGroup>(
      chromeGroups.map((group) => [group.id, group]),
    );
    return chromeTabs
      .filter(isResolvableTab)
      .map((chromeTab) => toDomainTab(chromeTab, groupsById));
  }

  async focus(tabId: number, windowId: number): Promise<void> {
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(windowId, { focused: true });
  }

  async close(tabId: number): Promise<void> {
    await chrome.tabs.remove(tabId);
  }
}

async function queryTabGroupsSafe(): Promise<readonly chrome.tabGroups.TabGroup[]> {
  // chrome.tabGroups is undefined until the user reloads the extension after
  // the "tabGroups" permission was added to the manifest. Fall back to an empty
  // list so the dashboard still loads — every tab simply lands in "Ungrouped".
  if (!chrome.tabGroups) return [];
  return chrome.tabGroups.query({});
}

type ResolvableChromeTab = chrome.tabs.Tab & { id: number };

function isResolvableTab(tab: chrome.tabs.Tab): tab is ResolvableChromeTab {
  return tab.id !== undefined;
}

function toDomainTab(
  chromeTab: ResolvableChromeTab,
  groupsById: Map<number, chrome.tabGroups.TabGroup>,
): Tab {
  const url = chromeTab.url ?? chromeTab.pendingUrl ?? '';
  return {
    id: chromeTab.id,
    windowId: chromeTab.windowId,
    title: chromeTab.title ?? '(no title)',
    url,
    domain: extractDomain(url),
    intent: inferIntent(url),
    lastAccessed: chromeTab.lastAccessed ?? Date.now(),
    group: resolveGroup(chromeTab.groupId, groupsById),
  };
}

function resolveGroup(
  groupId: number | undefined,
  groupsById: Map<number, chrome.tabGroups.TabGroup>,
): TabGroupInfo | null {
  if (groupId === undefined || groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
    return null;
  }
  const chromeGroup = groupsById.get(groupId);
  if (!chromeGroup) return null;
  return {
    id: chromeGroup.id,
    title: chromeGroup.title ?? '',
    color: chromeGroup.color,
  };
}
