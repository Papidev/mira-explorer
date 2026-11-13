"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import { useSyncExternalStore } from "react";
import { isDarkTheme, setThemePreference, subscribeToDarkTheme } from "@/app/theme";

/** Sun/moon toggle for the blue headers. */
export const ThemeSwitch = () => {
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
      className="focus-visible:outline-brand flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
};
