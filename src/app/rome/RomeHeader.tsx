import { MapPinIcon, UsersIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { MiraLogo } from "@/app/components/ui/MiraLogo";
import { AppVersion } from "@/app/components/ui/AppVersion";

export const RomeHeader = ({ counts }: { counts?: { places: number; people: number } }) => (
  <header className="bg-atlas relative isolate overflow-hidden border-b border-white/15 text-white">
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_100%,#426678,transparent_65%),radial-gradient(circle_at_center,#ffffff28_1px,transparent_1px)] bg-size-[auto,16px_16px]"
    />
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:gap-x-6 sm:px-7 sm:py-5">
      <Link
        href="/"
        aria-label="Mira home"
        className="focus-visible:outline-brand flex items-center self-stretch rounded-sm border-r border-white/20 pr-4 focus-visible:outline-2 focus-visible:outline-offset-2 sm:pr-6 [&>[role=img]]:text-[1.75rem]/none sm:[&>[role=img]]:text-[2rem]/none"
      >
        <MiraLogo size="small" tone="dark" />
      </Link>
      <div className="flex-1">
        <p className="text-brand mb-1 text-[9px] font-bold tracking-[0.24em] uppercase">
          City atlas <span aria-hidden="true">/</span> Italy
        </p>
        <h1 className="font-serif text-4xl/none tracking-tight sm:text-5xl/none">Rome</h1>
      </div>
      <p className="order-last w-full text-xs leading-relaxed text-white/90 sm:text-sm lg:order-none lg:mr-auto lg:w-auto">
        Ancient ruins, Baroque squares, and the stories between.
      </p>
      {counts && (
        <div className="flex flex-wrap justify-end gap-1.5 text-xs tabular-nums sm:gap-2 sm:text-sm">
          <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 sm:px-3">
            <MapPinIcon className="text-brand size-4" aria-hidden="true" />{" "}
            {counts.places.toLocaleString("en")}{" "}
            <span className="sr-only text-white/90 sm:not-sr-only">
              {counts.places === 1 ? "place" : "places"}
            </span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 sm:px-3">
            <UsersIcon className="text-brand size-4" aria-hidden="true" />{" "}
            {counts.people.toLocaleString("en")}{" "}
            <span className="sr-only text-white/90 sm:not-sr-only">
              {counts.people === 1 ? "person" : "people"}
            </span>
          </span>
        </div>
      )}
      <div className="hidden items-center gap-2 has-[a]:flex lg:flex">
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
