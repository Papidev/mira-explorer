import { connection } from "next/server";
import { visitorContent } from "@/server/visitorContent";
import { CityExplorer } from "@/app/components/CityExplorer";
import { RomeHeader } from "@/app/rome/RomeHeader";

type Props = {
  initialPoiSlug?: string;
  initialPersonSlug?: string;
};

export const RomeMap = async ({ initialPoiSlug, initialPersonSlug }: Props = {}) => {
  await connection();
  const map = await visitorContent.map("rome");
  if (map.status !== "found")
    return (
      <>
        <RomeHeader />
        <p role="status" className="text-ink-muted p-6">
          Places are temporarily unavailable. Please try again later.
        </p>
      </>
    );
  const { pois, categoryDefinitions, aliases, publishedCounts } = map;
  const initialSelectedPoi = map.findLinkedPoi({ poi: initialPoiSlug });
  const coordinates: [number, number] = initialSelectedPoi
    ? [initialSelectedPoi.coordinates.lng, initialSelectedPoi.coordinates.lat]
    : [12.4823, 41.8933]; // Piazza del Campidoglio: default arrival in Rome's historic centre.
  // A shared place's Story is in the page's HTML; on failure the panel loads it as usual.
  const initialStory = initialSelectedPoi
    ? await visitorContent
        .story("rome", initialSelectedPoi.id)
        .then((result) =>
          result.status === "found" ? { ...result.story, poiId: initialSelectedPoi.id } : null,
        )
    : null;

  return (
    <>
      <RomeHeader counts={publishedCounts} />
      {pois.length ? (
        <CityExplorer
          citySlug="rome"
          cityName="Rome"
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
