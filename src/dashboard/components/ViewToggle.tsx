import type { GroupBy } from '../../shared/lib/grouping';

interface Props {
  value: GroupBy;
  onChange: (next: GroupBy) => void;
}

interface Option {
  readonly value: GroupBy;
  readonly label: string;
}

const OPTIONS: ReadonlyArray<Option> = [
  { value: 'window', label: 'By window' },
  { value: 'tabgroup', label: 'By tab group' },
  { value: 'domain', label: 'By domain in url' },
  { value: 'flat', label: 'Flat' },
];

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Group tabs"
      className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-sm"
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => {
              onChange(option.value);
            }}
            className={`rounded px-3 py-1 transition-colors ${
              isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
