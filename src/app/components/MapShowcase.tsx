"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { RomeCta } from "@/app/components/ui/RomeCta";

export const MapShowcase = () => (
  <section aria-labelledby="map-showcase-title" className="pt-6 pb-12 sm:pt-8 sm:pb-16">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-5 text-white">
      <div className="min-w-0 flex-1 basis-2xl">
        <p className="text-xs/5 font-semibold tracking-[0.2em] text-white/80 uppercase">
          Beyond the familiar
        </p>
        <h2 id="map-showcase-title" className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
          More of Rome to discover.
        </h2>
        <span aria-hidden="true" className="bg-brand mt-3 block h-1 w-10 rounded-full" />
        <p className="mt-3 text-sm/6 text-white/85">
          Our map makes room for the Rome beyond the famous sights: outlying neighbourhoods,
          overlooked places, and corners better known to locals. Open a marker and discover a reason
          to look closer.
        </p>
      </div>
      <RomeCta placement="map-showcase" label="Open the map" size="small" />
    </div>
    <figure>
      <Link
        href="/rome"
        aria-label="Explore Rome on the map"
        onClick={() => track("rome_cta_click", { placement: "map-screenshot" })}
        className="group relative block cursor-pointer overflow-x-auto rounded-2xl border border-zinc-900/10 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-800"
      >
        <Image
          src="/rome-map-showcase-live-ara-pacis.webp"
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
      <figcaption className="mt-3 text-right text-xs/5 text-zinc-500">
        Map: OpenFreeMap · © OpenMapTiles ·{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-800"
        >
          OpenStreetMap contributors ↗
        </a>
      </figcaption>
    </figure>
  </section>
);
