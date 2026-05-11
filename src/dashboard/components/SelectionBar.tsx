interface Props {
  count: number;
  onDelete: () => void;
  onClear: () => void;
}

export function SelectionBar({ count, onDelete, onClear }: Props) {
  return (
    <div
      role="region"
      aria-label="Selection actions"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-100 px-3 py-2"
    >
      <span className="text-sm font-medium text-slate-700">
        {count} tab{count === 1 ? '' : 's'} selected
      </span>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white shadow-sm hover:bg-red-700"
      >
        Delete selected
      </button>
      <button
        type="button"
        onClick={onClear}
        className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
      >
        Clear selection
      </button>
    </div>
  );
}
