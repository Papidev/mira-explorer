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

export const useSelectedPoi = (
  initialSelectedPoiId: string | null,
  pois: Poi[],
  initialPersonSlug: string | null = null,
  aliases: Record<string, string> = {},
) => {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () =>
      new URLSearchParams({
        ...(initialSelectedPoiId ? { poiId: initialSelectedPoiId } : {}),
        ...(initialPersonSlug ? { person: initialPersonSlug } : {}),
      }).toString(),
  );
  const query = new URLSearchParams(search);
  const legacyId = query.get("poiId");
  const matches = pois.filter((poi) => (poi.slug ?? poi.id) === query.get("poi"));
  const selectedPoiId = query.has("poi")
    ? matches.length === 1
      ? matches[0].id
      : matches.length === 0 && aliases[query.get("poi") ?? ""]
        ? aliases[query.get("poi") ?? ""]
        : null
    : legacyId
      ? (aliases[legacyId] ?? legacyId)
      : null;

  useEffect(() => {
    const poi = pois.find(({ id }) => id === selectedPoiId);
    if (!poi) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("poi") === (poi.slug ?? poi.id) && !url.searchParams.has("poiId"))
      return;
    url.searchParams.delete("poiId");
    url.searchParams.set("poi", poi.slug ?? poi.id);
    updateUrl(url, true);
  }, [selectedPoiId, pois]);

  return {
    selectedPoiId,
    selectedPersonSlug: query.get("person"),
    selectPoi: (poiId: string | null) => {
      const url = new URL(window.location.href);
      url.searchParams.delete("poiId");
      url.searchParams.delete("person");
      const poi = pois.find(({ id }) => id === poiId);
      if (poi) url.searchParams.set("poi", poi.slug ?? poi.id);
      else url.searchParams.delete("poi");
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
