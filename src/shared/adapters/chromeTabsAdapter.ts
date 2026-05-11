import type { Tab, TabGroupInfo } from '../lib/types';
import type { TabsPort } from './tabsPort';
import { extractDomain } from '../lib/extractDomain';

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

  async closeMany(tabIds: readonly number[]): Promise<void> {
    if (tabIds.length === 0) return;
    await chrome.tabs.remove([...tabIds]);
  }

  async openNewTab(): Promise<void> {
    await chrome.tabs.create({});
  }

  async moveToWindow(tabId: number, windowId: number): Promise<void> {
    // index: -1 appends to the end of the target window's tab strip.
    await chrome.tabs.move(tabId, { windowId, index: -1 });
  }

  async assignToGroup(tabId: number, groupId: number): Promise<void> {
    await chrome.tabs.group({ groupId, tabIds: [tabId] });
  }

  async removeFromGroup(tabId: number): Promise<void> {
    await chrome.tabs.ungroup(tabId);
  }

  async createGroup(tabIds: readonly number[], title: string): Promise<void> {
    const nonEmpty = toNonEmptyTuple(tabIds);
    if (!nonEmpty) return;
    const groupId = await chrome.tabs.group({ tabIds: nonEmpty });
    if (title.length > 0) {
      await chrome.tabGroups.update(groupId, { title });
    }
  }

  async assignManyToGroup(tabIds: readonly number[], groupId: number): Promise<void> {
    const nonEmpty = toNonEmptyTuple(tabIds);
    if (!nonEmpty) return;
    await chrome.tabs.group({ groupId, tabIds: nonEmpty });
  }
}

// chrome.tabs.group's typings require a non-empty tuple `[number, ...number[]]`.
// We runtime-check for emptiness in each port method; this helper bridges
// the runtime guard to the type system so the cast lives in one place.
function toNonEmptyTuple(tabIds: readonly number[]): [number, ...number[]] | null {
  if (tabIds.length === 0) return null;
  const [first, ...rest] = tabIds;
  return [first as number, ...rest];
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
    lastAccessed: chromeTab.lastAccessed ?? Date.now(),
    group: resolveGroup(chromeTab.groupId, groupsById),
  };
}

// Inlined from chrome.tabGroups.TAB_GROUP_ID_NONE. The constant is -1 per the
// Chrome API spec and never changes; inlining avoids a runtime crash if
// chrome.tabGroups is absent (e.g. the extension hasn't been reloaded since
// the "tabGroups" permission was added to the manifest).
const TAB_GROUP_ID_NONE = -1;

function resolveGroup(
  groupId: number | undefined,
  groupsById: Map<number, chrome.tabGroups.TabGroup>,
): TabGroupInfo | null {
  if (groupId === undefined || groupId === TAB_GROUP_ID_NONE) {
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
