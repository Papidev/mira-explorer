"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import { useSyncExternalStore } from "react";
import { isDarkTheme, setThemePreference, subscribeToDarkTheme } from "@/app/theme";

/** Sun/moon toggle; `tone` names the surface it sits on, as in MiraLogo. */
export const ThemeSwitch = ({ tone }: { tone: "light" | "dark" }) => {
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
      className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${tone === "dark" ? "focus-visible:outline-brand text-white/80 hover:bg-white/10 hover:text-white" : "focus-visible:outline-focus text-ink-subtle hover:bg-surface-muted hover:text-ink"}`}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
};
