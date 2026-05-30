export interface SelectionModel {
  selected: ReadonlySet<number>;
  toggle: (tabId: number) => void;
}
