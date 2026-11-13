import { ArrowRightIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import catalog from "../../../data/public/catalog.json";
import { RomeCta } from "@/app/components/ui/RomeCta";

type Props = {
  cover: (typeof catalog.pois)[number];
};

export const HomeHeroStory = ({ cover }: Props) => (
  <figure className="relative lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-mt-36">
    <div className="relative lg:pb-14">
      <svg
        aria-hidden="true"
        viewBox="0 24 640 856"
        fill="none"
        className="text-brand/20 pointer-events-none absolute top-0 -left-[13%] hidden w-[126%] mask-[linear-gradient(to_bottom,black,transparent_90%)] lg:block"
      >
        <path d="M24 880V320a296 296 0 0 1 592 0v560" stroke="currentColor" />
        <path d="M48 880V320a272 272 0 0 1 544 0v560" stroke="currentColor" />
        <path d="M72 880V320a248 248 0 0 1 496 0v560" stroke="currentColor" />
      </svg>
      <div className="bg-surface-muted relative aspect-4/5 max-h-[max(8rem,calc(100svh-26rem))] w-full overflow-hidden rounded-t-[10rem] rounded-b-2xl sm:aspect-5/4 lg:aspect-4/5 lg:max-h-[max(12rem,calc(100svh-8rem))]">
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
          {/* Below lg the CTA lifts the caption onto the brighter castle: a soft shadow keeps it
              readable without darkening the photo. */}
          <p className="mt-2 font-serif text-3xl tracking-tight max-lg:text-shadow-md max-lg:text-shadow-zinc-950/60 sm:text-4xl">
            Rome
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-zinc-100 max-lg:text-shadow-sm max-lg:text-shadow-zinc-950/60">
            <MapPinIcon className="size-4" aria-hidden="true" />
            {cover.poi.name}
          </p>
          {/* Single-column layouts would reach the hero CTA only after all the copy. */}
          <RomeCta placement="hero-photo" className="mt-5 lg:hidden" />
        </div>
      </div>

      <Link
        href={`/rome?poi=${encodeURIComponent(cover.poi.id)}`}
        className="group border-line bg-surface hover:bg-canvas focus-visible:outline-focus mt-4 block rounded-2xl border p-5 shadow-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 sm:ml-auto sm:w-80 lg:absolute lg:right-0 lg:bottom-0 lg:mt-0"
      >
        <span className="text-accent text-xs/5 font-semibold tracking-[0.2em] uppercase">
          A story behind the place
        </span>
        <span className="text-ink mt-2 block font-serif text-2xl/7 tracking-tight">
          From mausoleum to fortress
        </span>
        <span className="text-ink-muted mt-2 block text-sm/6">
          Built for Hadrian, the castle later became a papal refuge connected to the Vatican by a
          fortified passage.
        </span>
        <span className="text-ink mt-3 inline-flex items-center gap-2 text-sm font-semibold">
          Read the Story{" "}
          <span className="bg-brand text-atlas grid size-8 shrink-0 place-items-center rounded-full">
            <ArrowRightIcon
              className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </span>
      </Link>
    </div>
    <figcaption className="text-ink-subtle mt-3 text-right text-xs/5">
      Photo: {cover.mainImage.attribution} ·{" "}
      <a
        href={cover.mainImage.commonsPageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="decoration-line-strong hover:text-ink underline underline-offset-2"
      >
        {cover.mainImage.license} ↗
      </a>
    </figcaption>
  </figure>
);
