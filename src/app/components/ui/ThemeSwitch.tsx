"use client";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ComputerDesktopIcon, MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import { useSyncExternalStore } from "react";
import {
  isDarkTheme,
  readThemePreference,
  setThemePreference,
  subscribeToDarkTheme,
  subscribeToThemePreference,
  type ThemePreference,
} from "@/app/theme";

const options = [
  { value: "system", label: "System", Icon: ComputerDesktopIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
] as const satisfies { value: ThemePreference; label: string; Icon: unknown }[];

/** Compact theme picker; `tone` names the surface it sits on, as in MiraLogo. */
export const ThemeSwitch = ({ tone }: { tone: "light" | "dark" }) => {
  const theme = useSyncExternalStore(
    subscribeToThemePreference,
    readThemePreference,
    () => "system" as const,
  );
  // The button shows the theme on screen (sun or moon), even when it comes from the system.
  const isDark = useSyncExternalStore(subscribeToDarkTheme, isDarkTheme, () => false);
  const current = options.find((option) => option.value === theme) ?? options[0];
  const ButtonIcon = isDark ? MoonIcon : SunIcon;

  return (
    <Listbox value={theme} onChange={setThemePreference}>
      <ListboxButton
        aria-label={`Theme: ${current.label}`}
        title="Theme"
        className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${tone === "dark" ? "focus-visible:outline-brand text-white/80 hover:bg-white/10 hover:text-white" : "focus-visible:outline-focus text-ink-subtle hover:bg-surface-muted hover:text-ink"}`}
      >
        <ButtonIcon className="size-4" aria-hidden="true" />
      </ListboxButton>
      <ListboxOptions
        anchor={{ to: "bottom end", gap: 6 }}
        transition
        className="bg-surface ring-line z-50 w-36 rounded-lg py-1 text-sm shadow-lg ring-1 focus:outline-none data-closed:opacity-0 data-leave:transition data-leave:duration-100 data-leave:ease-in"
      >
        {options.map(({ value, label, Icon }) => (
          <ListboxOption
            key={value}
            value={value}
            className="group text-ink data-focus:bg-surface-muted flex cursor-pointer items-center gap-2 px-3 py-2 select-none"
          >
            <Icon className="text-ink-subtle size-4" aria-hidden="true" />
            <span className="flex-1 group-data-selected:font-semibold">{label}</span>
            <CheckIcon
              className="text-accent size-4 group-not-data-selected:invisible"
              aria-hidden="true"
            />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
};
