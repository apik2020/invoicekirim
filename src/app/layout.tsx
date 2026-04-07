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
        {/* Chunk error handler - auto refresh on stale chunk references */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                let chunkErrorCount = 0;
                const MAX_CHUNK_ERRORS = 3;

                window.addEventListener('error', function(e) {
                  if (e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
                    const src = e.target.src || e.target.href || '';
                    if (src.includes('/_next/static/chunks/')) {
                      chunkErrorCount++;
                      console.warn('[ChunkError] Failed to load chunk:', src);

                      if (chunkErrorCount >= MAX_CHUNK_ERRORS) {
                        console.warn('[ChunkError] Multiple chunk errors detected, forcing hard refresh...');
                        // Clear cache and force reload
                        if ('caches' in window) {
                          caches.keys().then(function(names) {
                            names.forEach(function(name) {
                              caches.delete(name);
                            });
                          });
                        }
                        // Force hard refresh
                        window.location.reload(true);
                      }
                    }
                  }
                }, true);

                // Also handle dynamic import errors
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.message && e.reason.message.includes('Loading chunk')) {
                    console.warn('[ChunkError] Dynamic import failed:', e.reason.message);
                    window.location.reload(true);
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
