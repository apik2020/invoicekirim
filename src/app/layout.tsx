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
      </head>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
