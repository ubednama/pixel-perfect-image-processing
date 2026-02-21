import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";
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
    "client-side image editing",
    "no upload photo editor",
    "no signup",
    "privacy focused image editor",
    "photo filters",
    "image resizer",
    "image converter",
    "private photo editor",
    "free online photo editor",
  ],
  authors: [{ name: "Pixel Perfect" }],
  creator: "Pixel Perfect",
  publisher: "Pixel Perfect",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://pixel-perfect-editor.vercel.app"
  ),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Pixel Perfect - Free, Fast & Private Online Image Editor",
    description:
      "The quickest and most private way to edit your photos online. Fast, secure, and completely free in your browser.",
    url: "/",
    siteName: "Pixel Perfect",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pixel Perfect Online Image Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel Perfect - Free, Fast & Private Online Image Editor",
    description:
      "Instantly edit your images online for free. Rotate, crop, resize, apply filters, and more, directly in your browser without uploads.",
    images: ["/og-image.png"],
    creator: "@pixelperfect",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon.svg", sizes: "180x180", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
  generator: "Next.js",
  applicationName: "Pixel Perfect",
  appleWebApp: {
    capable: true,
    title: "Pixel Perfect",
    statusBarStyle: "default",
  },
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
