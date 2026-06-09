import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayoutToggle } from '../../../src/dashboard/components/LayoutToggle';

describe('LayoutToggle', () => {
  it('renders List and Grid radio options reflecting the current value', () => {
    render(<LayoutToggle value="list" onChange={() => undefined} />);

    expect(screen.getByRole('radio', { name: /^list$/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /^grid$/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with "grid" when the Grid option is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<LayoutToggle value="list" onChange={handleChange} />);

    await user.click(screen.getByRole('radio', { name: /^grid$/i }));

    expect(handleChange).toHaveBeenCalledWith('grid');
  });
});
