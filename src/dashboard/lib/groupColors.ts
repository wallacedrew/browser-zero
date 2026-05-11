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
