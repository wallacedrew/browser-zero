interface SectionHeaderClasses {
  readonly tab: string;
  readonly shelf: string;
}

interface ColorPalette {
  readonly dot: string;
  readonly activeChip: string;
  readonly inactiveChip: string;
  readonly sectionHeader: SectionHeaderClasses;
}

const PALETTES: Record<string, ColorPalette> = {
  grey: {
    dot: 'bg-slate-400',
    activeChip: 'bg-slate-700 text-white',
    inactiveChip: 'border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100',
    sectionHeader: {
      tab: 'border border-slate-300 bg-slate-100 text-slate-800',
      shelf: 'border-slate-300',
    },
  },
  blue: {
    dot: 'bg-blue-500',
    activeChip: 'bg-blue-600 text-white',
    inactiveChip: 'border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
    sectionHeader: {
      tab: 'border border-blue-300 bg-blue-100 text-blue-900',
      shelf: 'border-blue-300',
    },
  },
  red: {
    dot: 'bg-red-500',
    activeChip: 'bg-red-600 text-white',
    inactiveChip: 'border border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
    sectionHeader: {
      tab: 'border border-red-300 bg-red-100 text-red-900',
      shelf: 'border-red-300',
    },
  },
  yellow: {
    dot: 'bg-yellow-400',
    activeChip: 'bg-yellow-500 text-slate-900',
    inactiveChip: 'border border-yellow-300 bg-yellow-50 text-yellow-900 hover:bg-yellow-100',
    sectionHeader: {
      tab: 'border border-yellow-400 bg-yellow-100 text-yellow-900',
      shelf: 'border-yellow-400',
    },
  },
  green: {
    dot: 'bg-green-500',
    activeChip: 'bg-green-600 text-white',
    inactiveChip: 'border border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
    sectionHeader: {
      tab: 'border border-green-300 bg-green-100 text-green-900',
      shelf: 'border-green-300',
    },
  },
  pink: {
    dot: 'bg-pink-500',
    activeChip: 'bg-pink-600 text-white',
    inactiveChip: 'border border-pink-200 bg-pink-50 text-pink-800 hover:bg-pink-100',
    sectionHeader: {
      tab: 'border border-pink-300 bg-pink-100 text-pink-900',
      shelf: 'border-pink-300',
    },
  },
  purple: {
    dot: 'bg-purple-500',
    activeChip: 'bg-purple-600 text-white',
    inactiveChip: 'border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100',
    sectionHeader: {
      tab: 'border border-purple-300 bg-purple-100 text-purple-900',
      shelf: 'border-purple-300',
    },
  },
  cyan: {
    dot: 'bg-cyan-500',
    activeChip: 'bg-cyan-600 text-white',
    inactiveChip: 'border border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100',
    sectionHeader: {
      tab: 'border border-cyan-300 bg-cyan-100 text-cyan-900',
      shelf: 'border-cyan-300',
    },
  },
  orange: {
    dot: 'bg-orange-500',
    activeChip: 'bg-orange-500 text-white',
    inactiveChip: 'border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100',
    sectionHeader: {
      tab: 'border border-orange-300 bg-orange-100 text-orange-900',
      shelf: 'border-orange-300',
    },
  },
};

const DEFAULT_PALETTE: ColorPalette = {
  dot: 'bg-slate-400',
  activeChip: 'bg-slate-900 text-white',
  inactiveChip: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
  sectionHeader: {
    tab: 'border border-slate-200 bg-slate-50 text-slate-700',
    shelf: 'border-slate-200',
  },
};

function paletteFor(color: string | null): ColorPalette {
  if (color === null) return DEFAULT_PALETTE;
  return PALETTES[color] ?? DEFAULT_PALETTE;
}

export function dotClassForGroupColor(color: string): string {
  return paletteFor(color).dot;
}

export function activeChipClassForGroupColor(color: string | null): string {
  return paletteFor(color).activeChip;
}

export function inactiveChipClassForGroupColor(color: string | null): string {
  return paletteFor(color).inactiveChip;
}

export function sectionHeaderClassesForGroupColor(color: string | null): SectionHeaderClasses {
  return paletteFor(color).sectionHeader;
}
