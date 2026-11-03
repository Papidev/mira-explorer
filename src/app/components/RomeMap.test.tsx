// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

vi.mock("maplibre-gl", () => ({ default: {} }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/server/visitorContent", () => ({
  visitorContent: {
    getCity: async () => ({
      city: "rome",
      categoryDefinitions: [],
      pois: [
        {
          id: "peripheral-place",
          slug: "peripheral-place",
          city: "rome",
          name: "Peripheral place",
          coordinates: { lng: 12.6, lat: 41.8 },
          categoryIds: [],
          introduction: "A published place outside the historic centre.",
          mainImage: null,
        },
      ],
    }),
  },
}));
vi.mock("@/server/publicCatalog", () => ({
  publicCatalog: { getPois: () => [], getCategoryDefinitions: () => [] },
}));

import { RomeMap } from "./RomeMap";

describe("Rome map arrival", () => {
  it("opens at the Campidoglio without selecting the first published POI", async () => {
    const map = await RomeMap();
    expect(map.props).toMatchObject({
      coordinates: [12.4823, 41.8933],
      initialZoom: 15,
      initialSelectedPoiId: null,
    });
  });

  it.each([
    { initialPoiSlug: "peripheral-place" },
    { initialSelectedPoiId: "peripheral-place" },
    { initialPoiSlug: "missing-place" },
  ])("resolves an explicit POI link or falls back to the city centre: %o", async (query) => {
    const map = await RomeMap(query);
    expect(map.props).toMatchObject(
      query.initialPoiSlug === "missing-place"
        ? { coordinates: [12.4823, 41.8933], initialSelectedPoiId: null }
        : { coordinates: [12.6, 41.8], initialSelectedPoiId: "peripheral-place" },
    );
  });
});
