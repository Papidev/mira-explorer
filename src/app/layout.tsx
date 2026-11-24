import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { WebAnalytics } from "./components/WebAnalytics";
import { siteOpenGraph, siteUrl } from "./site";
import { themeInitScript } from "./theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const description = "Explore cities through history, art, and culture.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Mira", template: "%s · Mira" },
  description,
  // No canonical or og:url here: child pages would inherit the homepage's.
  openGraph: { ...siteOpenGraph, title: "Mira", description },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.variable} ${fraunces.variable} bg-canvas text-ink font-sans antialiased`}
      >
        {children}
        <WebAnalytics />
      </body>
    </html>
  );
}
