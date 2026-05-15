const DOT_CLASS_BY_COLOR: Record<string, string> = {
  grey: 'bg-slate-400',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
};

const DEFAULT_DOT_CLASS = 'bg-slate-400';

export function dotClassForGroupColor(color: string): string {
  return DOT_CLASS_BY_COLOR[color] ?? DEFAULT_DOT_CLASS;
}

// Chip variants used by the sticky GroupNav. Two flavours per color:
// `active` (filled, white text — the "you are here" pill) and `inactive`
// (light-tinted background + tinted border + dark-color text + a slightly
// darker hover). Concrete class strings keep Tailwind's JIT happy — no
// dynamic class construction.

const ACTIVE_CHIP_CLASS_BY_COLOR: Record<string, string> = {
  grey: 'bg-slate-700 text-white',
  blue: 'bg-blue-600 text-white',
  red: 'bg-red-600 text-white',
  yellow: 'bg-yellow-500 text-slate-900',
  green: 'bg-green-600 text-white',
  pink: 'bg-pink-600 text-white',
  purple: 'bg-purple-600 text-white',
  cyan: 'bg-cyan-600 text-white',
  orange: 'bg-orange-500 text-white',
};

const INACTIVE_CHIP_CLASS_BY_COLOR: Record<string, string> = {
  grey: 'border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100',
  blue: 'border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
  red: 'border border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
  yellow: 'border border-yellow-300 bg-yellow-50 text-yellow-900 hover:bg-yellow-100',
  green: 'border border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
  pink: 'border border-pink-200 bg-pink-50 text-pink-800 hover:bg-pink-100',
  purple: 'border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100',
  cyan: 'border border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100',
  orange: 'border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100',
};

const DEFAULT_ACTIVE_CHIP_CLASS = 'bg-slate-900 text-white';
const DEFAULT_INACTIVE_CHIP_CLASS =
  'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100';

export function activeChipClassForGroupColor(color: string | null): string {
  if (color === null) return DEFAULT_ACTIVE_CHIP_CLASS;
  return ACTIVE_CHIP_CLASS_BY_COLOR[color] ?? DEFAULT_ACTIVE_CHIP_CLASS;
}

export function inactiveChipClassForGroupColor(color: string | null): string {
  if (color === null) return DEFAULT_INACTIVE_CHIP_CLASS;
  return INACTIVE_CHIP_CLASS_BY_COLOR[color] ?? DEFAULT_INACTIVE_CHIP_CLASS;
}

// Chrome-tab-shaped section header styling. Two slots:
// - `tab` colors the rounded-top label that visually represents the
//   browser-tab shape (light tint background, tinted border on three
//   sides, dark colored text).
// - `shelf` colors the horizontal line the tab "sits on" — the
//   continuous strip running the section's width directly under the tab.
// Together the two slots produce a Chrome-style tab + bar.

interface SectionHeaderClasses {
  readonly tab: string;
  readonly shelf: string;
}

const SECTION_HEADER_CLASSES_BY_COLOR: Record<string, SectionHeaderClasses> = {
  grey: {
    tab: 'border border-slate-300 bg-slate-100 text-slate-800',
    shelf: 'border-slate-300',
  },
  blue: {
    tab: 'border border-blue-300 bg-blue-100 text-blue-900',
    shelf: 'border-blue-300',
  },
  red: {
    tab: 'border border-red-300 bg-red-100 text-red-900',
    shelf: 'border-red-300',
  },
  yellow: {
    tab: 'border border-yellow-400 bg-yellow-100 text-yellow-900',
    shelf: 'border-yellow-400',
  },
  green: {
    tab: 'border border-green-300 bg-green-100 text-green-900',
    shelf: 'border-green-300',
  },
  pink: {
    tab: 'border border-pink-300 bg-pink-100 text-pink-900',
    shelf: 'border-pink-300',
  },
  purple: {
    tab: 'border border-purple-300 bg-purple-100 text-purple-900',
    shelf: 'border-purple-300',
  },
  cyan: {
    tab: 'border border-cyan-300 bg-cyan-100 text-cyan-900',
    shelf: 'border-cyan-300',
  },
  orange: {
    tab: 'border border-orange-300 bg-orange-100 text-orange-900',
    shelf: 'border-orange-300',
  },
};

const DEFAULT_SECTION_HEADER_CLASSES: SectionHeaderClasses = {
  tab: 'border border-slate-200 bg-slate-50 text-slate-700',
  shelf: 'border-slate-200',
};

export function sectionHeaderClassesForGroupColor(color: string | null): SectionHeaderClasses {
  if (color === null) return DEFAULT_SECTION_HEADER_CLASSES;
  return SECTION_HEADER_CLASSES_BY_COLOR[color] ?? DEFAULT_SECTION_HEADER_CLASSES;
}
