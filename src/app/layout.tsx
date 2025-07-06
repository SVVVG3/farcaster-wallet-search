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
  title: "Wallet Search",
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
    title: "Wallet Search",
    description: "Search Farcaster profiles by wallet addresses and usernames with Bankr integration",
    siteName: "Wallet Search",
    images: [
      {
        url: "/WalletSearchEmbed.png",
        width: 1200,
        height: 630,
        alt: "Wallet Search",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wallet Search",
    description: "Search Farcaster profiles by wallet addresses and usernames with Bankr integration",
    images: ["/WalletSearchEmbed.png"],
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
        <meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://walletsearch.vercel.app/WalletSearchEmbed.png","button":{"title":"🔍 Search Wallets","action":{"type":"launch_miniapp","name":"Wallet Search","url":"https://walletsearch.vercel.app","splashImageUrl":"https://walletsearch.vercel.app/WalletSearchIcon.png","splashBackgroundColor":"#000000"}}}' />
        <meta name="fc:frame" content='{"version":"1","imageUrl":"https://walletsearch.vercel.app/WalletSearchEmbed.png","button":{"title":"🔍 Search Wallets","action":{"type":"launch_frame","name":"Wallet Search","url":"https://walletsearch.vercel.app","splashImageUrl":"https://walletsearch.vercel.app/WalletSearchIcon.png","splashBackgroundColor":"#000000"}}}' />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
