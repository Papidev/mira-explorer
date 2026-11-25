import type { PublishedCityPreview } from "@mira/shared";
import type { createPublicCatalog } from "@/server/publicCatalog";
import type { Poi } from "@/types/Poi";
import { toVisitorCity } from "./adapters";

/** `?poi=<slug>` is the shared link; `?poiId=` and local IDs replaced online still resolve. */
export type PoiLink = { poi?: string; poiId?: string };

export const matchesPoiIdentity = (
  local: Pick<Poi, "id" | "wikidataId">,
  online: { id: string; wikidataId?: string | null },
) => local.id === online.id || Boolean(local.wikidataId && local.wikidataId === online.wikidataId);

const findLinkedPoi = (
  pois: Poi[],
  aliases: Record<string, string>,
  { poi: slug, poiId }: PoiLink,
) => {
  if (slug) {
    const matches = pois.filter((poi) => (poi.slug ?? poi.id) === slug);
    if (matches.length === 1) return matches[0];
    return matches.length === 0 && aliases[slug]
      ? pois.find((poi) => poi.id === aliases[slug])
      : undefined;
  }
  return poiId ? pois.find((poi) => poi.id === (aliases[poiId] ?? poiId)) : undefined;
};

/**
 * What visitors can reach in a city: online publications merged with the local public catalog.
 * An online publication replaces the whole matching local POI and a confirmed online removal
 * suppresses it; an online failure is `unavailable` and never falls back to local content.
 */
export const createVisitorContent = ({
  online,
  local,
}: {
  online: { getCity: (city: string) => Promise<PublishedCityPreview> };
  local: Pick<ReturnType<typeof createPublicCatalog>, "getPois" | "getCategoryDefinitions">;
}) => ({
  map: async (city: string) => {
    let published: PublishedCityPreview;
    try {
      published = await online.getCity(city);
    } catch {
      return { status: "unavailable" } as const;
    }
    const visitorCity = toVisitorCity(published);
    const aliases: Record<string, string> = {};
    const localPois = local.getPois(published.city).filter((poi) => {
      const match = published.pois.find((candidate) => matchesPoiIdentity(poi, candidate));
      if (match) aliases[poi.id] = match.id;
      return !match && !published.removedPois?.some((removed) => matchesPoiIdentity(poi, removed));
    });
    const categories = new Map(
      local.getCategoryDefinitions().map((category) => [category.id, category]),
    );
    for (const category of visitorCity.categoryDefinitions)
      categories.set(category.id, { ...categories.get(category.id), ...category });
    const pois = [...visitorCity.pois, ...localPois];
    return {
      status: "found" as const,
      pois,
      categoryDefinitions: [...categories.values()],
      aliases,
      // Totals count online publications only, not local-only POIs.
      publishedCounts: { places: published.pois.length, people: published.peopleCount ?? 0 },
      findLinkedPoi: (link: PoiLink) => findLinkedPoi(pois, aliases, link),
    };
  },
});
