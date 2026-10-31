import type { ReactNode } from "react";

export const Topic = ({
  title,
  insights,
}: {
  title: "Architecture" | "Art";
  insights: ReactNode[];
}) =>
  insights.length > 0 ? (
    <section
      className={`rounded-xl px-4 py-3 ring-1 ${title === "Art" ? "bg-violet-50/60 ring-violet-950/5" : "bg-blue-50/60 ring-blue-950/5"}`}
    >
      <h3 className="flex items-baseline gap-2 text-lg/6 font-semibold tracking-wide text-zinc-950 uppercase">
        <span
          aria-hidden="true"
          className={`size-5 shrink-0 bg-current mask-contain mask-bottom mask-no-repeat ${title === "Art" ? "text-emphasis mask-[url(/icons/story/palette.svg)]" : "mask-[url(/icons/categories/architecture.svg)] text-blue-900"}`}
        />
        {title}
      </h3>
      <ul
        className={`mt-4 list-disc space-y-6 pl-5 marker:text-2xl marker:font-semibold ${title === "Art" ? "marker:text-emphasis" : "marker:text-blue-900"}`}
      >
        {insights.map((description, index) => (
          <li key={`${title}-${index}`} className="pl-1">
            {description}
          </li>
        ))}
      </ul>
    </section>
  ) : null;
