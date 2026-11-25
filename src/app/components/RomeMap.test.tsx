// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("maplibre-gl", () => ({ setWorkerUrl: () => {} }));
vi.mock("next/server", () => ({ connection: async () => {} }));
// The real merge runs over a faked online read and the mocked local catalog.
vi.mock("@/server/visitorContent", async () => {
  const { createVisitorContent } = await import("@/server/visitorContent/createVisitorContent");
  const { publicCatalog } = await import("@/server/publicCatalog");
  const online = {
    getCity: async () => ({
      city: "rome",
      categoryDefinitions: [],
      peopleCount: 2,
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

import { RomeMap } from "./RomeMap";

describe("Rome map arrival", () => {
  it("opens at the Campidoglio without selecting the first published POI", async () => {
    const map = await RomeMap();
    expect(map.props.children[1].props).toMatchObject({
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
    expect(map.props.children[1].props).toMatchObject(
      query.initialPoiSlug === "missing-place"
        ? { coordinates: [12.4823, 41.8933], initialSelectedPoiId: null }
        : { coordinates: [12.6, 41.8], initialSelectedPoiId: "peripheral-place" },
    );
  });

  it("shows the online totals even when the map includes a local place", async () => {
    const map = await RomeMap();
    render(map.props.children[0]);

    expect(screen.getByText("place").parentElement?.textContent?.trim()).toBe("1 place");
    expect(screen.getByText("people").parentElement?.textContent?.trim()).toBe("2 people");
    expect(map.props.children[1].props.pois).toHaveLength(2);
    // Previews load after the map, so they stay out of the page's HTML.
    for (const poi of map.props.children[1].props.pois) {
      expect(poi).not.toHaveProperty("previewDescription");
      expect(poi).not.toHaveProperty("mainImageUrl");
    }
  });
});
