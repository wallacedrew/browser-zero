import type { Tab } from '../../../src/shared/lib/types';
import type { TabsPort } from '../../../src/shared/adapters/tabsPort';

export class FakeTabsPort implements TabsPort {
  readonly focusCalls: Array<{ tabId: number; windowId: number }> = [];
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
}
