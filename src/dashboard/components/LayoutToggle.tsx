import type { LayoutBy } from '../lib/layout';

interface Props {
  value: LayoutBy;
  onChange: (next: LayoutBy) => void;
}

interface Option {
  readonly value: LayoutBy;
  readonly label: string;
}

const OPTIONS: ReadonlyArray<Option> = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
];

export function LayoutToggle({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Tab layout"
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
