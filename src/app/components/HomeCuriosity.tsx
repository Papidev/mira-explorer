import { Bird } from "@/app/components/ui/MiraLogo/Bird";

const points = [
  {
    title: "Take your curiosity further.",
    summary: "Places beyond the usual sightseeing lists.",
    body: "The city continues beyond its celebrated centre. Mira helps you find places across its neighbourhoods, including those that rarely make the usual sightseeing lists.",
  },
  {
    title: "There is a reason to stop.",
    summary: "A small detail can change how you see it.",
    body: "A place may have no famous masterpiece or obvious splendour. Its history, a surprising episode, or an easily missed detail can still change the way you see it.",
  },
  {
    title: "Put a life to a name.",
    summary: "Meet the people linked to each place.",
    body: "Follow the people linked to a place into their own profiles. Get a quick sense of who they were, what shaped their lives, and why their names belong here.",
  },
  {
    title: "A quick read can open a door.",
    summary: "Short reads, with Wikipedia for more.",
    body: "Stories and profiles are made for an easy first encounter. When something catches your imagination, the Wikipedia link is there to keep exploring.",
  },
];

export const HomeCuriosity = () => (
  <section aria-labelledby="closer-look-title" className="border-brand border-b-2 py-10 sm:py-14">
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
      <div>
        <p className="text-accent text-xs/5 font-semibold tracking-[0.2em] uppercase">
          Follow your curiosity
        </p>
        <h2
          id="closer-look-title"
          className="mt-3 max-w-sm font-serif text-3xl tracking-tight sm:text-4xl"
        >
          Some places reveal themselves when you{" "}
          <span className="text-story-emphasis italic">look closer.</span>
        </h2>
      </div>
      <div className="bg-brand-soft text-ink-muted relative space-y-4 rounded-2xl p-6 text-base/7 sm:p-8">
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
              className="text-ink font-serif text-6xl leading-none font-medium tracking-[-0.055em] sm:text-7xl"
            >
              mira
              <sup
                className="ml-1 align-super font-sans text-sm font-normal tracking-normal"
                aria-hidden="true"
              >
                1
              </sup>
            </p>
            <p className="border-brand text-ink max-w-36 translate-y-1 border-l-2 pl-4 text-sm/6 font-medium">
              Our name is an invitation.
            </p>
          </div>
          <p className="text-ink-subtle text-xs/5 tracking-wide">
            Italian · from <i lang="it">mirare</i> · literary
          </p>
          <p lang="it" className="text-accent font-serif text-lg/7 font-medium italic sm:text-xl/8">
            «Ammirare; contemplare con ammirazione.»
          </p>
        </div>
        <p>
          In several languages around the world, “mira” means look, observe. In Italian, something
          more, poetic and literary:{" "}
          <strong className="text-story-emphasis font-semibold">
            to admire, to contemplate with admiration.
          </strong>
        </p>
        <p>
          That is the spirit of Mira: finding something worth your attention in a place, a detail,
          or a person you had never heard of.
        </p>
        <p>
          <strong className="text-story-emphasis font-semibold">Linger a little.</strong> A place
          can become more interesting once you know what happened there, or whose life it touched.
        </p>
      </div>
    </div>

    {/* Phones get the headlines with one-line summaries; the full paragraphs would fill
        several screens. */}
    <ul className="text-ink-muted mt-8 space-y-3 text-sm/6 sm:hidden">
      {points.map(({ title, summary }) => (
        <li key={title} className="border-brand border-l-2 pl-3">
          <strong className="text-story-emphasis block font-semibold">{title}</strong>
          {summary}
        </li>
      ))}
    </ul>
    <div className="text-ink-muted mt-10 grid gap-8 text-base/7 max-sm:hidden sm:grid-cols-2 lg:mt-12 lg:gap-x-16">
      {points.map(({ title, body }) => (
        <p key={title} className="border-brand border-t-2 pt-4">
          <strong className="text-story-emphasis font-semibold">{title}</strong> {body}
        </p>
      ))}
    </div>
  </section>
);
