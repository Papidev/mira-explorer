import { readFileSync } from "node:fs";
import path from "node:path";
import snapshot from "../../../data/public/catalog.json";
import type { PublicCatalog } from "./types";
import type { Poi } from "@/types/Poi";
import { getPoiDisplayName } from "@/utils/getPoiDisplayName";

export const createPublicCatalog = (readCatalog: () => PublicCatalog) => ({
  getCategoryDefinitions: () => readCatalog().categoryDefinitions,
  getPois: (city: string): Poi[] => {
    const catalog = readCatalog();
    return city === catalog.city
      ? catalog.pois.map(({ poi, storyContent }) => ({
          ...poi,
          slug: poi.id,
          name: getPoiDisplayName(poi.name, storyContent.wikipediaSources),
        }))
      : [];
  },
  getStoryContent: (city: string, poiId: string) => {
    const catalog = readCatalog();
    return city === catalog.city
      ? catalog.pois.find(({ poi }) => poi.id === poiId)?.storyContent
      : undefined;
  },
  getPerson: (personId: string) => readCatalog().people.find(({ id }) => id === personId),
  // Legacy local IDs already are persistent human-readable slugs.
  getPersonBySlug: (slug: string) => readCatalog().people.find(({ id }) => id === slug),
});

export const publicCatalog = createPublicCatalog(() =>
  process.env.NODE_ENV === "production"
    ? (snapshot as PublicCatalog)
    : (JSON.parse(
        readFileSync(path.join(process.cwd(), "data", "public", "catalog.json"), "utf-8"),
      ) as PublicCatalog),
);
