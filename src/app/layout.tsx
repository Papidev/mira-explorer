import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { WebAnalytics } from "./components/WebAnalytics";
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

export const metadata: Metadata = {
  title: "Mira",
  description: "Explore cities through history, art, and culture.",
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
