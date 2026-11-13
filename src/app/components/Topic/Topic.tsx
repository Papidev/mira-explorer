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
      className={`rounded-xl px-4 py-3 ring-1 ${title === "Art" ? "bg-rose-50/60 ring-rose-950/5 dark:bg-rose-950/30 dark:ring-white/5" : "ring-atlas/5 bg-sky-100/60 dark:bg-sky-950/40 dark:ring-white/5"}`}
    >
      <h3
        className={`flex items-baseline gap-2 text-lg/6 font-semibold tracking-wide uppercase ${title === "Art" ? "text-rose-800 dark:text-rose-300" : "text-atlas dark:text-sky-300"}`}
      >
        <span
          aria-hidden="true"
          className={`size-5 shrink-0 bg-current mask-contain mask-bottom mask-no-repeat ${title === "Art" ? "mask-[url(/icons/story/palette.svg)] text-rose-800 dark:text-rose-300" : "text-atlas mask-[url(/icons/categories/architecture.svg)] dark:text-sky-300"}`}
        />
        {title}
      </h3>
      <ul
        className={`mt-4 list-disc space-y-6 pl-5 marker:text-2xl marker:font-semibold ${title === "Art" ? "marker:text-rose-800 dark:marker:text-rose-300" : "marker:text-atlas dark:marker:text-sky-300"}`}
      >
        {insights.map((description, index) => (
          <li key={`${title}-${index}`} className="pl-1">
            {description}
          </li>
        ))}
      </ul>
    </section>
  ) : null;
