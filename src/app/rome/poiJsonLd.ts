import { siteUrl } from "@/app/site";
import type { Poi } from "@/types/Poi";
import { poiPath } from "./linkedPoi";

/** schema.org description of a POI, for search engines. */
export const poiJsonLd = (poi: Poi, description: string) => ({
  "@context": "https://schema.org",
  "@type": "TouristAttraction",
  name: poi.name,
  description,
  url: `${siteUrl}${poiPath(poi)}`,
  geo: { "@type": "GeoCoordinates", latitude: poi.coordinates.lat, longitude: poi.coordinates.lng },
  ...(poi.mainImageUrl ? { image: poi.mainImageUrl } : {}),
  ...(poi.address ? { address: poi.address } : {}),
  ...(poi.wikidataId ? { sameAs: `https://www.wikidata.org/wiki/${poi.wikidataId}` } : {}),
});

// Escaping `<` keeps content such as `</script>` from closing the tag (Next.js JSON-LD guide).
export const toJsonLdScript = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
