import { RefreshPoiCategories } from "@/app/components/RefreshPoiCategories";
import { RomeMap } from "@/app/components/RomeMap";
import { WorkInProgressNote } from "@/app/components/ui/WorkInProgress";

type Props = {
  searchParams: Promise<{
    poiId?: string;
    poi?: string;
    person?: string;
  }>;
};

const RomePage = async ({ searchParams }: Props) => {
  const query = await searchParams;

  return (
    <main className="bg-canvas text-ink flex h-dvh flex-col">
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
