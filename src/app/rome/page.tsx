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
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-zinc-900/15 px-4 py-3 md:gap-x-6 md:px-6 md:py-4">
        <div className="flex min-w-0 items-center gap-3 md:gap-6">
          <Link
            href="/"
            aria-label="Mira home"
            className="flex shrink-0 items-baseline gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-800"
          >
            <MiraLogo size="medium" />
          </Link>
          <div className="flex min-w-0 items-center gap-2 border-l border-zinc-900/15 pl-3 md:gap-3 md:pl-6">
            <span className="bg-brand flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-12">
              <Image
                src="/icons/cities/rome.svg"
                alt=""
                width={48}
                height={32}
                className="h-auto w-7 sm:w-9"
              />
            </span>
            <div>
              <h1 className="font-serif text-3xl/[1.1] font-semibold tracking-tight sm:text-4xl/[1.1] lg:text-5xl/[1.1]">
                Rome
              </h1>
              <p className="mt-1 hidden text-sm text-zinc-500 lg:block">
                Discover the art, history, and people behind the places.
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
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
