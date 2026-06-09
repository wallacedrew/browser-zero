import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from '../../../src/dashboard/components/ViewToggle';

describe('ViewToggle', () => {
  it('renders a Flat radio option that calls onChange with "flat"', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<ViewToggle value="window" onChange={handleChange} />);

    const flatRadio = screen.getByRole('radio', { name: /^flat$/i });
    expect(flatRadio).toBeInTheDocument();
    expect(flatRadio).toHaveAttribute('aria-checked', 'false');

    await user.click(flatRadio);
    expect(handleChange).toHaveBeenCalledWith('flat');
  });
});
