import { ArrowRightIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import catalog from "../../../data/public/catalog.json";

type Props = {
  cover: (typeof catalog.pois)[number];
};

export const HomeHeroStory = ({ cover }: Props) => (
  <figure className="relative lg:col-start-2 lg:row-span-2 lg:row-start-1">
    <div className="relative lg:pb-14">
      <div className="relative aspect-4/5 max-h-[max(8rem,calc(100svh-26rem))] w-full overflow-hidden rounded-t-[10rem] rounded-b-2xl bg-zinc-200 sm:aspect-5/4 lg:aspect-4/5 lg:max-h-[max(12rem,calc(100svh-8rem))]">
        <Image
          src={cover.mainImage.thumbnailUrl}
          alt={cover.poi.name}
          fill
          preload
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-zinc-950/70 via-transparent to-transparent"
          aria-hidden="true"
        />
        <div className="absolute right-6 bottom-7 left-6 text-white">
          <p className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">Rome</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-zinc-100">
            <MapPinIcon className="size-4" aria-hidden="true" />
            {cover.poi.name}
          </p>
        </div>
      </div>

      <Link
        href={`/rome?poi=${encodeURIComponent(cover.poi.id)}`}
        className="group mt-4 block rounded-2xl border border-zinc-900/10 bg-white p-5 shadow-xl transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-800 sm:ml-auto sm:w-80 lg:absolute lg:right-0 lg:bottom-0 lg:mt-0"
      >
        <span className="text-atlas text-xs/5 font-semibold tracking-[0.2em] uppercase">
          A story behind the place
        </span>
        <span className="mt-2 block font-serif text-2xl/7 tracking-tight text-zinc-900">
          From mausoleum to fortress
        </span>
        <span className="mt-2 block text-sm/6 text-zinc-600">
          Built for Hadrian, the castle later became a papal refuge connected to the Vatican by a
          fortified passage.
        </span>
        <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
          Read the Story{" "}
          <span className="bg-brand grid size-8 shrink-0 place-items-center rounded-full">
            <ArrowRightIcon
              className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </span>
      </Link>
    </div>
    <figcaption className="mt-3 text-right text-xs/5 text-white/80">
      Photo: {cover.mainImage.attribution} ·{" "}
      <a
        href={cover.mainImage.commonsPageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-white/40 underline-offset-2 hover:text-white"
      >
        {cover.mainImage.license} ↗
      </a>
    </figcaption>
  </figure>
);
