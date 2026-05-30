import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TabRow } from '../../../src/dashboard/components/TabRow';
import type { Tab } from '../../../src/shared/lib/types';

const baseTab: Tab = {
  id: 1,
  windowId: 100,
  title: 'pull/123',
  url: 'https://github.com/me/repo/pull/123',
  domain: 'github.com',
  favIconUrl: null,
  lastAccessed: 0,
  group: null,
};

const noop = () => {
  /* noop */
};

const renderRow = (tab: Tab) => {
  return render(
    <table>
      <tbody>
        <tr>
          <td>
            <ul>
              <TabRow
                tab={tab}
                now={0}
                selection={{ isSelected: false, toggle: noop }}
                armedForDelete={false}
                isDraggable={false}
                onFocus={noop}
                armedDelete={{ arm: noop, disarm: vi.fn(), confirm: noop }}
              />
            </ul>
          </td>
        </tr>
      </tbody>
    </table>,
  );
};

describe('TabRow favicon', () => {
  it('renders an <img> with the tab favicon URL when favIconUrl is present', () => {
    renderRow({ ...baseTab, favIconUrl: 'https://github.com/favicon.ico' });

    const favicon = screen.getByTestId('tab-favicon');
    expect(favicon.tagName).toBe('IMG');
    expect(favicon).toHaveAttribute('src', 'https://github.com/favicon.ico');
  });

  it('renders a neutral placeholder (no <img>) when favIconUrl is null', () => {
    renderRow({ ...baseTab, favIconUrl: null });

    const placeholder = screen.getByTestId('favicon-placeholder');
    expect(placeholder.tagName).not.toBe('IMG');
    expect(screen.queryByTestId('tab-favicon')).not.toBeInTheDocument();
  });
});
