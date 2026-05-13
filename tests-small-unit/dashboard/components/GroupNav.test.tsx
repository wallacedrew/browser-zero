import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupNav } from '../../../src/dashboard/components/GroupNav';

const sampleGroups = [
  { key: 'window-100', label: 'Window 1', count: 15 },
  { key: 'window-200', label: 'Window 2', count: 15 },
  { key: 'window-300', label: 'Window 3', count: 4 },
];

describe('GroupNav', () => {
  it('renders one link per group with label and count', () => {
    render(<GroupNav groups={sampleGroups} onSelect={() => undefined} />);

    expect(screen.getByRole('link', { name: 'Window 1 (15)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Window 2 (15)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Window 3 (4)' })).toBeInTheDocument();
  });

  it('calls onSelect with the clicked group key', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<GroupNav groups={sampleGroups} onSelect={onSelect} />);

    await user.click(screen.getByRole('link', { name: 'Window 2 (15)' }));

    expect(onSelect).toHaveBeenCalledWith('window-200');
  });

  it('renders nothing when there are fewer than two groups (nothing to jump between)', () => {
    const { container: singleGroupContainer } = render(
      <GroupNav
        groups={[{ key: 'window-100', label: 'Window 1', count: 5 }]}
        onSelect={() => undefined}
      />,
    );
    expect(singleGroupContainer).toBeEmptyDOMElement();

    const { container: zeroGroupContainer } = render(
      <GroupNav groups={[]} onSelect={() => undefined} />,
    );
    expect(zeroGroupContainer).toBeEmptyDOMElement();
  });

  it('exposes itself as a navigation landmark named "Jump to group"', () => {
    render(<GroupNav groups={sampleGroups} onSelect={() => undefined} />);
    expect(screen.getByRole('navigation', { name: /jump to group/i })).toBeInTheDocument();
  });
});
