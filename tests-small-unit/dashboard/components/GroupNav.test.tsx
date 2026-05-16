import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

const noop = () => undefined;

const renderNav = (
  overrides: Partial<{
    groups: ReadonlyArray<NavGroupFixture>;
    activeKey: string | null;
    allCollapsed: boolean;
    onSelect: (groupKey: string) => void;
    onToggleAllCollapsed: () => void;
  }> = {},
) => {
  const props = {
    groups: sampleGroups,
    activeKey: null as string | null,
    allCollapsed: false,
    onSelect: noop,
    onToggleAllCollapsed: noop,
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

  it('renders "Collapse all" when at least one section is expanded', () => {
    renderNav({ allCollapsed: false });
    expect(screen.getByRole('button', { name: /collapse all/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /expand all/i })).not.toBeInTheDocument();
  });

  it('renders "Expand all" when every section is collapsed', () => {
    renderNav({ allCollapsed: true });
    expect(screen.getByRole('button', { name: /expand all/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /collapse all/i })).not.toBeInTheDocument();
  });

  it('calls onToggleAllCollapsed when the master toggle is clicked', async () => {
    const onToggleAllCollapsed = vi.fn();
    const user = userEvent.setup();
    renderNav({ onToggleAllCollapsed });

    await user.click(screen.getByRole('button', { name: /collapse all/i }));

    expect(onToggleAllCollapsed).toHaveBeenCalledTimes(1);
  });
});
