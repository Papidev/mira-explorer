import { describe, expect, it } from "vitest";
import type { PublishedCityPreview } from "@mira/shared";
import type { Poi } from "@/types/Poi";
import { createVisitorContent } from "./createVisitorContent";

const online: PublishedCityPreview = {
  city: "rome",
  categoryDefinitions: [{ id: "architecture", name: "Online architecture" }],
  peopleCount: 3,
  pois: [
    {
      id: "8aa5be62-82a6-4776-a2cd-bc5b1be60996",
      slug: "colosseum",
      wikidataId: "Q10285",
      city: "rome",
      name: "Online Colosseum",
      categoryIds: ["architecture"],
      coordinates: { lat: 41.89, lng: 12.49 },
      introduction: "An online introduction.",
      mainImage: null,
    },
  ],
};
const colosseum: Poi = {
  id: "colosseum-local",
  wikidataId: "Q10285",
  city: "rome",
  name: "Local Colosseum",
  coordinates: { lat: 41.89, lng: 12.49 },
  mainImageUrl: "https://example.com/local.jpg",
  funFacts: [],
};
const castle: Poi = {
  ...colosseum,
  id: "castle",
  wikidataId: "Q193887",
  name: "Castel Sant’Angelo",
  categories: ["castle"],
};
const local = {
  getPois: () => [colosseum, castle],
  getCategoryDefinitions: () => [
    { id: "architecture", name: "Local architecture" },
    { id: "castle", name: "Castle", parent: "architecture" },
  ],
};

const mapOf = async (city: PublishedCityPreview, catalog = local) => {
  const map = await createVisitorContent({
    online: { getCity: async () => city },
    local: catalog,
  }).map("rome");
  if (map.status !== "found") throw new Error("Expected a map.");
  return map;
};

describe("Visitor Content map", () => {
  it("keeps local-only POIs, selects the complete online version and resolves legacy links", async () => {
    const map = await mapOf(online);
    expect(map.pois.map(({ id }) => id)).toEqual([online.pois[0].id, "castle"]);
    expect(map.pois[0]).toMatchObject({
      name: "Online Colosseum",
      categories: ["architecture"],
      previewDescription: "An online introduction.",
    });
    expect(map.pois[0].mainImageUrl).toBeUndefined();
    expect(map.aliases["colosseum-local"]).toBe(online.pois[0].id);
    expect(map.categoryDefinitions).toEqual([
      { id: "architecture", name: "Online architecture" },
      { id: "castle", name: "Castle", parent: "architecture" },
    ]);
  });

  it("does not resurrect a confirmed online removal from local content", async () => {
    const map = await mapOf({
      ...online,
      pois: [],
      removedPois: [{ id: online.pois[0].id, wikidataId: "Q10285" }],
    });
    expect(map.pois.map(({ id }) => id)).toEqual(["castle"]);
  });

  it("deduplicates an identical UUID even when there is no Wikidata identity", async () => {
    const map = await mapOf(online, {
      ...local,
      getPois: () => [{ ...colosseum, id: online.pois[0].id, wikidataId: undefined }],
    });
    expect(map.pois).toHaveLength(1);
  });

  it("is unavailable when the online read fails, never showing local content instead", async () => {
    const visitorContent = createVisitorContent({
      online: {
        getCity: async () => {
          throw new Error("Database unavailable");
        },
      },
      local,
    });
    expect(await visitorContent.map("rome")).toEqual({ status: "unavailable" });
  });

  it("counts only online publications as published", async () => {
    const map = await mapOf(online);
    expect(map.pois).toHaveLength(2);
    expect(map.publishedCounts).toEqual({ places: 1, people: 3 });
  });

  it.each([
    [{ poi: "colosseum" }, online.pois[0].id],
    [{ poi: "colosseum-local" }, online.pois[0].id],
    [{ poiId: "colosseum-local" }, online.pois[0].id],
    [{ poiId: online.pois[0].id }, online.pois[0].id],
    [{ poi: "castle" }, "castle"],
    [{ poi: "missing" }, undefined],
    [{}, undefined],
  ])("finds the POI a link points to: %o", async (link, id) => {
    expect((await mapOf(online)).findLinkedPoi(link)?.id).toBe(id);
  });
});
