'use client';

import Script from 'next/script';

/**
 * Google Analytics 4.
 *
 * Renders ONLY when NEXT_PUBLIC_GA_MEASUREMENT_ID is set (in .env or in the
 * Vercel project settings), so local/dev builds stay analytics-free.
 * Measurement ID format: G-XXXXXXXXXX.
 */
export function GoogleAnalytics({ gaId }: { gaId?: string }) {
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
