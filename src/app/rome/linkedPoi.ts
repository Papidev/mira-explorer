import type { Poi } from "@/types/Poi";

export const poiPath = (poi: Pick<Poi, "id" | "slug">) =>
  `/rome?poi=${encodeURIComponent(poi.slug ?? poi.id)}`;
