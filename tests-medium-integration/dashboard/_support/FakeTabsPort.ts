import type { Tab } from '../../../src/shared/lib/types';
import type { TabsPort } from '../../../src/shared/adapters/tabsPort';

export class FakeTabsPort implements TabsPort {
  readonly focusCalls: Array<{ tabId: number; windowId: number }> = [];
  readonly closeManyCalls: number[][] = [];
  readonly moveToWindowCalls: Array<{ tabId: number; windowId: number }> = [];
  readonly assignToGroupCalls: Array<{ tabId: number; groupId: number }> = [];
  readonly removeFromGroupCalls: number[] = [];
  readonly createGroupCalls: Array<{ tabIds: number[]; title: string }> = [];
  readonly assignManyToGroupCalls: Array<{ tabIds: number[]; groupId: number }> = [];
  newTabCalls = 0;
  private tabs: readonly Tab[];

  constructor(initialTabs: readonly Tab[]) {
    this.tabs = initialTabs;
  }

  setTabs(tabs: readonly Tab[]): void {
    this.tabs = tabs;
  }

  queryAll(): Promise<readonly Tab[]> {
    return Promise.resolve(this.tabs);
  }

  focus(tabId: number, windowId: number): Promise<void> {
    this.focusCalls.push({ tabId, windowId });
    return Promise.resolve();
  }

  closeMany(tabIds: readonly number[]): Promise<void> {
    this.closeManyCalls.push([...tabIds]);
    const toClose = new Set(tabIds);
    this.tabs = this.tabs.filter((tab) => !toClose.has(tab.id));
    return Promise.resolve();
  }

  openNewTab(): Promise<void> {
    this.newTabCalls += 1;
    return Promise.resolve();
  }

  moveToWindow(tabId: number, windowId: number): Promise<void> {
    this.moveToWindowCalls.push({ tabId, windowId });
    return Promise.resolve();
  }

  assignToGroup(tabId: number, groupId: number): Promise<void> {
    this.assignToGroupCalls.push({ tabId, groupId });
    return Promise.resolve();
  }

  removeFromGroup(tabId: number): Promise<void> {
    this.removeFromGroupCalls.push(tabId);
    return Promise.resolve();
  }

  createGroup(tabIds: readonly number[], title: string): Promise<void> {
    this.createGroupCalls.push({ tabIds: [...tabIds], title });
    return Promise.resolve();
  }

  assignManyToGroup(tabIds: readonly number[], groupId: number): Promise<void> {
    this.assignManyToGroupCalls.push({ tabIds: [...tabIds], groupId });
    return Promise.resolve();
  }
}
