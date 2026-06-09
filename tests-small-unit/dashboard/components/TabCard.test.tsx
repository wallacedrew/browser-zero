import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabCard } from '../../../src/dashboard/components/TabCard';
import type { Tab } from '../../../src/shared/lib/types';
import { Timestamp } from '../../../src/shared/lib/Timestamp';

const baseTab: Tab = {
  id: 7,
  windowId: 100,
  title: 'pull/123',
  url: 'https://github.com/me/repo/pull/123',
  domain: 'github.com',
  favIconUrl: null,
  lastAccessed: Timestamp.fromMillis(0),
  group: null,
};

const noop = () => {
  /* noop */
};

const renderCard = (overrides: { onFocus?: (id: number, win: number) => void } = {}) => {
  return render(
    <ul>
      <TabCard
        tab={baseTab}
        lastAccessedLabel="just now"
        selection={{ isSelected: false, toggle: noop }}
        armedForDelete={false}
        isDraggable={false}
        onFocus={overrides.onFocus ?? noop}
        armedDelete={{ arm: noop, disarm: vi.fn(), confirm: noop }}
      />
    </ul>,
  );
};

describe('TabCard', () => {
  it('renders title, domain, and last-accessed label', () => {
    renderCard();

    expect(screen.getByText('pull/123')).toBeInTheDocument();
    expect(screen.getByText('github.com')).toBeInTheDocument();
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('calls onFocus when the card body is clicked', async () => {
    const onFocus = vi.fn();
    const user = userEvent.setup();
    renderCard({ onFocus });

    await user.click(screen.getByRole('listitem'));

    expect(onFocus).toHaveBeenCalledWith(7, 100);
  });

  it('does not call onFocus when the select checkbox is clicked', async () => {
    const onFocus = vi.fn();
    const user = userEvent.setup();
    renderCard({ onFocus });

    await user.click(screen.getByRole('checkbox', { name: 'Select pull/123' }));

    expect(onFocus).not.toHaveBeenCalled();
  });

  it('does not call onFocus when the close × is clicked', async () => {
    const onFocus = vi.fn();
    const user = userEvent.setup();
    renderCard({ onFocus });

    await user.click(screen.getByRole('button', { name: 'Close pull/123' }));

    expect(onFocus).not.toHaveBeenCalled();
  });
});
