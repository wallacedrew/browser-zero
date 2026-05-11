import type { Tab } from '../lib/types';

export interface TabsPort {
  queryAll(): Promise<readonly Tab[]>;
  focus(tabId: number, windowId: number): Promise<void>;
  close(tabId: number): Promise<void>;
  closeMany(tabIds: readonly number[]): Promise<void>;
}
