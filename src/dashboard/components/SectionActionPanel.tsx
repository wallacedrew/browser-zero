import { useState } from 'react';
import type { TabGroupInfo } from '../../shared/lib/types';
import type { BulkTabActions } from '../lib/bulkTabActions';
import { GroupPicker } from './GroupPicker';

interface Props {
  groupLabel: string;
  groupIds: readonly number[];
  selectedIds: readonly number[];
  allowGrouping: boolean;
  existingGroups: ReadonlyArray<TabGroupInfo>;
  bulkActions: BulkTabActions;
}

export function SectionActionPanel({
  groupLabel,
  groupIds,
  selectedIds,
  allowGrouping,
  existingGroups,
  bulkActions,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (selectedIds.length === 0) return null;
  const count = selectedIds.length;

  const closePicker = () => {
    setPickerOpen(false);
  };

  return (
    <div
      role="region"
      aria-label={`${groupLabel} selection actions`}
      className="relative flex flex-wrap items-center justify-end gap-3 text-sm"
    >
      <span className="font-medium text-slate-700">
        {count} tab{count === 1 ? '' : 's'} selected
      </span>
      {allowGrouping && (
        <button
          type="button"
          onClick={() => {
            setPickerOpen((prev) => !prev);
          }}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-0.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Add to group ▾
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          bulkActions.close(selectedIds);
        }}
        className="rounded-md bg-red-600 px-2.5 py-0.5 text-sm font-medium text-white shadow-sm hover:bg-red-700"
      >
        Close?
      </button>
      <button
        type="button"
        onClick={() => {
          bulkActions.clear(groupIds);
        }}
        className="text-slate-500 hover:text-slate-700 hover:underline"
      >
        Keep
      </button>
      {pickerOpen && (
        <GroupPicker
          existingGroups={existingGroups}
          onCreateGroup={(title) => {
            bulkActions.createGroup(selectedIds, title);
            closePicker();
          }}
          onAssignToExisting={(groupId) => {
            bulkActions.assignToGroup(selectedIds, groupId);
            closePicker();
          }}
          onClose={closePicker}
        />
      )}
    </div>
  );
}
