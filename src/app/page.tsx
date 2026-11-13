import { AppVersion } from "@/app/components/ui/AppVersion";
import {
  ArrowLongRightIcon,
  ArrowRightIcon,
  BuildingLibraryIcon,
  PaintBrushIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import catalog from "../../data/public/catalog.json";
import { WorkInProgressNotice } from "@/app/components/ui/WorkInProgressNotice";
import { HomeHeroStory } from "@/app/components/HomeHeroStory";
import { MapShowcase } from "@/app/components/MapShowcase";
import { MiraLogo } from "@/app/components/ui/MiraLogo";
import { HomeCuriosity } from "@/app/components/HomeCuriosity";
import { HomeNumbers } from "@/app/components/HomeNumbers";
import { RomeCta } from "@/app/components/ui/RomeCta";
import { Suspense } from "react";

const Home = () => {
  const cover =
    catalog.pois.find(({ poi }) => poi.id === "castle-of-the-holy-angel") ?? catalog.pois[0];
  const discoveries = ["piazza-navona", "cloisters-of-bramante", "forum-boarium"]
    .map((id) => catalog.pois.find(({ poi }) => poi.id === id))
    .filter((entry) => entry !== undefined);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <WorkInProgressNotice />
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-white p-3 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-20"
      >
        Skip to content
      </a>
      <header className="bg-[#203e50] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 lg:px-12">
          <div className="flex items-baseline-last gap-7">
            <Link
              href="/"
              aria-label="Mira home"
              className="focus-visible:outline-brand flex items-baseline rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <MiraLogo size="large" tone="dark" />
            </Link>
            <p className="hidden border-l border-white/25 pl-7 text-sm/6 text-white/75 sm:block">
              Art, history, and
              <br />
              the places between.
            </p>
          </div>
          <RomeCta placement="header" size="small" className="relative z-10" />
        </div>
      </header>

      <main id="main-content">
        <div className="to-atlas relative isolate bg-linear-to-b from-[#203e50] text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,#ffffff18_1px,transparent_1px)] mask-[linear-gradient(to_bottom,transparent,black_20%,transparent_100%)] bg-size-[20px_20px]"
          />
          <section
            aria-labelledby="hero-title"
            className="mx-auto grid max-w-7xl items-start gap-y-6 px-5 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:px-12 lg:pt-10"
          >
            <div>
              <p className="flex items-center gap-3 text-xs/5 font-semibold tracking-[0.2em] text-white/80 uppercase">
                <span className="bg-brand h-1 w-10 shrink-0 rounded-full" aria-hidden="true" />A
                city waiting to be discovered
              </p>
              <h1
                id="hero-title"
                className="mt-6 max-w-xl font-serif text-5xl leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl"
              >
                Every place has a{" "}
                <span className="text-brand decoration-brand italic underline decoration-4 underline-offset-8">
                  story.
                </span>
              </h1>
            </div>

            {cover && <HomeHeroStory cover={cover} />}

            <div className="lg:col-start-1">
              <div className="space-y-4 text-base/7 text-white/85">
                <p>
                  The landmarks draw you in. The unexpected discoveries make a city your own.
                  Explore the places you came to see and the quiet corners you might have missed.
                </p>
                <p>
                  Discover the history of each place and the people connected to it. Open their
                  profiles for a quick introduction to their lives, with Wikipedia links to find out
                  more.
                </p>
              </div>
              <ul
                aria-label="Mira's focus"
                className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xl/8 font-semibold tracking-tight text-white sm:text-2xl/8"
              >
                {[
                  { label: "Art", Icon: PaintBrushIcon },
                  { label: "History", Icon: BuildingLibraryIcon },
                  { label: "Culture", Icon: SparklesIcon },
                ].map(({ label, Icon }) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="text-brand flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <p className="mt-6 max-w-md text-base/7 text-white/85">
                <strong className="text-brand font-semibold">Mira begins in Rome.</strong> More
                cities will follow.
              </p>
              <RomeCta placement="hero" className="mt-6" />
              <p className="mt-4 text-sm text-white/75">From your doorstep, or from anywhere.</p>
            </div>
          </section>
        </div>

        <div className="bg-[linear-gradient(to_bottom,var(--color-atlas)_8rem,#e8eff2_40rem,var(--color-zinc-50)_100%)]">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <MapShowcase />

            <Suspense>
              <HomeNumbers />
            </Suspense>

            <HomeCuriosity />

            <section
              aria-labelledby="shared-knowledge-title"
              className="border-brand grid gap-5 border-b-2 py-10 sm:py-14 lg:grid-cols-[1fr_1.5fr] lg:gap-16"
            >
              <div>
                <p className="text-atlas text-xs/5 font-semibold tracking-[0.2em] uppercase">
                  Behind the Stories
                </p>
                <h2
                  id="shared-knowledge-title"
                  className="mt-3 max-w-sm font-serif text-3xl tracking-tight sm:text-4xl"
                >
                  Built on shared knowledge.
                </h2>
                <span aria-hidden="true" className="bg-brand mt-3 block h-1 w-10 rounded-full" />
              </div>
              <div className="max-w-2xl space-y-4 text-base/7 text-zinc-600">
                <p>
                  Mira draws on the remarkable work of open knowledge communities: articles,
                  structured knowledge, images, and geographic data that help us understand places
                  and the lives connected to them.
                </p>
                <ul className="grid gap-x-6 gap-y-4 py-2 sm:grid-cols-2" aria-label="Data sources">
                  {[
                    {
                      name: "Wikipedia",
                      href: "https://www.wikipedia.org/",
                      logo: "/icons/wikipedia-w.svg",
                    },
                    {
                      name: "Wikidata",
                      href: "https://www.wikidata.org/",
                      logo: "/icons/wikidata.svg",
                    },
                    {
                      name: "Wikimedia Commons",
                      href: "https://commons.wikimedia.org/",
                      logo: "/icons/wikimedia-commons.svg",
                    },
                    {
                      name: "OpenStreetMap",
                      href: "https://www.openstreetmap.org/",
                      logo: "/icons/openstreetmap.png",
                    },
                  ].map(({ name, href, logo }) => (
                    <li key={name}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-sm text-sm font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
                      >
                        <Image
                          src={logo}
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 shrink-0 object-contain"
                        />
                        {name}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-xs/5 text-zinc-500">
                  Map and place data © OpenStreetMap contributors. OpenStreetMap and Wikimedia
                  Commons logos: Ken Vermette and Wikimedia Foundation, respectively, under{" "}
                  <a
                    href="https://creativecommons.org/licenses/by-sa/3.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
                  >
                    CC BY-SA 3.0
                  </a>
                  .
                </p>
                <p>
                  Every Story and Person profile keeps Wikipedia within reach. Start with a quick
                  read on Mira, then follow the link whenever a detail leaves you wanting more.
                </p>
                <p>
                  We use AI as an assistant to prepare Story drafts and suggest possible connections
                  between places and people. The sources remain the foundation of what we share.
                </p>
              </div>
            </section>

            {discoveries.length > 0 && (
              <section aria-labelledby="discoveries-title" className="py-12 sm:py-16">
                <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-atlas text-xs/5 font-semibold tracking-[0.2em] uppercase">
                      Start with a little curiosity
                    </p>
                    <h2
                      id="discoveries-title"
                      className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl"
                    >
                      Where will your curiosity take you?
                    </h2>
                    <span
                      aria-hidden="true"
                      className="bg-brand mt-3 block h-1 w-10 rounded-full"
                    />
                  </div>
                  <Link
                    href="/rome"
                    className="group text-atlas focus-visible:outline-atlas inline-flex items-center gap-2 rounded-sm py-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    See the map{" "}
                    <ArrowRightIcon
                      className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
                <div className="grid gap-8 sm:grid-cols-3">
                  {discoveries.map(({ poi, mainImage }) => (
                    <article key={poi.id}>
                      <Link
                        href={`/rome?poi=${encodeURIComponent(poi.id)}`}
                        className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-800"
                      >
                        <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-zinc-200">
                          <Image
                            src={mainImage.thumbnailUrl}
                            alt={poi.name}
                            fill
                            sizes="(min-width: 640px) 33vw, 100vw"
                            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                          />
                          <span
                            aria-hidden="true"
                            className="bg-brand group-hover:bg-brand-action absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md text-zinc-900 shadow-sm transition-colors"
                          >
                            <ArrowLongRightIcon
                              className="size-7 -rotate-45 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                              strokeWidth={1.5}
                            />
                          </span>
                        </div>
                        <h3 className="mt-4 font-serif text-2xl/7 tracking-tight group-hover:text-zinc-800">
                          {poi.name}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm/6 text-zinc-600">
                          {poi.previewDescription}
                        </p>
                      </Link>
                      <p className="mt-3 text-xs/5 text-zinc-500">
                        Photo: {mainImage.attribution} ·{" "}
                        <a
                          href={mainImage.commonsPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-sm underline decoration-zinc-300 underline-offset-2 hover:text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800"
                        >
                          {mainImage.license} ↗
                        </a>
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <section aria-labelledby="final-cta-title" className="bg-[#203e50] text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
            <div>
              <h2 id="final-cta-title" className="font-serif text-3xl tracking-tight sm:text-4xl">
                Rome is waiting.
              </h2>
              <p className="mt-3 max-w-md text-base/7 text-white/85">
                Open the map and follow the first story that catches your eye.
              </p>
            </div>
            <RomeCta placement="final" />
          </div>
        </section>
      </main>

      <footer className="border-brand mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-3 border-t-2 px-5 py-6 text-xs text-zinc-500 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-baseline gap-3">
          <Link
            href="/"
            aria-label="Mira home"
            className="inline-flex items-baseline rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-800"
          >
            <MiraLogo size="small" />
          </Link>
          <p>Art, history, and the places between.</p>
        </div>
        <div className="flex items-baseline gap-3">
          <p>Mira is taking shape. Begin with Rome.</p>
          <AppVersion />
        </div>
      </footer>
    </div>
  );
};

export default Home;
