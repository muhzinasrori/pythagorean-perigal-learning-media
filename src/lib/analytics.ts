/**
 * Tiny GA4 event helper — safe no-op on the server and when analytics
 * is not installed (no measurement ID configured).
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void })
    .gtag;
  gtag?.('event', name, params);
}
