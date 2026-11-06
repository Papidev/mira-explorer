import { AppVersion } from "@/app/components/ui/AppVersion";
import { RefreshPoiCategories } from "@/app/components/RefreshPoiCategories";
import { MiraLogo } from "@/app/components/ui/MiraLogo";
import { RomeMap } from "@/app/components/RomeMap";
import { WorkInProgressNotice } from "@/app/components/ui/WorkInProgressNotice";
import Image from "next/image";
import Link from "next/link";

type Props = {
  searchParams: Promise<{
    poiId?: string;
    poi?: string;
    person?: string;
  }>;
};

const RomePage = async ({ searchParams }: Props) => {
  const query = await searchParams;
  const initialSelectedPoiId = query.poiId;

  return (
    <main className="flex h-dvh flex-col bg-zinc-50 text-zinc-900">
      <WorkInProgressNotice />
      <RefreshPoiCategories city="rome" />
      <header className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-b border-zinc-900/15 px-4 py-3 text-4xl/none sm:text-[2.75rem]/none md:grid-cols-[1fr_auto_1fr] md:px-6">
        <Link
          href="/"
          aria-label="Mira home"
          className="col-start-1 row-start-1 flex justify-self-start rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-800"
        >
          <MiraLogo size="city" />
        </Link>
        <div className="col-start-2 row-start-1 flex items-center gap-2 justify-self-center">
          <span className="bg-brand flex size-11 shrink-0 items-center justify-center rounded-lg sm:size-14">
            <Image
              src="/icons/cities/rome.svg"
              alt=""
              width={48}
              height={32}
              className="h-auto w-8.5 sm:w-10.5"
            />
          </span>
          <h1 className="font-serif font-medium tracking-tight">Rome</h1>
        </div>
        <p className="col-start-2 row-start-2 text-center text-sm text-zinc-500">
          Ancient ruins, Baroque squares, and the stories between.
        </p>
        <div className="col-start-1 row-start-2 flex items-center gap-2 justify-self-start md:col-start-3 md:row-start-1 md:gap-3 md:justify-self-end">
          <span className="hidden sm:inline-flex">
            <AppVersion />
          </span>
          {process.env.NODE_ENV === "development" && (
            <Link
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
            >
              Admin
            </Link>
          )}
        </div>
      </header>

      <section className="min-h-0 flex-1">
        <RomeMap
          initialSelectedPoiId={initialSelectedPoiId}
          initialPoiSlug={query.poi}
          initialPersonSlug={query.person}
        />
      </section>
    </main>
  );
};

export default RomePage;
