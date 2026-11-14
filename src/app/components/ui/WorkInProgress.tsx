"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { WrenchScrewdriverIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSyncExternalStore } from "react";

// Mira is still being built. The status shows in two forms: a quiet header tag that opens
// the full notice, and a one-time note over the Rome map below lg, where the Rome header
// has no room for the tag.
const TITLE = "Work in progress";

const storageKey = "mira-work-in-progress-note";
const listeners = new Set<() => void>();
// Keeps the note closed for this page view even when storage is unavailable.
let dismissedInMemory = false;

const isDismissed = () => {
  if (dismissedInMemory) return true;
  try {
    return localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
};

const dismiss = () => {
  dismissedInMemory = true;
  try {
    localStorage.setItem(storageKey, "1");
  } catch {}
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * One-time note over the Rome map below lg, standing in for the header tag there.
 * It stays below the Story and filter panels so it never covers reading.
 */
export const WorkInProgressNote = () => {
  // The server renders it dismissed so the note never flashes before storage is read.
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true);
  if (dismissed) return null;

  return (
    <aside
      aria-label="Development status"
      className="absolute bottom-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/95 py-1 pr-0.5 pl-3 text-xs whitespace-nowrap text-sky-950 shadow-md backdrop-blur-sm lg:hidden dark:border-sky-900 dark:bg-sky-950/95 dark:text-sky-100"
    >
      <WrenchScrewdriverIcon className="size-3.5 shrink-0" aria-hidden="true" />
      <p>
        <strong className="font-semibold">{TITLE}</strong> · content may change
      </p>
      {/* The ::after inset keeps a comfortable touch target around the small button. */}
      <button
        type="button"
        aria-label="Dismiss notice"
        onClick={dismiss}
        className="relative grid size-6 shrink-0 cursor-pointer place-items-center rounded-full after:absolute after:-inset-2.5 focus-visible:outline-2 focus-visible:outline-sky-700"
      >
        <XMarkIcon className="size-4" aria-hidden="true" />
      </button>
    </aside>
  );
};

/**
 * Quiet header tag; the full notice opens on tap so it takes no page height.
 * With `mapNoteBelowLg` it shows only from lg, because the map note covers smaller screens.
 */
export const WorkInProgressNotice = ({
  tone = "light",
  mapNoteBelowLg = false,
}: {
  tone?: "light" | "dark";
  mapNoteBelowLg?: boolean;
}) => (
  <Popover className={`shrink-0 ${mapNoteBelowLg ? "hidden lg:flex" : "flex"}`}>
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
        <strong className="font-semibold">{TITLE}.</strong> Mira is still being built. Content and
        features may be incomplete or change.
      </p>
    </PopoverPanel>
  </Popover>
);
