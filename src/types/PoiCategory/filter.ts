import type { Poi } from "@/types/Poi";
import { categoryMarkerColors, markerStyleFor } from "@/app/components/categoryMarkerColors";
import { matchesPoiCategory, type PoiCategory, type PoiCategoryDefinition } from ".";

/**
 * A visitor's choice of POI Categories. `null` means untouched: every available category is
 * selected, including categories that become available later.
 */
export type CategorySelection = PoiCategory[] | null;

/** The Category Filter: what a selection shows, and the selection each control leads to. */
export const categoryFilter = (
  definitions: PoiCategoryDefinition[],
  pois: Poi[],
  selection: CategorySelection,
) => {
  const counts = new Map(
    definitions.map(({ id }) => [
      id,
      pois.filter((poi) => matchesPoiCategory(poi.categories, id, definitions)).length,
    ]),
  );
  const available = definitions.map(({ id }) => id).filter((id) => counts.get(id)! > 0);
  const selected = (selection ?? available).filter((id) => counts.has(id));
  const isAll = available.length > 0 && available.every((id) => selected.includes(id));
  const childrenOf = (id: PoiCategory) =>
    definitions.filter(({ parent }) => parent === id).map((child) => child.id);
  const parentOf = (id: PoiCategory) =>
    definitions.find((definition) => definition.id === id)?.parent;
  // Only everything selected also shows uncategorized POIs.
  const shows = (poi: Poi) =>
    selected.length > 0 &&
    (isAll || selected.some((id) => matchesPoiCategory(poi.categories, id, definitions)));

  return {
    available,
    selected,
    isAll,
    visible: pois.filter(shows),
    /** Whether this selection hides the POI, such as the one whose details are open. */
    excludes: (poi: Poi) => !shows(poi),
    /** Leaf categories chosen, as counted in "N selected". */
    selectedCount: selected.filter(
      (id) => available.includes(id) && !childrenOf(id).some((child) => available.includes(child)),
    ).length,
    stateOf: (id: PoiCategory) => {
      const checked = selected.includes(id);
      return {
        checked,
        indeterminate:
          !checked &&
          childrenOf(id).some((child) => counts.get(child)! > 0 && selected.includes(child)),
        count: counts.get(id) ?? 0,
      };
    },
    /** A parent brings its children; completing a parent's children selects it too. */
    toggle: (id: PoiCategory): PoiCategory[] => {
      const children = childrenOf(id);
      const parent = parentOf(id);
      const next = selected.includes(id)
        ? selected.filter((other) => other !== id && !children.includes(other) && other !== parent)
        : [...new Set([...selected, id, ...children])];
      if (
        parent &&
        !next.includes(parent) &&
        childrenOf(parent)
          .filter((child) => available.includes(child))
          .every((child) => next.includes(child))
      ) {
        next.push(parent);
      }
      return next;
    },
    selectOnly: (id: PoiCategory): PoiCategory[] => [id, ...childrenOf(id)],
    toggleAll: (): PoiCategory[] => (isAll ? [] : available),
    /** The first matching group in marker-color order, preferring a selected group. */
    markerColor: (poi: Poi) => {
      const matching = categoryMarkerColors.filter(({ category }) =>
        matchesPoiCategory(poi.categories, category, definitions),
      );
      const activeGroup = matching.find(({ category }) =>
        selected.some(
          (id) =>
            (id === category || parentOf(id) === category) &&
            matchesPoiCategory(poi.categories, id, definitions),
        ),
      );
      return (activeGroup ?? matching[0] ?? markerStyleFor(undefined)).marker;
    },
  };
};

export type CategoryFilter = ReturnType<typeof categoryFilter>;
