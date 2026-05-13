import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupNav } from '../../../src/dashboard/components/GroupNav';

const sampleGroups = [
  { key: 'window-100', label: 'Window 1', count: 15, color: null },
  { key: 'window-200', label: 'Window 2', count: 15, color: null },
  { key: 'window-300', label: 'Window 3', count: 4, color: null },
];

describe('GroupNav', () => {
  it('renders one link per group with label and count', () => {
    render(<GroupNav groups={sampleGroups} activeKey={null} onSelect={() => undefined} />);

    expect(screen.getByRole('link', { name: 'Window 1 (15)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Window 2 (15)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Window 3 (4)' })).toBeInTheDocument();
  });

  it('calls onSelect with the clicked group key', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<GroupNav groups={sampleGroups} activeKey={null} onSelect={onSelect} />);

    await user.click(screen.getByRole('link', { name: 'Window 2 (15)' }));

    expect(onSelect).toHaveBeenCalledWith('window-200');
  });

  it('renders nothing when there are fewer than two groups (nothing to jump between)', () => {
    const { container: singleGroupContainer } = render(
      <GroupNav
        groups={[{ key: 'window-100', label: 'Window 1', count: 5, color: null }]}
        activeKey={null}
        onSelect={() => undefined}
      />,
    );
    expect(singleGroupContainer).toBeEmptyDOMElement();

    const { container: zeroGroupContainer } = render(
      <GroupNav groups={[]} activeKey={null} onSelect={() => undefined} />,
    );
    expect(zeroGroupContainer).toBeEmptyDOMElement();
  });

  it('exposes itself as a navigation landmark named "Jump to group"', () => {
    render(<GroupNav groups={sampleGroups} activeKey={null} onSelect={() => undefined} />);
    expect(screen.getByRole('navigation', { name: /jump to group/i })).toBeInTheDocument();
  });

  it('marks the active chip with aria-current="true" and leaves the others without it', () => {
    render(<GroupNav groups={sampleGroups} activeKey="window-200" onSelect={() => undefined} />);

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
    render(<GroupNav groups={coloredGroups} activeKey="tabgroup-g-1" onSelect={() => undefined} />);

    // Active blue group → solid blue fill, white text
    const activeChip = screen.getByRole('link', { name: 'Q3 planning (5)' });
    expect(activeChip.className).toContain('bg-blue-600');
    expect(activeChip.className).toContain('text-white');

    // Inactive orange group → light orange tint, orange text
    const orangeChip = screen.getByRole('link', { name: 'Errands (3)' });
    expect(orangeChip.className).toContain('bg-orange-50');
    expect(orangeChip.className).toContain('text-orange-800');

    // Inactive Ungrouped (no color) → slate default
    const ungroupedChip = screen.getByRole('link', { name: 'Ungrouped (8)' });
    expect(ungroupedChip.className).toContain('bg-white');
    expect(ungroupedChip.className).toContain('text-slate-700');
  });
});
