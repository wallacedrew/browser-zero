import type { ArmedDeleteActions } from '../components/TabRow';

export interface ArmedDeleteState {
  armedTabId: number | null;
  actions: ArmedDeleteActions;
}
