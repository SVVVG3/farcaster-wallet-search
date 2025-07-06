import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farcaster Wallet Search",
  description: "Search Farcaster profiles by wallet addresses and usernames with Bankr integration",
  keywords: ["farcaster", "wallet", "search", "crypto", "ethereum", "solana", "bankr"],
  authors: [{ name: "SVVVG3", url: "https://github.com/SVVVG3" }],
  creator: "SVVVG3",
  publisher: "SVVVG3",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://walletsearch.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://walletsearch.vercel.app",
    title: "Farcaster Wallet Search",
    description: "Search Farcaster profiles by wallet addresses and usernames with Bankr integration",
    siteName: "Farcaster Wallet Search",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Farcaster Wallet Search",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Farcaster Wallet Search",
    description: "Search Farcaster profiles by wallet addresses and usernames with Bankr integration",
    images: ["/og-image.svg"],
    creator: "@_svvvg3",
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://auth.farcaster.xyz" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#4F46E5" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
