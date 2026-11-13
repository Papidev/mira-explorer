"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

/** Quiet header tag; the full notice opens on tap so it takes no page height. */
export const WorkInProgressNotice = ({ tone = "light" }: { tone?: "light" | "dark" }) => (
  <Popover className="flex shrink-0">
    {/* The ::after inset keeps a comfortable touch target around the small tag. */}
    <PopoverButton
      className={`relative flex cursor-pointer items-center gap-1.5 rounded-sm text-[10px]/none font-semibold tracking-[0.16em] whitespace-nowrap uppercase underline decoration-dotted underline-offset-4 transition-colors after:absolute after:-inset-x-2 after:-inset-y-4 focus-visible:outline-2 focus-visible:outline-offset-4 ${tone === "dark" ? "focus-visible:outline-brand text-white/85 decoration-white/50 hover:text-white" : "focus-visible:outline-accent text-ink-muted decoration-ink-subtle hover:text-ink"}`}
    >
      <WrenchScrewdriverIcon className="size-3.5" aria-hidden="true" />
      In progress
    </PopoverButton>
    <PopoverPanel
      anchor={{ to: "bottom end", gap: 10, padding: 16 }}
      className="z-50 w-72 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 shadow-lg dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100"
    >
      <p>
        <strong className="font-semibold">Work in progress.</strong> Mira is still being built.
        Content and features may be incomplete or change.
      </p>
    </PopoverPanel>
  </Popover>
);
