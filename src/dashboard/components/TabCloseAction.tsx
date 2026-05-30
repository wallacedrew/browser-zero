import type { ArmedDeleteActions } from './TabRow';

interface Props {
  tabId: number;
  tabTitle: string;
  armed: boolean;
  actions: ArmedDeleteActions;
}

export function TabCloseAction({ tabId, tabTitle, armed, actions }: Props) {
  const handleArm = () => {
    actions.arm(tabId);
  };

  const handleConfirm = () => {
    actions.confirm(tabId);
  };

  if (!armed) {
    return (
      <button
        type="button"
        aria-label={`Close ${tabTitle}`}
        onClick={handleArm}
        className="shrink-0 rounded p-1 text-lg leading-none text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        ×
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Confirm close ${tabTitle}`}
        data-armed-delete="true"
        onClick={handleConfirm}
        className="shrink-0 rounded-full bg-red-600 px-2.5 py-0.5 text-sm font-medium text-white shadow-sm hover:bg-red-700"
      >
        Close?
      </button>
      <button
        type="button"
        aria-label={`Keep ${tabTitle}`}
        data-armed-delete="true"
        onClick={actions.disarm}
        className="shrink-0 rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Keep
      </button>
    </>
  );
}
