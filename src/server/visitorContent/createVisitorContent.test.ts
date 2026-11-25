import { describe, expect, it } from "vitest";
import type { PublishedCityPreview } from "@mira/shared";
import { exampleStoryWrite } from "@/server/content/__fixtures__/writes";
import { createPublicCatalog } from "@/server/publicCatalog";
import type { Poi } from "@/types/Poi";
import { createVisitorContent } from "./createVisitorContent";

type Dependencies = Parameters<typeof createVisitorContent>[0];

const emptyCity: PublishedCityPreview = { city: "rome", pois: [], categoryDefinitions: [] };
const noLocal = createPublicCatalog(() => ({
  version: 1,
  city: "rome",
  categoryDefinitions: [],
  pois: [],
  people: [],
}));
// Online reads default to an empty city with nothing published.
const contentOf = (
  online: Partial<Dependencies["online"]>,
  local: Dependencies["local"] = noLocal,
) =>
  createVisitorContent({
    online: {
      getCity: async () => emptyCity,
      getStory: async () => null,
      getPerson: async () => null,
      getPersonBySlug: async () => null,
      ...online,
    },
    local,
  });

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
};
const castle: Poi = {
  ...colosseum,
  id: "castle",
  wikidataId: "Q193887",
  name: "Castel Sant’Angelo",
  categories: ["castle"],
};
const local = {
  getCatalogCity: () => "rome",
  getStoryContent: () => undefined,
  getPerson: () => undefined,
  getPersonBySlug: () => undefined,
  getPois: () => [colosseum, castle],
  getCategoryDefinitions: () => [
    { id: "architecture", name: "Local architecture" },
    { id: "castle", name: "Castle", parent: "architecture" },
  ],
};

