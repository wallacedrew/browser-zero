import { useCallback, useEffect, useState } from 'react';

export interface ArmedDelete {
  readonly armedTabId: number | null;
  arm: (tabId: number) => void;
  disarm: () => void;
}

export function useArmedDelete(): ArmedDelete {
  const [armedTabId, setArmedTabId] = useState<number | null>(null);

  const arm = useCallback((tabId: number) => {
    setArmedTabId(tabId);
  }, []);

  const disarm = useCallback(() => {
    setArmedTabId(null);
  }, []);

  // When an × is armed for delete, any mousedown that lands outside the armed
  // button disarms it. Listening on mousedown (not click) so a click on the
  // armed button itself still gets to fire its handler with the armed state.
  useEffect(() => {
    if (armedTabId === null) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-armed-delete="true"]')) return;
      setArmedTabId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [armedTabId]);

  return { armedTabId, arm, disarm };
}
