"use client";

import { WrenchScrewdriverIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSyncExternalStore } from "react";

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
 * One-time note over the map on phones and tablets, where the header has no room for the
 * status label.
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
        <strong className="font-semibold">Work in progress</strong> · content may change
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
