interface Props {
  collapsed: boolean;
  shrink?: boolean;
}

export function ChevronIcon({ collapsed, shrink = false }: Props) {
  const shrinkClass = shrink ? 'shrink-0' : '';
  const rotateClass = collapsed ? '-rotate-90' : 'rotate-0';
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={`h-3.5 w-3.5 ${shrinkClass} transition-transform ${rotateClass}`}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
      />
    </svg>
  );
}
