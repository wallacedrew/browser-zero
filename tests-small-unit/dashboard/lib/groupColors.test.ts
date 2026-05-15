import { describe, it, expect } from 'vitest';
import {
  activeChipClassForGroupColor,
  inactiveChipClassForGroupColor,
  sectionHeaderClassesForGroupColor,
} from '../../../src/dashboard/lib/groupColors';

describe('activeChipClassForGroupColor', () => {
  it('returns a vibrant filled chip class for a known Chrome group color', () => {
    expect(activeChipClassForGroupColor('blue')).toContain('bg-blue-600');
    expect(activeChipClassForGroupColor('green')).toContain('bg-green-600');
    expect(activeChipClassForGroupColor('yellow')).toContain('text-slate-900');
  });

  it('falls back to slate-900 fill for null and unknown colors', () => {
    expect(activeChipClassForGroupColor(null)).toContain('bg-slate-900');
    expect(activeChipClassForGroupColor('mauve')).toContain('bg-slate-900');
  });
});

describe('inactiveChipClassForGroupColor', () => {
  it('returns a tinted-outline chip class for a known Chrome group color', () => {
    expect(inactiveChipClassForGroupColor('orange')).toContain('bg-orange-50');
    expect(inactiveChipClassForGroupColor('orange')).toContain('text-orange-800');
    expect(inactiveChipClassForGroupColor('orange')).toContain('border-orange-200');
  });

  it('falls back to slate outline for null and unknown colors', () => {
    expect(inactiveChipClassForGroupColor(null)).toContain('bg-white');
    expect(inactiveChipClassForGroupColor(null)).toContain('text-slate-700');
    expect(inactiveChipClassForGroupColor('mauve')).toContain('text-slate-700');
  });
});

describe('sectionHeaderClassesForGroupColor', () => {
  it('returns tab + shelf classes matching the group color', () => {
    const blue = sectionHeaderClassesForGroupColor('blue');
    expect(blue.tab).toContain('bg-blue-100');
    expect(blue.tab).toContain('text-blue-900');
    expect(blue.tab).toContain('border-blue-300');
    expect(blue.shelf).toContain('border-blue-300');
  });

  it('uses a yellow-tinted tab with a saturated shelf for the yellow Chrome group', () => {
    const yellow = sectionHeaderClassesForGroupColor('yellow');
    expect(yellow.tab).toContain('bg-yellow-100');
    expect(yellow.tab).toContain('text-yellow-900');
    expect(yellow.shelf).toContain('border-yellow-400');
  });

  it('falls back to slate-tinted tab + shelf for null and unknown colors', () => {
    const slate = sectionHeaderClassesForGroupColor(null);
    expect(slate.tab).toContain('bg-slate-50');
    expect(slate.tab).toContain('text-slate-700');
    expect(slate.shelf).toContain('border-slate-200');

    const unknown = sectionHeaderClassesForGroupColor('mauve');
    expect(unknown.tab).toContain('bg-slate-50');
  });
});
