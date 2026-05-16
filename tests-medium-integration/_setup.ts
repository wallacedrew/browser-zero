import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom does not implement Element.prototype.scrollIntoView. Stub it
// globally so any component that calls it doesn't throw during tests.
// Per-test assertions use vi.spyOn on top.
Element.prototype.scrollIntoView = vi.fn();

// jsdom defines window.scrollTo as a no-op, but assigning a vi.fn() lets
// per-test code spy on it cleanly without polluting the original.
window.scrollTo = vi.fn();

// jsdom does not implement IntersectionObserver either. Stub it so the
// TabList active-section observer can attach without throwing during
// tests; the stub never fires, so activeKey stays null in tests (which
// matches "no scrolling has happened yet" — fine for our assertions).
class IntersectionObserverStub {
  observe(): void {
    /* noop */
  }
  unobserve(): void {
    /* noop */
  }
  disconnect(): void {
    /* noop */
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
}
globalThis.IntersectionObserver =
  IntersectionObserverStub as unknown as typeof IntersectionObserver;

afterEach(() => {
  cleanup();
});
