import { MapPinIcon, UsersIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { MiraLogo } from "@/app/components/ui/MiraLogo";
import { AppVersion } from "@/app/components/ui/AppVersion";
import { ThemeSwitch } from "@/app/components/ui/ThemeSwitch";

// The city leads as the page title; the Mira brand signs off on the right with the app
// tools, so the two serif names never read as one title.
export const RomeHeader = ({ counts }: { counts?: { places: number; people: number } }) => (
  <header className="bg-atlas relative isolate overflow-hidden border-b border-white/15 text-white">
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_100%,var(--color-atlas-glow),transparent_65%),radial-gradient(circle_at_center,#ffffff28_1px,transparent_1px)] bg-size-[auto,16px_16px]"
    />
    {/* Everything is centred on one row axis. Text boxes are trimmed to cap height and
        baseline so flex centres the letters, not the font's line box. The right inset
        centres the theme switch over the map's zoom controls. */}
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 pr-4 pl-4 sm:gap-x-6 sm:py-5 sm:pl-7">
      <div className="flex items-center gap-2 sm:gap-3">
        <Image
          src="/icons/cities/rome.svg"
          alt=""
          width={48}
          height={32}
          className="h-auto w-12 shrink-0 sm:w-16"
        />
        <div className="relative">
          <p className="text-brand absolute bottom-full mb-1.5 text-[9px]/3 sm:mb-2 font-bold tracking-[0.24em] uppercase">
            Italy
          </p>
          <h1 className="font-serif text-4xl/none tracking-tight [text-box:trim-both_cap_alphabetic] sm:text-5xl/none">Rome</h1>
        </div>
      </div>
      <p className="order-last w-full text-xs/5 text-white/90 [text-box:trim-both_cap_alphabetic] sm:text-sm/5 xl:order-none xl:mr-auto xl:w-auto">
        Ancient ruins, Baroque squares, and the stories between.
      </p>
      <div className="ml-auto flex items-center gap-4 xl:ml-0">
        {counts && (
          <div className="hidden shrink-0 items-baseline gap-3 rounded-md bg-white/10 px-3 py-1.5 text-sm/5 tabular-nums sm:flex">
            <span className="flex items-baseline gap-1.5">
              <MapPinIcon className="text-brand size-4 self-center" aria-hidden="true" />{" "}
              {counts.places.toLocaleString("en")}{" "}
              <span className="text-white/90">{counts.places === 1 ? "place" : "places"}</span>
            </span>
            <span aria-hidden="true" className="h-3.5 w-px self-center bg-white/25" />
            <span className="flex items-baseline gap-1.5">
              <UsersIcon className="text-brand size-4 self-center" aria-hidden="true" />{" "}
              {counts.people.toLocaleString("en")}{" "}
              <span className="text-white/90">{counts.people === 1 ? "person" : "people"}</span>
            </span>
          </div>
        )}
        <span aria-hidden="true" className="hidden h-8 w-px bg-white/20 sm:block" />
        {/* The bird stands taller than the wordmark: lift the logo so "mira" is centred
            like the other text (cap height to baseline), whatever the logo size. */}
        <div className="flex items-start gap-0.5">
          <Link
            href="/"
            aria-label="Mira home"
            className="focus-visible:outline-brand flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 [&>[role=img]]:-translate-y-[0.11em] [&>[role=img]]:text-[1.875rem]/none sm:[&>[role=img]]:text-[2.25rem]/none"
          >
            <MiraLogo size="small" tone="dark" />
          </Link>
          {/* Superscript tag on the wordmark: its cap top meets the dot of the "i" in
              "mira", so the version reads as part of the logo lockup. */}
          <span className="mt-2.25 hidden lg:inline-flex [&>span]:text-[0.625rem] [&>span]:text-white/70 [&>span]:[text-box:trim-both_cap_alphabetic]">
            <AppVersion />
          </span>
        </div>
        <ThemeSwitch tone="dark" />
      </div>
    </div>
  </header>
);
