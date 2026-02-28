/**
 * Resource hints for improved loading performance
 * Add this to your layout to enable DNS prefetching and preconnections
 */

export function ResourceHints() {
  return (
    <>
      {/* DNS prefetch for external domains */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//api.stripe.com" />
      <link rel="dns-prefetch" href="//js.stripe.com" />

      {/* Preconnect for critical resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* Note: Don't prefetch authenticated APIs - causes 401 errors on login pages */}
    </>
  )
}
