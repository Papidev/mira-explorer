import { useSyncExternalStore } from "react";

// Mirror Tailwind's md (48rem) and lg (64rem) breakpoints so JS and CSS switch together.
const SHEET_QUERY = "(width < 48rem)";
const SIDEBAR_BESIDE_MAP_QUERY = "(width >= 64rem)";

const subscribe = (onChange: () => void) => {
  const queries = [SHEET_QUERY, SIDEBAR_BESIDE_MAP_QUERY].map((query) => window.matchMedia(query));
  queries.forEach((media) => media.addEventListener("change", onChange));
  return () => queries.forEach((media) => media.removeEventListener("change", onChange));
};

// useSyncExternalStore compares snapshots by identity, so each combination is one object.
const layouts = {
  sheet: { detailsAsSheet: true, sidebarBesideMap: false },
  drawers: { detailsAsSheet: false, sidebarBesideMap: false },
  sideBySide: { detailsAsSheet: false, sidebarBesideMap: true },
};

const getSnapshot = () =>
  window.matchMedia(SHEET_QUERY).matches
    ? layouts.sheet
    : window.matchMedia(SIDEBAR_BESIDE_MAP_QUERY).matches
      ? layouts.sideBySide
      : layouts.drawers;

/**
 * How the visitor map arranges its panels at the current width:
 * - `detailsAsSheet`: below md, place details open as a bottom sheet instead of a side drawer.
 * - `sidebarBesideMap`: from lg, filters start open and stay beside the map when a place opens.
 * The server renders the in-between layout (neither), as before hydration.
 */
export const useViewport = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => layouts.drawers);
