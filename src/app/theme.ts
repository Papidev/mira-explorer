export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "mira-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Runs in <head> before first paint so a saved choice never flashes the wrong theme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})()`;

const listeners = new Set<() => void>();

export const readThemePreference = (): ThemePreference => {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "system";
};

export const setThemePreference = (theme: ThemePreference) => {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the choice still applies to this page.
  }
  listeners.forEach((listener) => listener());
};

export const subscribeToThemePreference = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const isDarkTheme = () => {
  const preference = readThemePreference();
  return preference === "system"
    ? (window.matchMedia?.(DARK_QUERY).matches ?? false)
    : preference === "dark";
};

/** Calls the listener when the displayed theme changes, whether by the switch or the system. */
export const subscribeToDarkTheme = (listener: (isDark: boolean) => void) => {
  const media = window.matchMedia?.(DARK_QUERY);
  const notify = () => listener(isDarkTheme());
  media?.addEventListener("change", notify);
  const unsubscribe = subscribeToThemePreference(notify);
  return () => {
    media?.removeEventListener("change", notify);
    unsubscribe();
  };
};
