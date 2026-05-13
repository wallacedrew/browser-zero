import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom does not implement Element.prototype.scrollIntoView. Stub it
// globally so any component that calls it (e.g. GroupNav's jump links)
// doesn't throw during tests. Per-test assertions use vi.spyOn on top.
Element.prototype.scrollIntoView = vi.fn();

afterEach(() => {
  cleanup();
});
