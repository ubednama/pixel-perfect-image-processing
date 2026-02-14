import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pixel Perfect - Free, Fast & Private Online Image Editor",
  description:
    "Instantly edit, crop, resize, rotate, and enhance your images online for free. Our powerful browser-based photo editor requires no account and no uploads. Perfect for quick edits and resizing for any purpose.",
  keywords: [
    "image editor",
    "photo editor",
    "online image editor",
    "free photo editor",
    "crop image",
    "resize image",
    "rotate image",
    "browser image editor",
    "no signup",
    "photo filters",
    "image resizer",
    "private photo editor",
  ],
  metadataBase: new URL("https://your-domain.com"),
  alternates: {
    canonical: "https://your-domain.com",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Pixel Perfect - Free, Fast & Private Online Image Editor",
    description:
      "The quickest and most private way to edit your photos online. Fast, secure, and completely free.",
    url: "https://your-domain.com",
    type: "website",
    images: [
      {
        url: "https://your-domain.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pixel Perfect Online Image Editor",
      },
    ],
    siteName: "Pixel Perfect",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel Perfect - Free, Fast & Private Online Image Editor",
    description:
      "Instantly edit your images online for free. Rotate, crop, resize, apply filters, and more, all from your browser.",
    images: ["https://your-domain.com/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon.svg", sizes: "180x180", type: "image/svg+xml" }],
  },
  generator: "Next.js",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            {children}
            <Toaster />
          </Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
