import { useEffect, useSyncExternalStore } from "react";
import type { Poi } from "@/types/Poi";

const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  window.addEventListener("poi-selection-change", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("poi-selection-change", onChange);
  };
};

const updateUrl = (url: URL, replace = false) => {
  if (url.href === window.location.href) return;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new Event("poi-selection-change"));
};

const slugOf = (poi: Poi) => poi.slug ?? poi.id;

const decode = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

/** The selected place lives in the path (`/<city>/<slug>`), the selected Person in `?person=`. */
export const useSelectedPoi = (
  citySlug: string,
  initialSelectedPoiId: string | null,
  pois: Poi[],
  initialPersonSlug: string | null = null,
  aliases: Record<string, string> = {},
) => {
  const cityPath = `/${citySlug}`;
  const placePath = (poi: Poi) => `${cityPath}/${encodeURIComponent(slugOf(poi))}`;
  const location = useSyncExternalStore(
    subscribe,
    () => window.location.pathname + window.location.search,
    () => {
      const poi = pois.find(({ id }) => id === initialSelectedPoiId);
      const search = initialPersonSlug
        ? `?${new URLSearchParams({ person: initialPersonSlug })}`
        : "";
      return (poi ? placePath(poi) : cityPath) + search;
    },
  );
  const url = new URL(location, "http://localhost");
  const slug = url.pathname.startsWith(`${cityPath}/`)
    ? decode(url.pathname.slice(cityPath.length + 1)) || null
    : null;
  const matches = slug === null ? [] : pois.filter((poi) => slugOf(poi) === slug);
  const selectedPoiId =
    slug === null
      ? null
      : matches.length === 1
        ? matches[0].id
        : matches.length === 0
          ? (aliases[slug] ?? null)
          : null;

  useEffect(() => {
    const poi = pois.find(({ id }) => id === selectedPoiId);
    // Renamed places get their canonical path; a place that isn't on the map just opens the map.
    const url = new URL(window.location.href);
    url.pathname = poi ? placePath(poi) : cityPath;
    updateUrl(url, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- placePath only depends on cityPath
  }, [selectedPoiId, pois, cityPath]);

  return {
    selectedPoiId,
    selectedPersonSlug: url.searchParams.get("person"),
    selectPoi: (poiId: string | null) => {
      const url = new URL(window.location.href);
      url.searchParams.delete("person");
      const poi = pois.find(({ id }) => id === poiId);
      url.pathname = poi ? placePath(poi) : cityPath;
      updateUrl(url);
    },
    selectPerson: (slug: string | null) => {
      const url = new URL(window.location.href);
      if (slug) url.searchParams.set("person", slug);
      else url.searchParams.delete("person");
      updateUrl(url);
    },
  };
};
