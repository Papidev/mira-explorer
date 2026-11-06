import { connection } from "next/server";
import { visitorContent } from "@/server/visitorContent";
import { mergeVisitorCity } from "@/server/visitorContent/mergeCity";
import { publicCatalog } from "@/server/publicCatalog";
import { CityExplorer } from "@/app/components/CityExplorer";

type Props = {
  initialSelectedPoiId?: string;
  initialPoiSlug?: string;
  initialPersonSlug?: string;
};

export const RomeMap = async ({
  initialSelectedPoiId,
  initialPoiSlug,
  initialPersonSlug,
}: Props = {}) => {
  await connection();
  const city = await visitorContent.getCity("rome").catch(() => null);
  if (!city)
    return (
      <p role="status" className="p-6 text-zinc-600">
        Places are temporarily unavailable. Please try again later.
      </p>
    );
  const { pois, categoryDefinitions, aliases } = mergeVisitorCity(city, publicCatalog);
  const peopleCount = city.peopleCount ?? 0;
  const slugMatches = initialPoiSlug
    ? pois.filter((poi) => (poi.slug ?? poi.id) === initialPoiSlug)
    : [];
  const initialSelectedPoi = initialPoiSlug
    ? slugMatches.length === 1
      ? slugMatches[0]
      : slugMatches.length === 0 && aliases[initialPoiSlug]
        ? pois.find((poi) => poi.id === aliases[initialPoiSlug])
        : undefined
    : initialSelectedPoiId
      ? pois.find((poi) => poi.id === (aliases[initialSelectedPoiId] ?? initialSelectedPoiId))
      : undefined;
  const coordinates: [number, number] = initialSelectedPoi
    ? [initialSelectedPoi.coordinates.lng, initialSelectedPoi.coordinates.lat]
    : [12.4823, 41.8933]; // Piazza del Campidoglio: default arrival in Rome's historic centre.

  return (
    <>
      <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5 border-b border-zinc-900/10 px-4 py-1.5 text-center text-sm text-zinc-600">
        <span className="font-medium tabular-nums">
          {city.pois.length.toLocaleString("en")} {city.pois.length === 1 ? "place" : "places"}
          <span aria-hidden="true"> · </span>
          {peopleCount.toLocaleString("en")} {peopleCount === 1 ? "person" : "people"}
        </span>
        <span>Big city, huh? Filter the map to see just what you want.</span>
      </p>
      {pois.length ? (
        <CityExplorer
          citySlug="rome"
          categoryDefinitions={categoryDefinitions}
          coordinates={coordinates}
          initialZoom={15}
          initialSelectedPoiId={initialSelectedPoi?.id ?? null}
          pois={pois}
          aliases={aliases}
          initialPersonSlug={initialPersonSlug}
        />
      ) : (
        <p role="status" className="p-6 text-zinc-600">
          No published places are available yet.
        </p>
      )}
    </>
  );
};
