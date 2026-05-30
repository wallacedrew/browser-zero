export interface BulkTabActions {
  select: (tabIds: readonly number[]) => void;
  clear: (tabIds: readonly number[]) => void;
  close: (tabIds: readonly number[]) => void;
  createGroup: (tabIds: readonly number[], title: string) => void;
  assignToGroup: (tabIds: readonly number[], groupId: number) => void;
}
