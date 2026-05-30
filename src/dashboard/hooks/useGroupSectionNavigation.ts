import { useEffect, useRef, useState, type RefObject } from 'react';

export interface GroupSectionNavigation {
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly resolvedActiveKey: string | null;
  scrollToGroup: (groupKey: string) => void;
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
  // so the sticky GroupNav can highlight its chip. rootMargin shrinks the
  // intersection rect to ~the band just below the sticky nav so the
  // "active" section is the one a reader is actually looking at.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;
    const sections = container.querySelectorAll<HTMLElement>('[data-group-key]');
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
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
      { rootMargin: '-72px 0px -55% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [groupKeysFingerprint]);

  // scrollIntoView({ block: 'start' }) lines the section up with the
  // viewport top — directly behind our sticky chip nav, occluding the
  // section header. Measure the sticky nav's actual rendered height
  // (it can be multi-row when there are many chips, e.g. by-domain) and
  // scroll so the section header lands a small gap below the nav.
  const scrollToGroup = (groupKey: string) => {
    const target = containerRef.current?.querySelector<HTMLElement>(
      `[data-group-key="${groupKey}"]`,
    );
    if (!target) return;
    const nav = containerRef.current?.querySelector<HTMLElement>('nav[aria-label="Jump to group"]');
    const navHeight = nav?.offsetHeight ?? 0;
    const breathingRoom = 8;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: targetTop - navHeight - breathingRoom, behavior: 'smooth' });
    setActiveKey(groupKey);
  };

  return { containerRef, resolvedActiveKey, scrollToGroup };
}
