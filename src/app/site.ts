import type { Metadata } from "next";

// Canonical host for links, the sitemap and link previews, whichever deployment serves the page.
export const siteUrl = "https://www.explorewithmira.app";

export const siteOpenGraph = {
  type: "website",
  siteName: "Mira",
  locale: "en",
  images: [{ url: "/rome-map-showcase-v0-28-sant-andrea.webp", width: 3456, height: 1596 }],
} satisfies Metadata["openGraph"];

// Search results and link previews cut longer descriptions anyway.
export const toMetaDescription = (text: string, max = 160) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length)}…`;
};
