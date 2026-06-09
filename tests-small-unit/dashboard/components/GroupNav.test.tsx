import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupNav } from '../../../src/dashboard/components/GroupNav';

interface NavGroupFixture {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  readonly color: string | null;
}

const sampleGroups: ReadonlyArray<NavGroupFixture> = [
  { key: 'window-100', label: 'Window 1', count: 15, color: null },
  { key: 'window-200', label: 'Window 2', count: 15, color: null },
  { key: 'window-300', label: 'Window 3', count: 4, color: null },
];

// 12 chips exceeds the in-source CHIP_COLLAPSE_THRESHOLD (8) so the toggle
// renders and the chip rail starts clipped to one row.
const manyGroups: ReadonlyArray<NavGroupFixture> = Array.from({ length: 12 }, (_, index) => ({
  key: `domain-${index}`,
  label: `domain-${index}.com`,
  count: index + 1,
  color: null,
}));

const noop = () => undefined;

const renderNav = (
  overrides: Partial<{
    groups: ReadonlyArray<NavGroupFixture>;
    activeKey: string | null;
    onSelect: (groupKey: string) => void;
  }> = {},
) => {
  const props = {
    groups: sampleGroups,
    activeKey: null as string | null,
    onSelect: noop,
    ...overrides,
  };
  return render(<GroupNav {...props} />);
};

describe('GroupNav', () => {
  it('renders one link per group with label and count', () => {
    renderNav();

    expect(screen.getByRole('link', { name: 'Window 1 (15)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Window 2 (15)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Window 3 (4)' })).toBeInTheDocument();
  });

  it('calls onSelect with the clicked group key', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderNav({ onSelect });

    await user.click(screen.getByRole('link', { name: 'Window 2 (15)' }));

    expect(onSelect).toHaveBeenCalledWith('window-200');
  });

  it('renders nothing when there are fewer than two groups (nothing to jump between)', () => {
    const { container: singleGroupContainer } = renderNav({
      groups: [{ key: 'window-100', label: 'Window 1', count: 5, color: null }],
    });
    expect(singleGroupContainer).toBeEmptyDOMElement();

    const { container: zeroGroupContainer } = renderNav({ groups: [] });
    expect(zeroGroupContainer).toBeEmptyDOMElement();
  });

  it('exposes itself as a navigation landmark named "Jump to group"', () => {
    renderNav();
    expect(screen.getByRole('navigation', { name: /jump to group/i })).toBeInTheDocument();
  });

  it('marks the active chip with aria-current="true" and leaves the others without it', () => {
    renderNav({ activeKey: 'window-200' });

    expect(screen.getByRole('link', { name: 'Window 2 (15)' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Window 1 (15)' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Window 3 (4)' })).not.toHaveAttribute('aria-current');
  });

  it('renders no collapse toggle when group count is at or below the threshold', () => {
    renderNav();
    expect(screen.queryByRole('button', { name: /show all/i })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /jump to group/i }).className).not.toContain(
      'max-h-[1.75rem]',
    );
  });

  it('renders a collapse toggle and clamps the chip rail to one row when over threshold', () => {
    renderNav({ groups: manyGroups });
    const toggle = screen.getByRole('button', { name: /show all \(12\)/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const nav = screen.getByRole('navigation', { name: /jump to group/i });
    expect(nav.className).toContain('max-h-[1.75rem]');
    expect(nav.className).toContain('overflow-hidden');
  });

  it('expands the chip rail when the toggle is clicked', async () => {
    const user = userEvent.setup();
    renderNav({ groups: manyGroups });

    await user.click(screen.getByRole('button', { name: /show all \(12\)/i }));

    const nav = screen.getByRole('navigation', { name: /jump to group/i });
    expect(nav.className).not.toContain('max-h-[1.75rem]');
    expect(screen.getByRole('button', { name: /show less/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('re-collapses the chip rail on a second click', async () => {
    const user = userEvent.setup();
    renderNav({ groups: manyGroups });

    await user.click(screen.getByRole('button', { name: /show all \(12\)/i }));
    await user.click(screen.getByRole('button', { name: /show less/i }));

    const nav = screen.getByRole('navigation', { name: /jump to group/i });
    expect(nav.className).toContain('max-h-[1.75rem]');
    expect(screen.getByRole('button', { name: /show all \(12\)/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('keeps every chip link in the DOM even while the rail is clipped', () => {
    renderNav({ groups: manyGroups });
    const nav = screen.getByRole('navigation', { name: /jump to group/i });
    expect(within(nav).getAllByRole('link')).toHaveLength(manyGroups.length);
  });

  it('applies the Chrome tab group color to each chip when provided', () => {
    const coloredGroups = [
      { key: 'tabgroup-g-1', label: 'Q3 planning', count: 5, color: 'blue' },
      { key: 'tabgroup-g-2', label: 'Errands', count: 3, color: 'orange' },
      { key: 'tabgroup-ungrouped', label: 'Ungrouped', count: 8, color: null },
    ];
    renderNav({ groups: coloredGroups, activeKey: 'tabgroup-g-1' });

    const activeChip = screen.getByRole('link', { name: 'Q3 planning (5)' });
    expect(activeChip.className).toContain('bg-blue-600');
    expect(activeChip.className).toContain('text-white');

    const orangeChip = screen.getByRole('link', { name: 'Errands (3)' });
    expect(orangeChip.className).toContain('bg-orange-50');
    expect(orangeChip.className).toContain('text-orange-800');

    const ungroupedChip = screen.getByRole('link', { name: 'Ungrouped (8)' });
    expect(ungroupedChip.className).toContain('bg-white');
    expect(ungroupedChip.className).toContain('text-slate-700');
  });
});
