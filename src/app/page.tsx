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
import { ThemeSwitch } from "@/app/components/ui/ThemeSwitch";
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
    <div className="bg-canvas text-ink min-h-screen">
      <WorkInProgressNotice />
      <a
        href="#main-content"
        className="bg-surface sr-only rounded-lg p-3 focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-20"
      >
        Skip to content
      </a>
      <header className="bg-hero-start text-ink">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 lg:px-12">
          <div className="flex items-baseline-last gap-7">
            <Link
              href="/"
              aria-label="Mira home"
              className="focus-visible:outline-accent flex items-baseline rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <MiraLogo size="large" />
            </Link>
            <p className="border-line-strong text-ink-subtle hidden border-l pl-7 text-sm/6 sm:block">
              Art, history, and
              <br />
              the places between.
            </p>
          </div>
          {/* Sits above the hero photo, which rises into the header on large screens. */}
          <div className="relative z-10 self-start">
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main id="main-content">
        <div className="from-hero-start to-hero-end text-ink relative isolate bg-linear-to-b">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,var(--color-hero-dots)_1px,transparent_1px)] mask-[linear-gradient(to_bottom,transparent,black_20%,transparent_100%)] bg-size-[20px_20px]"
          />
          <section
            aria-labelledby="hero-title"
            className="mx-auto grid max-w-7xl items-start gap-y-6 px-5 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-12 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:px-12 lg:pt-10"
          >
            <div>
              <p className="text-ink-muted flex items-center gap-3 text-xs/5 font-semibold tracking-[0.2em] uppercase">
                <span className="bg-brand h-1 w-10 shrink-0 rounded-full" aria-hidden="true" />A
                city waiting to be discovered
              </p>
              <h1
                id="hero-title"
                className="text-ink mt-6 max-w-xl font-serif text-5xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
              >
                Every place has a{" "}
                <span className="text-accent decoration-brand italic underline decoration-4 underline-offset-8">
                  story.
                </span>
              </h1>
            </div>

            {cover && <HomeHeroStory cover={cover} />}

            <div className="lg:col-start-1">
              <div className="text-ink-muted space-y-4 text-base/7">
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
                className="text-ink mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xl/8 font-semibold tracking-tight sm:text-2xl/8"
              >
                {[
                  { label: "Art", Icon: PaintBrushIcon },
                  { label: "History", Icon: BuildingLibraryIcon },
                  { label: "Culture", Icon: SparklesIcon },
                ].map(({ label, Icon }) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="bg-brand text-atlas dark:text-brand flex size-9 shrink-0 items-center justify-center rounded-full dark:bg-white/10 dark:ring-1 dark:ring-white/20">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <p className="text-ink-muted mt-6 max-w-md text-base/7">
                <strong className="text-accent font-semibold">Mira begins in Rome.</strong> More
                cities will follow.
              </p>
              <RomeCta placement="hero" className="mt-6" />
              <p className="text-ink-subtle mt-4 text-sm">From your doorstep, or from anywhere.</p>
            </div>
          </section>
        </div>

        <div className="bg-[linear-gradient(to_bottom,var(--color-hero-end)_8rem,var(--color-atlas-mist)_40rem,var(--color-canvas)_100%)]">
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
                <p className="text-accent text-xs/5 font-semibold tracking-[0.2em] uppercase">
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
              <div className="text-ink-muted max-w-2xl space-y-4 text-base/7">
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
                        className="text-ink decoration-line-strong hover:text-ink focus-visible:outline-focus flex items-center gap-3 rounded-sm text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
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
                <p className="text-ink-subtle text-xs/5">
                  Map and place data © OpenStreetMap contributors. OpenStreetMap and Wikimedia
                  Commons logos: Ken Vermette and Wikimedia Foundation, respectively, under{" "}
                  <a
                    href="https://creativecommons.org/licenses/by-sa/3.0/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-visible:outline-focus rounded-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
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
                    <p className="text-accent text-xs/5 font-semibold tracking-[0.2em] uppercase">
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
                    className="group text-accent focus-visible:outline-accent inline-flex items-center gap-2 rounded-sm py-1 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
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
                        className="group focus-visible:outline-focus block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4"
                      >
                        <div className="bg-surface-muted relative aspect-4/3 overflow-hidden rounded-xl">
                          <Image
                            src={mainImage.thumbnailUrl}
                            alt={poi.name}
                            fill
                            sizes="(min-width: 640px) 33vw, 100vw"
                            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                          />
                          <span
                            aria-hidden="true"
                            className="bg-brand absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md text-zinc-900 shadow-sm transition-colors"
                          >
                            <ArrowLongRightIcon
                              className="size-7 -rotate-45 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                              strokeWidth={1.5}
                            />
                          </span>
                        </div>
                        <h3 className="group-hover:text-ink mt-4 font-serif text-2xl/7 tracking-tight">
                          {poi.name}
                        </h3>
                        <p className="text-ink-muted mt-2 line-clamp-3 text-sm/6">
                          {poi.previewDescription}
                        </p>
                      </Link>
                      <p className="text-ink-subtle mt-3 text-xs/5">
                        Photo: {mainImage.attribution} ·{" "}
                        <a
                          href={mainImage.commonsPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="decoration-line-strong hover:text-ink focus-visible:outline-focus rounded-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
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

        <section
          aria-labelledby="final-cta-title"
          className="bg-atlas-deep text-white [--color-accent:var(--color-brand)]"
        >
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

      <footer className="border-brand text-ink-subtle mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-3 border-t-2 px-5 py-6 text-xs sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-baseline gap-3">
          <Link
            href="/"
            aria-label="Mira home"
            className="focus-visible:outline-focus inline-flex items-baseline rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
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
