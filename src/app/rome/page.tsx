import type { Metadata } from "next";
import { cache } from "react";
import type { Poi } from "@/types/Poi";
import { RefreshPoiCategories } from "@/app/components/RefreshPoiCategories";
import { siteOpenGraph, toMetaDescription } from "@/app/site";
import { visitorContent } from "@/server/visitorContent";
import { poiPath } from "./linkedPoi";
import { placeJsonLd, toJsonLdScript } from "./placeJsonLd";
import { RomeMap } from "@/app/components/RomeMap";
import { WorkInProgressNote } from "@/app/components/ui/WorkInProgress";

type Props = {
  searchParams: Promise<{
    poiId?: string;
    poi?: string;
    person?: string;
  }>;
};

const cityDescription = "Discover the history, art, and culture of Rome's places on the map.";

// Shared by the metadata and the page so both read the map once per request.
const findLinkedPoi = cache(async (poi?: string, poiId?: string) => {
  const map = await visitorContent.map("rome");
  return map.status === "found" ? map.findLinkedPoi({ poi, poiId }) : undefined;
});

const placeDescription = (poi: Poi) =>
  toMetaDescription(poi.previewDescription ?? poi.shortDescription ?? cityDescription);

export const generateMetadata = async ({ searchParams }: Props): Promise<Metadata> => {
  const query = await searchParams;
  const poi = await findLinkedPoi(query.poi, query.poiId);
  if (!poi)
    return {
      title: "Rome",
      description: cityDescription,
      alternates: { canonical: "/rome" },
      openGraph: { ...siteOpenGraph, title: "Rome", description: cityDescription, url: "/rome" },
    };
  const description = placeDescription(poi);
  const url = poiPath(poi);
  return {
    title: poi.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      ...siteOpenGraph,
      title: poi.name,
      description,
      url,
      ...(poi.mainImageUrl ? { images: [{ url: poi.mainImageUrl, alt: poi.name }] } : {}),
    },
  };
};

const RomePage = async ({ searchParams }: Props) => {
  const query = await searchParams;
  const poi = await findLinkedPoi(query.poi, query.poiId);

  return (
    <main className="bg-canvas text-ink flex h-dvh flex-col">
      {poi && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: toJsonLdScript(placeJsonLd(poi, placeDescription(poi))),
          }}
        />
      )}
      <RefreshPoiCategories city="rome" />

      <section className="relative grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
        <RomeMap
          initialSelectedPoiId={query.poiId}
          initialPoiSlug={query.poi}
          initialPersonSlug={query.person}
        />
        <WorkInProgressNote />
      </section>
    </main>
  );
};

export default RomePage;
