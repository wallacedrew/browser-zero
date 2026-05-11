import type { Tab } from '../lib/types';

export interface TabsPort {
  queryAll(): Promise<readonly Tab[]>;
  focus(tabId: number, windowId: number): Promise<void>;
  closeMany(tabIds: readonly number[]): Promise<void>;
  openNewTab(): Promise<void>;
  moveToWindow(tabId: number, windowId: number): Promise<void>;
  assignToGroup(tabId: number, groupId: number): Promise<void>;
  removeFromGroup(tabId: number): Promise<void>;
  createGroup(tabIds: readonly number[], title: string): Promise<void>;
  assignManyToGroup(tabIds: readonly number[], groupId: number): Promise<void>;
}
