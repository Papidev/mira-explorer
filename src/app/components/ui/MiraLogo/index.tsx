import clsx from "clsx";
import { Bird } from "./Bird";

export const MiraLogo = ({
  size = "medium",
  tone = "light",
}: {
  size?: "small" | "medium" | "large" | "city";
  tone?: "light" | "dark";
}) => (
  <span
    role="img"
    aria-label="Mira"
    className={clsx(
      "inline-flex font-serif font-medium tracking-[-0.055em]",
      size !== "city" && "items-baseline gap-[0.13em]",
      {
        small: "text-2xl",
        medium: "text-[2.5rem] sm:text-[2.75rem]",
        large: "-ms-[0.18em] text-[3.5rem]/none sm:text-[4.25rem]/none",
        city: "items-center gap-1.25 sm:gap-1",
      }[size],
      tone === "dark" ? "text-zinc-50" : "text-ink",
    )}
  >
    {size === "city" ? (
      <span className="grid size-11 shrink-0 place-items-center sm:size-14 [&>svg]:w-full [&>svg]:-translate-y-0.5">
        <Bird tone={tone} />
      </span>
    ) : (
      <Bird tone={tone} />
    )}
    <span aria-hidden="true" className="leading-none">
      mira
    </span>
  </span>
);
