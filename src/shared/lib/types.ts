export interface TabGroupInfo {
  readonly id: number;
  readonly title: string;
  readonly color: string;
}

export interface Tab {
  readonly id: number;
  readonly windowId: number;
  readonly title: string;
  readonly url: string;
  readonly domain: string;
  readonly lastAccessed: number;
  readonly group: TabGroupInfo | null;
}
