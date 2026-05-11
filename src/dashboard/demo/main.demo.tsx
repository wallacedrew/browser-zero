import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../components/App';
import { DemoTabsPort } from './DemoTabsPort';
import { demoTabs, demoNow } from './fixture';
import '../index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element');

createRoot(rootElement).render(
  <StrictMode>
    <App tabsPort={new DemoTabsPort(demoTabs)} now={demoNow} />
  </StrictMode>,
);

// Honour ?view=tabgroup / ?view=domain by clicking the matching radio once
// App has rendered. The headless-Chrome screenshot script uses this to
// capture the three group-by views from the same demo entry without
// adding initial-state props to App.
const VIEW_LABELS: Record<string, RegExp> = {
  window: /^By window$/i,
  tabgroup: /^By tab group$/i,
  domain: /^By domain in url$/i,
};
const requestedView = new URLSearchParams(window.location.search).get('view');
if (requestedView && requestedView in VIEW_LABELS) {
  const labelPattern = VIEW_LABELS[requestedView];
  const tryClick = (): boolean => {
    const radios = Array.from(document.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
    const match = radios.find(
      (radio) => labelPattern && labelPattern.test(radio.textContent ?? ''),
    );
    if (match && match.getAttribute('aria-checked') !== 'true') {
      match.click();
      return true;
    }
    return Boolean(match);
  };
  requestAnimationFrame(() => {
    if (!tryClick()) requestAnimationFrame(tryClick);
  });
}
