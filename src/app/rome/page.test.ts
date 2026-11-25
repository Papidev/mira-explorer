import { describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ connection: async () => {} }));
// The real merge runs over a faked online read and the mocked local catalog.
vi.mock("@/server/visitorContent", async () => {
  const { createVisitorContent } = await import("@/server/visitorContent/createVisitorContent");
  const { publicCatalog } = await import("@/server/publicCatalog");
  const online = {
    getCity: async () => ({
      city: "rome",
      categoryDefinitions: [],
      pois: [
        {
          id: "0b6f3c1e-8c1a-4a55-9a51-1c2f8f7c9d10",
          slug: "ara-pacis",
          city: "rome",
          name: "Ara Pacis",
          coordinates: { lng: 12.475, lat: 41.906 },
          categoryIds: [],
          introduction: `The **Ara Pacis** is an altar to Peace. ${"Its reliefs show a procession. ".repeat(10)}`,
          mainImage: {
            id: "File:Ara Pacis.jpg",
            commonsPageUrl: "https://commons.wikimedia.org/wiki/File:Ara_Pacis.jpg",
            thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/ara.jpg",
            originalImageUrl: "https://upload.wikimedia.org/wikipedia/commons/ara.jpg",
            license: "CC BY-SA 4.0",
            attribution: "Wikimedia Commons",
          },
        },
      ],
    }),
  };
  return {
    onlineVisitorReads: online,
    visitorContent: createVisitorContent({ online, local: publicCatalog }),
  };
});
vi.mock("@/server/publicCatalog", () => ({
  publicCatalog: {
    getPois: () => [
      {
        id: "local-place",
        city: "rome",
        name: "Local place",
        coordinates: { lng: 12.5, lat: 41.9 },
        funFacts: [],
      },
    ],
    getCategoryDefinitions: () => [],
  },
}));

import sitemap from "@/app/sitemap";
import { generateMetadata } from "./page";

const metadataFor = (query: Record<string, string>) =>
  generateMetadata({ searchParams: Promise.resolve(query) });

describe("Rome link previews", () => {
  it("describes a shared place with its name, Story excerpt, image and canonical link", async () => {
    const metadata = await metadataFor({ poi: "ara-pacis" });
    expect(metadata).toMatchObject({
      title: "Ara Pacis",
      alternates: { canonical: "/rome?poi=ara-pacis" },
      openGraph: {
        title: "Ara Pacis",
        url: "/rome?poi=ara-pacis",
        images: [
          { url: "https://upload.wikimedia.org/wikipedia/commons/ara.jpg", alt: "Ara Pacis" },
        ],
      },
    });
    expect(metadata.description).toMatch(/^The Ara Pacis is an altar to Peace\. .*…$/);
    expect(metadata.description!.length).toBeLessThanOrEqual(160);
  });

  it("points legacy ID links to the slug link", async () => {
    const metadata = await metadataFor({ poiId: "0b6f3c1e-8c1a-4a55-9a51-1c2f8f7c9d10" });
    expect(metadata.alternates?.canonical).toBe("/rome?poi=ara-pacis");
  });

  it("falls back to the city preview for unknown places", async () => {
    const metadata = await metadataFor({ poi: "missing-place" });
    expect(metadata).toMatchObject({ title: "Rome", alternates: { canonical: "/rome" } });
  });
});

describe("sitemap", () => {
  it("lists the homepage, the map and every place on the map", async () => {
    expect((await sitemap()).map(({ url }) => url)).toEqual([
      "https://www.explorewithmira.app",
      "https://www.explorewithmira.app/rome",
      "https://www.explorewithmira.app/rome?poi=ara-pacis",
      "https://www.explorewithmira.app/rome?poi=local-place",
    ]);
  });
});
