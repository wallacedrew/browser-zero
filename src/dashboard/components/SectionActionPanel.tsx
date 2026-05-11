interface Props {
  groupLabel: string;
  groupIds: readonly number[];
  selectedIds: readonly number[];
  onClearGroup: (tabIds: readonly number[]) => void;
  onDeleteIds: (tabIds: readonly number[]) => void;
}

export function SectionActionPanel({
  groupLabel,
  groupIds,
  selectedIds,
  onClearGroup,
  onDeleteIds,
}: Props) {
  if (selectedIds.length === 0) return null;
  const count = selectedIds.length;
  return (
    <div
      role="region"
      aria-label={`${groupLabel} selection actions`}
      className="flex flex-wrap items-center justify-end gap-3 text-sm"
    >
      <span className="font-medium text-slate-700">
        {count} tab{count === 1 ? '' : 's'} selected
      </span>
      <button
        type="button"
        onClick={() => {
          onDeleteIds(selectedIds);
        }}
        className="rounded-md bg-red-600 px-2.5 py-0.5 text-sm font-medium text-white shadow-sm hover:bg-red-700"
      >
        Close?
      </button>
      <button
        type="button"
        onClick={() => {
          onClearGroup(groupIds);
        }}
        className="text-slate-500 hover:text-slate-700 hover:underline"
      >
        Keep
      </button>
    </div>
  );
}
