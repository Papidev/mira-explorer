"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import { useSyncExternalStore } from "react";
import { isDarkTheme, setThemePreference, subscribeToDarkTheme } from "@/app/theme";

/** Sun/moon toggle; `tone="dark"` is for always-blue surfaces, as in MiraLogo. */
export const ThemeSwitch = ({ tone = "light" }: { tone?: "light" | "dark" }) => {
  // Shows the theme on screen, which follows the system until the visitor picks one.
  const isDark = useSyncExternalStore(subscribeToDarkTheme, isDarkTheme, () => false);
  const Icon = isDark ? MoonIcon : SunIcon;
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setThemePreference(isDark ? "light" : "dark")}
      className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full ring-1 backdrop-blur-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${tone === "dark" ? "text-brand focus-visible:outline-brand bg-white/10 ring-white/20 hover:bg-white/20" : "text-accent focus-visible:outline-accent bg-atlas/5 ring-atlas/15 hover:bg-atlas/10 dark:bg-white/10 dark:ring-white/20 dark:hover:bg-white/20"}`}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
};
