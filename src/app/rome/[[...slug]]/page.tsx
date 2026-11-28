import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { cache, Suspense } from "react";
import type { Poi } from "@/types/Poi";
import { RefreshPoiCategories } from "@/app/components/RefreshPoiCategories";
import { siteOpenGraph, toMetaDescription } from "@/app/site";
import { visitorContent } from "@/server/visitorContent";
import { poiPath } from "../linkedPoi";
import { poiJsonLd, toJsonLdScript } from "../poiJsonLd";
import { RomeMap } from "@/app/components/RomeMap";
import { Spinner } from "@/app/components/ui/Spinner";
import { RomeHeader } from "../RomeHeader";
import { WorkInProgressNote } from "@/app/components/ui/WorkInProgress";

type Query = Record<string, string | string[] | undefined>;

type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Query>;
};

const cityDescription = "Discover the history, art, and culture of Rome's places on the map.";

const first = (value: string | string[] | undefined) => [value ?? []].flat()[0];

// Shared by the metadata and the page so both read the map once per request.
// A link names a place by slug or ID: `/rome/<slug>`, or the legacy `?poi=` and `?poiId=`.
const findLinkedPoi = cache(async (link?: string) => {
  const map = await visitorContent.map("rome");
  if (map.status !== "found") return { available: false } as const;
  const poi = link
    ? (map.findLinkedPoi({ poi: link }) ?? map.findLinkedPoi({ poiId: link }))
    : undefined;
  return { available: true, poi } as const;
});

const readLink = async ({ params, searchParams }: Props) => {
  const [{ slug = [] }, { poi, poiId, ...rest }] = await Promise.all([params, searchParams]);
  if (slug.length > 1) notFound();
  const link = slug[0] ?? first(poi) ?? first(poiId);
  return {
    slug: slug[0],
    legacy: !slug[0] && link !== undefined,
    rest,
    ...(await findLinkedPoi(link)),
  };
};

const poiDescription = (poi: Poi) =>
  toMetaDescription(poi.previewDescription ?? poi.shortDescription ?? cityDescription);

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { poi } = await readLink(props);
  if (!poi)
    return {
      title: "Rome",
      description: cityDescription,
      alternates: { canonical: "/rome" },
      openGraph: { ...siteOpenGraph, title: "Rome", description: cityDescription, url: "/rome" },
    };
  const description = poiDescription(poi);
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

// The page has no `loading.tsx`: links are resolved before anything streams, so redirects and
// 404s keep their HTTP status. Only the map itself streams in behind the spinner.
const RomePage = async (props: Props) => {
  const { slug, legacy, rest, available, poi } = await readLink(props);
  // Legacy, renamed and ID links move to the place's canonical path; unknown places open the map.
  // While content is unavailable the link is kept, so it works again once content is back.
  const path = poi ? poiPath(poi) : "/rome";
  if (available && (legacy || path !== (slug ? `/rome/${encodeURIComponent(slug)}` : "/rome"))) {
    const search = new URLSearchParams(
      Object.entries(rest).flatMap(([key, value]) => [value ?? []].flat().map((v) => [key, v])),
    ).toString();
    (poi ? permanentRedirect : redirect)(search ? `${path}?${search}` : path);
  }

  return (
    <main className="bg-canvas text-ink flex h-dvh flex-col">
      {poi && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: toJsonLdScript(poiJsonLd(poi, poiDescription(poi))),
          }}
        />
      )}
      <RefreshPoiCategories city="rome" />

      <section className="relative grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
        <Suspense
          fallback={
            <>
              <RomeHeader />
              <div role="status" className="grid place-items-center">
                <Spinner />
                <span className="sr-only">Loading the map…</span>
              </div>
            </>
          }
        >
          <RomeMap initialPoiSlug={slug} initialPersonSlug={first(rest.person)} />
        </Suspense>
        <WorkInProgressNote />
      </section>
    </main>
  );
};

export default RomePage;
