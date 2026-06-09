import { useEffect, useRef, useState, type RefObject } from 'react';

export interface GroupSectionNavigation {
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly resolvedActiveKey: string | null;
  scrollToGroup: (groupKey: string) => void;
}

const STICKY_HEADER_SELECTOR = '[data-sticky-header]';

function measureStickyHeaderHeight(container: HTMLElement | null): number {
  const header = container?.querySelector<HTMLElement>(STICKY_HEADER_SELECTOR);
  return header?.offsetHeight ?? 0;
}

export function useGroupSectionNavigation(
  visibleGroupKeys: readonly string[],
): GroupSectionNavigation {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const groupKeysFingerprint = visibleGroupKeys.join('|');

  // Default-active the first visible group so the page never loads with
  // zero chips highlighted, and gracefully fall back if a previously-
  // active key disappears (e.g. user filters away that section). Computed
  // every render — cheap, and avoids an extra set-state-in-effect.
  const resolvedActiveKey =
    activeKey && visibleGroupKeys.includes(activeKey) ? activeKey : (visibleGroupKeys[0] ?? null);

  // Track which section is currently in the upper portion of the viewport
  // so the sticky chips can highlight one. rootMargin shrinks the
  // intersection rect to the band just below the sticky header so the
  // "active" section is the one a reader is actually looking at.
  // ResizeObserver re-creates the IntersectionObserver when the sticky
  // header's height changes (chips wrapping to more rows, search expanding)
  // so the inset stays accurate.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;
    const sections = container.querySelectorAll<HTMLElement>('[data-group-key]');
    if (sections.length === 0) return;

    let observer: IntersectionObserver | null = null;
    let lastInset = -1;

    const wire = () => {
      const inset = measureStickyHeaderHeight(container);
      if (inset === lastInset && observer) return;
      lastInset = inset;
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort(
              (leftEntry, rightEntry) =>
                leftEntry.boundingClientRect.top - rightEntry.boundingClientRect.top,
            );
          const topMost = visible[0];
          if (topMost) {
            const key = topMost.target.getAttribute('data-group-key');
            if (key) setActiveKey(key);
          }
        },
        { rootMargin: `-${inset}px 0px -55% 0px`, threshold: 0 },
      );
      sections.forEach((section) => observer?.observe(section));
    };

    wire();

    const header = container.querySelector<HTMLElement>(STICKY_HEADER_SELECTOR);
    const resize =
      header && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => wire()) : null;
    if (resize && header) resize.observe(header);

    return () => {
      observer?.disconnect();
      resize?.disconnect();
    };
  }, [groupKeysFingerprint]);

  // scrollIntoView({ block: 'start' }) lines the section up with the
  // viewport top — directly behind the sticky header, occluding the
  // section header. Measure the sticky region's actual rendered height
  // and scroll so the section header lands a small gap below it.
  const scrollToGroup = (groupKey: string) => {
    const target = containerRef.current?.querySelector<HTMLElement>(
      `[data-group-key="${groupKey}"]`,
    );
    if (!target) return;
    const headerHeight = measureStickyHeaderHeight(containerRef.current);
    const breathingRoom = 8;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: targetTop - headerHeight - breathingRoom, behavior: 'smooth' });
    setActiveKey(groupKey);
  };

  return { containerRef, resolvedActiveKey, scrollToGroup };
}
