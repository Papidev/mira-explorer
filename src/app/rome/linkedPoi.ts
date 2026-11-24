import type { Poi } from "@/types/Poi";

export type PoiLink = { poi?: string; poiId?: string };

// `?poi=<slug>` is the shared link; `?poiId=` and local IDs replaced online still resolve.
export const findLinkedPoi = (
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

export const poiPath = (poi: Pick<Poi, "id" | "slug">) =>
  `/rome?poi=${encodeURIComponent(poi.slug ?? poi.id)}`;
