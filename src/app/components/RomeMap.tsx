import { connection } from "next/server";
import { visitorContent } from "@/server/visitorContent";
import { mergeVisitorCity } from "@/server/visitorContent/mergeCity";
import { publicCatalog } from "@/server/publicCatalog";
import { CityExplorer } from "@/app/components/CityExplorer";
import { RomeHeader } from "@/app/rome/RomeHeader";

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
      <>
        <RomeHeader />
        <p role="status" className="p-6 text-zinc-600">
          Places are temporarily unavailable. Please try again later.
        </p>
      </>
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
      <RomeHeader counts={{ places: city.pois.length, people: peopleCount }} />
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
