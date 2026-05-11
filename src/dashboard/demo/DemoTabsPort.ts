import type { Tab } from '../../shared/lib/types';
import type { TabsPort } from '../../shared/adapters/tabsPort';

/**
 * Demo port for screenshot / preview mode. Returns a fixed list of tabs;
 * all mutating methods are no-ops so the UI is non-destructive. This is
 * NOT shipped in the production extension bundle — only loaded by the
 * dev-mode demo.html entry.
 */
export class DemoTabsPort implements TabsPort {
  constructor(private readonly tabs: readonly Tab[]) {}

  queryAll(): Promise<readonly Tab[]> {
    return Promise.resolve(this.tabs);
  }

  focus(): Promise<void> {
    return Promise.resolve();
  }

  closeMany(): Promise<void> {
    return Promise.resolve();
  }

  openNewTab(): Promise<void> {
    return Promise.resolve();
  }

  moveToWindow(): Promise<void> {
    return Promise.resolve();
  }

  assignToGroup(): Promise<void> {
    return Promise.resolve();
  }

  removeFromGroup(): Promise<void> {
    return Promise.resolve();
  }

  createGroup(): Promise<void> {
    return Promise.resolve();
  }

  assignManyToGroup(): Promise<void> {
    return Promise.resolve();
  }
}
