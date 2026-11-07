import { RefreshPoiCategories } from "@/app/components/RefreshPoiCategories";
import { RomeMap } from "@/app/components/RomeMap";
import { WorkInProgressNotice } from "@/app/components/ui/WorkInProgressNotice";

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
    <main className="flex h-dvh flex-col bg-zinc-50 text-zinc-900">
      <WorkInProgressNotice />
      <RefreshPoiCategories city="rome" />

      <section className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
        <RomeMap
          initialSelectedPoiId={query.poiId}
          initialPoiSlug={query.poi}
          initialPersonSlug={query.person}
        />
      </section>
    </main>
  );
};

export default RomePage;
