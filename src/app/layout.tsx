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
                // Track chunk loading errors
                let chunkErrors = 0;
                let lastChunkError = 0;
                const COOLDOWN_MS = 5000; // Only count errors within 5 seconds

                function handleChunkError(src) {
                  const now = Date.now();

                  // Reset counter if last error was more than 5 seconds ago
                  if (now - lastChunkError > COOLDOWN_MS) {
                    chunkErrors = 0;
                  }

                  lastChunkError = now;
                  chunkErrors++;

                  console.warn('[ChunkError] Failed to load:', src, 'Errors:', chunkErrors);

                  // If 2+ errors in quick succession, force refresh
                  if (chunkErrors >= 2) {
                    console.warn('[ChunkError] Multiple chunk errors detected, forcing refresh...');
                    forceRefresh();
                  }
                }

                function forceRefresh() {
                  // Clear all caches
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      names.forEach(function(name) {
                        caches.delete(name);
                      });
                    }).then(function() {
                      // Add timestamp to force bypass cache
                      window.location.href = window.location.pathname + '?refresh=' + Date.now();
                    });
                  } else {
                    window.location.reload(true);
                  }
                }

                // Handle script/link load errors
                window.addEventListener('error', function(e) {
                  if (e.target) {
                    var tag = e.target.tagName;
                    if (tag === 'SCRIPT' || tag === 'LINK') {
                      var src = e.target.src || e.target.href || '';
                      if (src.indexOf('/_next/static/') !== -1) {
                        handleChunkError(src);
                      }
                    }
                  }
                }, true);

                // Handle dynamic import errors
                window.addEventListener('unhandledrejection', function(e) {
                  var msg = e.reason && (e.reason.message || String(e.reason));
                  if (msg && (msg.indexOf('Loading chunk') !== -1 || msg.indexOf('Loading CSS chunk') !== -1)) {
                    console.warn('[ChunkError] Dynamic import failed:', msg);
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
