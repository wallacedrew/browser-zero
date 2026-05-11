import type { Intent } from '../../shared/lib/intents';

interface Props {
  intent: Intent;
}

const INTENT_STYLES: Record<Intent, string> = {
  Dev: 'bg-emerald-100 text-emerald-800 ring-emerald-300/40',
  Comms: 'bg-sky-100 text-sky-800 ring-sky-300/40',
  Reference: 'bg-violet-100 text-violet-800 ring-violet-300/40',
  Entertainment: 'bg-pink-100 text-pink-800 ring-pink-300/40',
  Shopping: 'bg-amber-100 text-amber-800 ring-amber-300/40',
  Other: 'bg-slate-100 text-slate-700 ring-slate-300/40',
};

export function IntentBadge({ intent }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${INTENT_STYLES[intent]}`}
    >
      {intent}
    </span>
  );
}
