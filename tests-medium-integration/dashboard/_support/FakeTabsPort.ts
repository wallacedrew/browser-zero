import type { Tab } from '../../../src/shared/lib/types';
import type { TabsPort } from '../../../src/shared/adapters/tabsPort';

export class FakeTabsPort implements TabsPort {
  readonly focusCalls: Array<{ tabId: number; windowId: number }> = [];
  readonly closeCalls: number[] = [];
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

  close(tabId: number): Promise<void> {
    this.closeCalls.push(tabId);
    this.tabs = this.tabs.filter((tab) => tab.id !== tabId);
    return Promise.resolve();
  }
}
