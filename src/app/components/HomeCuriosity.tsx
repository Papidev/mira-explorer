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
      <div className="max-w-2xl space-y-4 text-base/7 text-zinc-600">
        <p>
          <strong className="font-semibold text-zinc-900">Our name is an invitation.</strong> In
          several languages around the world, “mira” means to look, to observe. In Italian, it
          carries a poetic, literary meaning: to admire, to contemplate with admiration. We chose
          Mira for that spirit: taking the time to discover and appreciate the beauty around us.
        </p>
        <p>
          Linger a little. Let a detail catch your eye, wonder about its story, and give yourself
          time to understand it. We want each discovery to enrich your experience and leave you with
          something to carry into your own life.
        </p>
      </div>
    </div>

    <div className="mt-10 grid gap-8 text-base/7 text-zinc-600 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
      <p className="border-t-2 border-amber-300 pt-4">
        Discover <strong className="font-semibold text-zinc-900">lesser-known places</strong> beyond
        the usual tourist routes, alongside the landmarks you came to see.
      </p>
      <p className="border-t-2 border-sky-300 pt-4">
        Discover <strong className="font-semibold text-zinc-900">details and curiosities</strong>,
        and the events and people connected to the places you visit. There is more to each place
        than first meets the eye.
      </p>
      <p className="border-t-2 border-violet-300 pt-4">
        Understand{" "}
        <strong className="font-semibold text-zinc-900">the history behind what you see</strong>.
        Explore how the city became what it is today, and get more from its art and cultural
        heritage.
      </p>
      <p className="border-t-2 border-rose-300 pt-4">
        You won’t find hotel, restaurant, or shopping listings on Mira. You’ll find{" "}
        <strong className="font-semibold text-zinc-900">places that stay with you</strong>: beauty
        that moves you, stories that teach you something, and discoveries that deepen your love of
        art, culture, and history.
      </p>
    </div>
  </section>
);
