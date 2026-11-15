"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { RomeCta } from "@/app/components/ui/RomeCta";

export const MapShowcase = () => (
  <section aria-labelledby="map-showcase-title" className="pt-6 pb-8 sm:pt-8 sm:pb-16">
    <div className="text-ink flex flex-wrap items-end justify-between gap-5 sm:mb-7">
      <div className="min-w-0 flex-1 basis-2xl">
        <p className="text-ink-muted text-xs/5 font-semibold tracking-[0.2em] uppercase">
          Beyond the guidebook
        </p>
        <h2 id="map-showcase-title" className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
          All of Rome, and beyond its walls.
        </h2>
        <span aria-hidden="true" className="bg-brand mt-3 block h-1 w-10 rounded-full" />
        <p className="text-ink-muted mt-4 max-w-3xl text-base/7 sm:text-lg/8">
          Mira maps{" "}
          <strong className="text-story-emphasis font-semibold">
            every place of interest in Rome and its surroundings
          </strong>
          , not just the famous sights: outlying neighbourhoods, countryside ruins, castles, and
          villas that rarely make it into the guidebooks. Many are worth the trip, and some are{" "}
          <strong className="text-story-emphasis font-semibold">true hidden gems</strong>.
        </p>
        {/* Phones get a direct link: the wide screenshot would only scroll sideways there. */}
        <RomeCta
          placement="map-link"
          label="Open the live map"
          size="small"
          className="mt-5 sm:hidden"
        />
      </div>
    </div>
    <figure className="max-sm:hidden">
      <Link
        href="/rome"
        aria-label="Explore Rome on the map"
        onClick={() => track("rome_cta_click", { placement: "map-screenshot" })}
        className="group border-line bg-surface focus-visible:outline-focus relative block cursor-pointer overflow-x-auto rounded-2xl border shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <Image
          src="/rome-map-showcase-v0-23-ara-pacis.webp"
          alt="Mira map of Rome with place markers, an Ara Pacis preview, and the Castel Sant’Angelo detail panel open"
          width={3456}
          height={1596}
          unoptimized
          className="h-auto w-full min-w-180"
        />
        <span
          aria-hidden="true"
          className="bg-brand text-atlas absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition-colors group-hover:bg-yellow-300"
        >
          Open the live map
          <ArrowRightIcon className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
        </span>
      </Link>
      <figcaption className="text-ink-subtle mt-3 text-right text-xs/5">
        Map: OpenFreeMap · © OpenMapTiles ·{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="decoration-line-strong hover:text-ink underline underline-offset-2"
        >
          OpenStreetMap contributors ↗
        </a>
      </figcaption>
    </figure>
  </section>
);
