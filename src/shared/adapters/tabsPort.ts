import type { Tab } from '../lib/types';

export interface TabsPort {
  queryAll(): Promise<readonly Tab[]>;
  focus(tabId: number, windowId: number): Promise<void>;
}
