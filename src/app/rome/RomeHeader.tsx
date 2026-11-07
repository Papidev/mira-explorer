import { MapPinIcon, UsersIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { MiraLogo } from "@/app/components/ui/MiraLogo";
import { AppVersion } from "@/app/components/ui/AppVersion";

export const RomeHeader = ({ counts }: { counts?: { places: number; people: number } }) => (
  <header className="bg-atlas relative isolate overflow-hidden border-b border-white/15 text-white">
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_100%,#426678,transparent_65%),radial-gradient(circle_at_center,#ffffff28_1px,transparent_1px)] bg-size-[auto,16px_16px]"
    />
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3 px-4 py-3 sm:gap-x-6 sm:px-7 sm:py-5">
      <Link
        href="/"
        aria-label="Mira home"
        className="focus-visible:outline-brand flex -translate-y-0.5 items-baseline rounded-sm border-r border-white/20 pr-4 focus-visible:outline-2 focus-visible:outline-offset-2 sm:pr-6 [&>[role=img]]:text-[1.875rem]/none sm:[&>[role=img]]:text-[2.25rem]/none"
      >
        <MiraLogo size="small" tone="dark" />
      </Link>
      <div className="flex flex-1 items-baseline gap-2 sm:gap-3">
        <Image
          src="/icons/cities/rome.svg"
          alt=""
          width={48}
          height={32}
          className="h-auto w-12 shrink-0 translate-y-0.5 sm:w-16"
        />
        <div className="relative pt-4">
          <p className="text-brand absolute top-0 text-[9px]/3 font-bold tracking-[0.24em] uppercase">
            Italy
          </p>
          <h1 className="font-serif text-4xl/none tracking-tight sm:text-5xl/none">Rome</h1>
        </div>
      </div>
      <p className="order-last w-full text-xs/5 text-white/90 sm:text-sm/5 xl:order-none xl:mr-auto xl:w-auto">
        Ancient ruins, Baroque squares, and the stories between.
      </p>
      {counts && (
        <div className="flex shrink-0 items-baseline gap-2 rounded-md bg-white/10 px-2.5 py-1.5 text-xs/5 tabular-nums sm:gap-3 sm:px-3 sm:text-sm/5">
          <span className="flex items-baseline gap-1.5">
            <MapPinIcon className="text-brand size-4 self-center" aria-hidden="true" />{" "}
            {counts.places.toLocaleString("en")}{" "}
            <span className="sr-only text-white/90 sm:not-sr-only">
              {counts.places === 1 ? "place" : "places"}
            </span>
          </span>
          <span aria-hidden="true" className="h-3.5 w-px self-center bg-white/25" />
          <span className="flex items-baseline gap-1.5">
            <UsersIcon className="text-brand size-4 self-center" aria-hidden="true" />{" "}
            {counts.people.toLocaleString("en")}{" "}
            <span className="sr-only text-white/90 sm:not-sr-only">
              {counts.people === 1 ? "person" : "people"}
            </span>
          </span>
        </div>
      )}
      <div className="hidden items-baseline gap-2 has-[a]:flex lg:flex">
        <span className="hidden lg:inline-flex [&>span]:text-white/80">
          <AppVersion />
        </span>
        {process.env.NODE_ENV === "development" && (
          <Link
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-visible:outline-brand rounded-full border border-white/20 px-2.5 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Admin
          </Link>
        )}
      </div>
    </div>
  </header>
);
