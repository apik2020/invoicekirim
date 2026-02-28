import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ResourceHints } from "@/components/ResourceHints";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: 'swap', // Better performance
});

export const metadata: Metadata = {
  title: "InvoiceKirim - Platform Invoice Profesional untuk Freelancer Indonesia",
  description: "Buat invoice profesional dalam hitungan detik. Kelola invoice bisnis Anda dengan mudah, kirim via WhatsApp, dan lacak pembayaran.",
  keywords: "invoice, faktur, invoice template, buat invoice, invoice gratis, invoice indonesia",
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
        className={`${ubuntu.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
