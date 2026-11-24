import { connection } from "next/server";
import { visitorContent } from "@/server/visitorContent";
import { mergeVisitorCity } from "@/server/visitorContent/mergeCity";
import { publicCatalog } from "@/server/publicCatalog";
import { createVisitorHandler } from "@/server/visitorContent/handler";
import { CityExplorer } from "@/app/components/CityExplorer";
import { RomeHeader } from "@/app/rome/RomeHeader";
import { findLinkedPoi } from "@/app/rome/linkedPoi";

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
        <p role="status" className="text-ink-muted p-6">
          Places are temporarily unavailable. Please try again later.
        </p>
      </>
    );
  const { pois, categoryDefinitions, aliases } = mergeVisitorCity(city, publicCatalog);
  const peopleCount = city.peopleCount ?? 0;
  const initialSelectedPoi = findLinkedPoi(pois, aliases, {
    poi: initialPoiSlug,
    poiId: initialSelectedPoiId,
  });
  const coordinates: [number, number] = initialSelectedPoi
    ? [initialSelectedPoi.coordinates.lng, initialSelectedPoi.coordinates.lat]
    : [12.4823, 41.8933]; // Piazza del Campidoglio: default arrival in Rome's historic centre.
  // A shared place's Story is in the page's HTML; on failure the panel loads it as usual.
  const initialStory = initialSelectedPoi
    ? await createVisitorHandler(visitorContent, publicCatalog)
        .loadStory("rome", initialSelectedPoi.id)
        .then((story) => story && { ...story, poiId: initialSelectedPoi.id })
        .catch(() => null)
    : null;

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
          // Previews load after the map is drawn, which keeps them out of the page's HTML.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          pois={pois.map(({ previewDescription, shortDescription, mainImageUrl, ...poi }) => poi)}
          aliases={aliases}
          initialPersonSlug={initialPersonSlug}
          initialStory={initialStory}
        />
      ) : (
        <p role="status" className="text-ink-muted p-6">
          No published places are available yet.
        </p>
      )}
    </>
  );
};
