import { Bird } from "@/app/components/ui/MiraLogo/Bird";

export const HomeCuriosity = () => (
  <section aria-labelledby="closer-look-title" className="border-brand/70 border-b py-10 sm:py-14">
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
      <div>
        <p className="text-xs/5 font-semibold tracking-[0.2em] text-zinc-800 uppercase">
          Follow your curiosity
        </p>
        <h2
          id="closer-look-title"
          className="mt-3 max-w-sm font-serif text-3xl tracking-tight sm:text-4xl"
        >
          There is more to see when you{" "}
          <span className="decoration-brand italic underline decoration-4 underline-offset-4">
            look closer.
          </span>
        </h2>
      </div>
      <div className="bg-brand-soft/50 relative max-w-2xl space-y-4 rounded-2xl p-6 text-base/7 text-zinc-600 sm:p-8">
        <div
          className="pointer-events-none absolute -top-10 right-3 -scale-x-100 text-7xl sm:right-6 sm:text-8xl"
          aria-hidden="true"
        >
          <Bird tone="light" />
        </div>
        <div className="mb-6 space-y-2">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pr-16">
            <p
              lang="it"
              className="font-serif text-6xl leading-none font-medium tracking-[-0.055em] text-zinc-900 sm:text-7xl"
            >
              mira
              <sup
                className="ml-1 align-super font-sans text-sm font-normal tracking-normal"
                aria-hidden="true"
              >
                1
              </sup>
            </p>
            <p className="border-brand max-w-36 translate-y-1 border-l-2 pl-4 text-sm/6 font-medium text-zinc-800">
              Our name is an invitation.
            </p>
          </div>
          <p className="text-xs/5 tracking-wide text-zinc-500">
            Italian · from <i lang="it">mirare</i> · literary
          </p>
          <p lang="it" className="font-serif text-base/7 text-zinc-900 italic">
            «Ammirare; contemplare con ammirazione.»
          </p>
        </div>
        <p>
          In several languages around the world, “mira” means look, observe.
          <br />
          In Italian, something more, poetic and literary:
          <br />
          <strong className="text-story-emphasis font-semibold">
            to admire, to contemplate with admiration.
          </strong>
        </p>
        <p>
          We chose Mira for that spirit: taking the time to discover and appreciate the{" "}
          <strong className="text-story-emphasis font-semibold">beauty around us</strong>: the
          beauty in the details, and the joy of discovering at a slower pace.
        </p>
        <p>
          <strong className="text-story-emphasis font-semibold">Linger a little.</strong> Let a
          detail catch your eye, wonder about its story, and give yourself time to understand it. We
          want each discovery to enrich your experience and leave you with something to carry into
          your own life.
        </p>
      </div>
    </div>

    <div className="mt-10 grid gap-8 text-base/7 text-zinc-600 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
      <p className="border-brand/70 border-t pt-4">
        Discover <strong className="text-story-emphasis font-semibold">lesser-known places</strong>{" "}
        beyond the usual tourist routes, alongside the landmarks you came to see.
      </p>
      <p className="border-brand/70 border-t pt-4">
        Discover{" "}
        <strong className="text-story-emphasis font-semibold">details and curiosities</strong>, and
        the events and people connected to the places you visit. There is more to each place than
        first meets the eye.
      </p>
      <p className="border-brand/70 border-t pt-4">
        Understand{" "}
        <strong className="text-story-emphasis font-semibold">
          the history behind what you see
        </strong>
        . Explore how the city became what it is today, and get more from its art and cultural
        heritage.
      </p>
      <p className="border-brand/70 border-t pt-4">
        You won’t find hotel, restaurant, or shopping listings on Mira. You’ll find{" "}
        <strong className="text-story-emphasis font-semibold">places that stay with you</strong>:
        beauty that moves you, stories that teach you something, and discoveries that deepen your
        love of art, culture, and history.
      </p>
    </div>
  </section>
);
