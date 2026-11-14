import { useEffect, useRef } from 'react';

/**
 * Calls `fn` every `intervalMs` while the tab is visible. Nothing runs in a background tab; when the tab
 * becomes visible again `fn` runs once straight away so the screen is current.
 */
export function usePolling(fn: () => void, intervalMs: number, enabled = true) {
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => {
    if (!enabled) return;
    const tick = () => { if (document.visibilityState === 'visible') latest.current(); };
    const timer = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [intervalMs, enabled]);
}