const mapOf = async (city: PublishedCityPreview, catalog = local) => {
  const map = await contentOf({ getCity: async () => city }, catalog).map("rome");
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
    const visitorContent = contentOf(
      {
        getCity: async () => {
          throw new Error("Database unavailable");
        },
      },
      local,
    );
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

describe("Visitor Content Stories and People", () => {
  const write = exampleStoryWrite();
  const visitorContent = contentOf({
    getStory: async (id) => (id === write.detail.id ? write.detail : null),
    getPerson: async (id) => (id === "vespasian" ? write.people[0].person : null),
  });

  it("returns online Markdown, image metadata and Source citations", async () => {
    expect(await visitorContent.story("rome", write.detail.id)).toMatchObject({
      status: "found",
      story: {
        storyContent: { introduction: "A Roman amphitheatre.", textFormat: "markdown" },
        detail: {
          publicationId: write.detail.publicationId,
          gallery: [],
          mainImageId: null,
          sources: write.detail.sources,
        },
      },
    });
  });

  it.each([false, true])(
    "orders People by birth year only, preserving same-year order and unknown dates first (local: %s)",
    async (isLocal) => {
      const dates = [
        { id: "modern", birthDate: { year: 1600, month: 2, day: 2, precision: "exact" as const } },
        { id: "unknown" },
        { id: "ancient", birthDate: { year: -100, precision: "approximate" as const } },
        {
          id: "earlier-day",
          birthDate: { year: 1600, month: 2, day: 1, precision: "exact" as const },
        },
        { id: "also-unknown" },
        {
          id: "earlier-month",
          birthDate: { year: 1600, month: 1, precision: "approximate" as const },
        },
        {
          id: "same-date",
          birthDate: { year: 1600, month: 2, day: 2, precision: "approximate" as const },
        },
      ];
      const detail = structuredClone(write.detail);
      detail.story.relatedPeople = dates.map(({ id }) => ({
        personId: id,
        name: id,
        sourceIds: ["wikipedia"],
      }));
      const original = structuredClone(detail);
      const datedLocal = createPublicCatalog(() => ({
        version: 1,
        city: "rome",
        categoryDefinitions: [],
        pois: [
          {
            poi: {
              id: "local",
              name: "Local",
              city: "rome",
              coordinates: detail.coordinates,
            },
            storyContent: {
              introduction: "Local",
              topics: { history: [], design: [], art: [] },
              relatedPeople: detail.story.relatedPeople,
            },
            mainImage: {
              thumbnailUrl: "",
              originalImageUrl: "",
              commonsPageUrl: "",
              license: "",
              attribution: "",
            },
          },
        ],
        people: dates.map(({ id, birthDate }) => ({
          id,
          name: id,
          description: ["Biography", "Context"],
          curiosities: [],
          birthDate,
        })),
      }));
      const result = await contentOf(
        {
          getStory: async () => detail,
          getPerson: async (id) => ({
            ...write.people[0].person,
            id,
            content: {
              ...write.people[0].person.content,
              birthDate: dates.find((person) => person.id === id)?.birthDate,
            },
          }),
        },
        isLocal ? datedLocal : noLocal,
      ).story("rome", isLocal ? "local" : detail.id);
      if (result.status !== "found") throw new Error("Expected a Story.");
      expect(result.story.storyContent.relatedPeople.map(({ personId }) => personId)).toEqual([
        "unknown",
        "also-unknown",
        "ancient",
        "modern",
        "earlier-day",
        "earlier-month",
        "same-date",
      ]);
      expect(detail).toEqual(original);
    },
  );

  it("does not fall back to a legacy slug, missing publication or another city's Story", async () => {
    for (const [city, id] of [
      ["rome", "colosseum"],
      ["rome", "00000000-0000-4000-8000-000000000001"],
      ["paris", write.detail.id],
    ])
      expect(await visitorContent.story(city, id)).toEqual({ status: "not-found" });
  });

  it("returns saved People and hides missing/unlinked People", async () => {
    expect(await visitorContent.person({ id: "vespasian" })).toMatchObject({
      status: "found",
      person: { id: "vespasian", textFormat: "markdown" },
      detail: { linkedPois: [{ id: write.detail.id }] },
    });
    expect(await visitorContent.person({ id: "legacy-only-person" })).toEqual({
      status: "not-found",
    });
  });

  it("is unavailable on storage failure, without connection details or stale content", async () => {
    const fail = async () => {
      throw new Error("database credential");
    };
    const unavailable = contentOf({ getStory: fail, getPerson: fail });
    expect(await unavailable.story("rome", write.detail.id)).toEqual({ status: "unavailable" });
    expect(await unavailable.person({ id: "vespasian" })).toEqual({ status: "unavailable" });
  });

  it("finds a Person slug only within the city and the parent Story's Related People", async () => {
    const person = { ...write.people[0].person, id: "internal-id", slug: "vespasian" };
    const detail = structuredClone(write.detail);
    detail.story.relatedPeople[0].personId = person.id;
    const bySlug = contentOf({
      getStory: async () => detail,
      getPerson: async () => person,
      getPersonBySlug: async (slug) => (slug === "vespasian" ? person : null),
    });
    expect(await bySlug.person({ slug: "vespasian" }, { city: "rome" })).toMatchObject({
      status: "found",
      person: { id: "internal-id", slug: "vespasian" },
    });
    expect(
      (await bySlug.person({ slug: "vespasian" }, { city: "rome", poiId: detail.id })).status,
    ).toBe("found");
    expect((await bySlug.person({ slug: "vespasian" }, { city: "paris" })).status).toBe(
      "not-found",
    );
    expect((await bySlug.person({ slug: "missing" }, { city: "rome" })).status).toBe("not-found");
    detail.story.relatedPeople = [];
    expect(
      (await bySlug.person({ slug: "vespasian" }, { city: "rome", poiId: detail.id })).status,
    ).toBe("not-found");
  });
});

describe("Visitor Content local-only POIs", () => {
  const write = exampleStoryWrite();
  const localStory = {
    introduction: "Local Story",
    topics: { history: [], design: [], art: [] },
    relatedPeople: [{ personId: "vespasian", name: "Local Vespasian" }],
  };
  const localPerson = {
    id: "vespasian",
    name: "Local Vespasian",
    description: ["Local biography.", "Local context."] as [string, string],
    curiosities: [],
  };
  const localCatalog = createPublicCatalog(() => ({
    version: 1,
    city: "rome",
    categoryDefinitions: [],
    pois: [
      {
        poi: {
          id: "colosseum",
          wikidataId: "Q10285",
          name: "Local Colosseum",
          city: "rome",
          coordinates: { lat: 41.89, lng: 12.49 },
          mainImageUrl: "https://example.com/image.jpg",
        },
        storyContent: localStory,
        mainImage: {
          thumbnailUrl: "https://example.com/image.jpg",
          originalImageUrl: "https://example.com/image.jpg",
          commonsPageUrl: "https://commons.wikimedia.org/wiki/File:Image.jpg",
          attribution: "Local photographer",
          license: "CC0",
        },
      },
    ],
    people: [localPerson],
  }));
  const onlinePoi = {
    id: write.detail.id,
    wikidataId: "Q10285",
    city: "rome",
    name: "Colosseum",
    coordinates: write.detail.coordinates,
    categoryIds: [],
    mainImage: null,
    introduction: "Online Story",
  };
  const removal = { ...emptyCity, removedPois: [{ id: write.detail.id, wikidataId: "Q10285" }] };

  it("serves the local Story, main image and People when the POI is not published online", async () => {
    const visitorContent = contentOf({}, localCatalog);
    expect(await visitorContent.story("rome", "colosseum")).toEqual({
      status: "found",
      story: {
        storyContent: {
          ...localStory,
          relatedPeople: [{ ...localStory.relatedPeople[0], slug: "vespasian" }],
        },
        detail: null,
        mainImageUrl: "https://example.com/image.jpg",
      },
    });
    expect(
      await visitorContent.person({ id: "vespasian" }, { city: "rome", poiId: "colosseum" }),
    ).toEqual({ status: "found", person: { ...localPerson, slug: "vespasian" }, detail: null });
    expect(
      await visitorContent.person({ id: "unrelated-person" }, { city: "rome", poiId: "colosseum" }),
    ).toEqual({ status: "not-found" });
  });

  it("opens a local-only Person slug directly only while its Story remains visible", async () => {
    let onlineCity = emptyCity;
    const visitorContent = contentOf({ getCity: async () => onlineCity }, localCatalog);
    expect((await visitorContent.person({ slug: "vespasian" }, { city: "rome" })).status).toBe(
      "found",
    );
    // Without a city, the local catalog's own city applies; another city has no local People.
    expect((await visitorContent.person({ slug: "vespasian" })).status).toBe("found");
    expect((await visitorContent.person({ slug: "vespasian" }, { city: "paris" })).status).toBe(
      "not-found",
    );
    onlineCity = removal;
    expect((await visitorContent.person({ slug: "vespasian" }, { city: "rome" })).status).toBe(
      "not-found",
    );
  });

  it("never falls back to local People after an online slug lookup fails", async () => {
    const visitorContent = contentOf(
      {
        getPersonBySlug: async () => {
          throw new Error("Offline");
        },
      },
      localCatalog,
    );
    expect(await visitorContent.person({ slug: "vespasian" }, { city: "rome" })).toEqual({
      status: "unavailable",
    });
  });

  it("resolves legacy aliases to online content and never fills gaps with the local version", async () => {
    let detail: typeof write.detail | null = write.detail;
    const visitorContent = contentOf(
      { getCity: async () => ({ ...emptyCity, pois: [onlinePoi] }), getStory: async () => detail },
      localCatalog,
    );
    expect(await visitorContent.story("rome", "colosseum")).toMatchObject({
      status: "found",
      story: {
        detail: { id: write.detail.id },
        storyContent: { introduction: "A Roman amphitheatre." },
      },
    });
    expect(
      await visitorContent.person({ id: "vespasian" }, { city: "rome", poiId: "colosseum" }),
    ).toEqual({ status: "not-found" });
    detail = null;
    expect(await visitorContent.story("rome", "colosseum")).toEqual({ status: "not-found" });
  });

  it("hides a POI removed online everywhere: on the map, as a Story and as a Person's parent", async () => {
    const visitorContent = contentOf({ getCity: async () => removal }, localCatalog);
    const map = await visitorContent.map("rome");
    expect(map.status === "found" && map.pois).toEqual([]);
    expect(await visitorContent.story("rome", "colosseum")).toEqual({ status: "not-found" });
    expect(
      await visitorContent.person({ id: "vespasian" }, { city: "rome", poiId: "colosseum" }),
    ).toEqual({ status: "not-found" });
  });

  it("is unavailable when the online read fails, never serving the local Story", async () => {
    const visitorContent = contentOf(
      {
        getCity: async () => {
          throw new Error("unavailable");
        },
      },
      localCatalog,
    );
    expect(await visitorContent.story("rome", "colosseum")).toEqual({ status: "unavailable" });
  });
});
