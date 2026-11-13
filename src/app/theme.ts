/** The app follows the system theme until the visitor picks one with the switch. */
export type Theme = "light" | "dark";

const STORAGE_KEY = "mira-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Runs in <head> before first paint so a saved choice never flashes the wrong theme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})()`;

const listeners = new Set<() => void>();

export const setThemePreference = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the choice still applies to this page.
  }
  listeners.forEach((listener) => listener());
};

export const isDarkTheme = () => {
  const theme = document.documentElement.dataset.theme;
  if (theme === "light" || theme === "dark") return theme === "dark";
  return window.matchMedia?.(DARK_QUERY).matches ?? false;
};

/** Calls the listener when the displayed theme changes, whether by the switch or the system. */
export const subscribeToDarkTheme = (listener: (isDark: boolean) => void) => {
  const media = window.matchMedia?.(DARK_QUERY);
  const notify = () => listener(isDarkTheme());
  media?.addEventListener("change", notify);
  listeners.add(notify);
  return () => {
    media?.removeEventListener("change", notify);
    listeners.delete(notify);
  };
};
