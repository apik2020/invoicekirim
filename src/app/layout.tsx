import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ResourceHints } from "@/components/ResourceHints";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "NotaBener - Platform Invoice Gratis untuk UMKM & Freelancer Indonesia",
  description: "Bikin invoice tanpa ribet, langsung terkirim! Platform invoice gratis untuk UMKM, pebisnis pemula, dan freelancer Indonesia. Kirim via WhatsApp, lacak pembayaran dengan mudah.",
  keywords: "invoice, faktur, nota, invoice gratis, invoice UMKM, invoice freelancer, buat invoice, invoice indonesia, nota digital",
  robots: {
    index: true,
    follow: true,
  },
};

// Separate viewport export for Next.js 15+
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <ResourceHints />
        {/* Prevent caching of this page */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />

        {/* Chunk error handler - auto refresh on stale chunk references */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Prevent infinite refresh loop
                var MAX_REFRESH_ATTEMPTS = 3;
                var REFRESH_KEY = '__nb_refresh_count';
                var REFRESH_TIME_KEY = '__nb_refresh_time';
                var REFRESH_WINDOW_MS = 60000; // 1 minute window

                function getRefreshCount() {
                  try {
                    var lastRefresh = parseInt(sessionStorage.getItem(REFRESH_TIME_KEY) || '0');
                    if (Date.now() - lastRefresh > REFRESH_WINDOW_MS) {
                      sessionStorage.removeItem(REFRESH_KEY);
                      sessionStorage.removeItem(REFRESH_TIME_KEY);
                      return 0;
                    }
                    return parseInt(sessionStorage.getItem(REFRESH_KEY) || '0');
                  } catch (e) {
                    return 0;
                  }
                }

                function incrementRefreshCount() {
                  try {
                    sessionStorage.setItem(REFRESH_KEY, String(getRefreshCount() + 1));
                    sessionStorage.setItem(REFRESH_TIME_KEY, String(Date.now()));
                  } catch (e) {}
                }

                function forceRefresh() {
                  var count = getRefreshCount();
                  console.warn('[ChunkError] Refresh attempt', count + 1, 'of', MAX_REFRESH_ATTEMPTS);

                  if (count >= MAX_REFRESH_ATTEMPTS) {
                    console.error('[ChunkError] Max refresh attempts reached. Please clear browser cache manually.');
                    alert('Terjadi kesalahan cache. Silakan clear browser cache (Ctrl+Shift+Delete) atau buka di incognito mode.');
                    return;
                  }

                  incrementRefreshCount();

                  // Clear all caches first
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      return Promise.all(names.map(function(name) {
                        return caches.delete(name);
                      }));
                    }).then(function() {
                      // Clear sessionStorage for refresh count after cache clear
                      setTimeout(function() {
                        // Force hard refresh with cache-busting param
                        var url = window.location.pathname + '?_nc=' + Date.now();
                        window.location.replace(url);
                      }, 100);
                    }).catch(function() {
                      window.location.replace(window.location.pathname + '?_nc=' + Date.now());
                    });
                  } else {
                    window.location.replace(window.location.pathname + '?_nc=' + Date.now());
                  }
                }

                // Handle script/link load errors - IMMEDIATELY refresh
                window.addEventListener('error', function(e) {
                  if (e.target) {
                    var tag = e.target.tagName;
                    if (tag === 'SCRIPT' || tag === 'LINK') {
                      var src = e.target.src || e.target.href || '';
                      if (src.indexOf('/_next/static/chunks/') !== -1) {
                        console.warn('[ChunkError] Script chunk failed:', src);
                        e.preventDefault();
                        forceRefresh();
                      }
                    }
                  }
                }, true);

                // Handle dynamic import errors - IMMEDIATELY refresh
                window.addEventListener('unhandledrejection', function(e) {
                  var msg = e.reason && (e.reason.message || String(e.reason));
                  if (msg && (msg.indexOf('Loading chunk') !== -1 || msg.indexOf('ChunkLoadError') !== -1)) {
                    console.warn('[ChunkError] Dynamic import failed:', msg);
                    e.preventDefault();
                    forceRefresh();
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
