import type { Intent } from './intents';

export interface Tab {
  readonly id: number;
  readonly windowId: number;
  readonly title: string;
  readonly url: string;
  readonly domain: string;
  readonly intent: Intent;
  readonly lastAccessed: number;
}
