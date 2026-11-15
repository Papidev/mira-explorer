import { describe, expect, it } from "vitest";
import type { Poi } from "@/types/Poi";
import { DEFAULT_POI_CATEGORY_DEFINITIONS as definitions, matchesPoiCategory } from ".";
import { categoryFilter } from "./filter";

const place = (id: string, categories: string[]): Poi => ({
  id,
  name: id,
  categories,
  city: "Rome",
  coordinates: { lat: 41.9, lng: 12.48 },
  funFacts: [],
});
const pois = [
  place("church", ["Church"]),
  place("cathedral", ["Cathedral", "Church"]),
  place("museum", ["Museum"]),
  place("church-museum", ["Church", "Museum"]),
  place("castle-museum", ["Castle", "Museum"]),
  place("unclassified", []),
];
const ids = (shown: Poi[]) => shown.map(({ id }) => id);
const filterOf = (selection: string[] | null) => categoryFilter(definitions, pois, selection);

describe("matchesPoiCategory", () => {
  it.each([
    ["a category itself", ["Church"], "Church", true],
    ["a child under its parent", ["Museum"], "Arts & Culture", true],
    ["an unrelated category", ["Museum"], "Church", false],
    ["a superseded category", ["Cathedral", "Church"], "Church", false],
    ["the superseding category", ["Cathedral", "Church"], "Cathedral", true],
    ["no categories", [], "Other places", false],
  ])("matches %s: %j against %s → %s", (_, categories, selected, expected) => {
    expect(matchesPoiCategory(categories, selected, definitions)).toBe(expected);
  });
});

describe("categoryFilter", () => {
  it("starts with every available category selected, showing uncategorized POIs too", () => {
    const filter = filterOf(null);
    expect(filter.isAll).toBe(true);
    expect(ids(filter.visible)).toEqual(ids(pois));
    expect(filter.available).not.toContain("Abbey");
  });

  it("selects or clears a parent's children with it", () => {
    const cleared = filterOf(filterOf(null).toggle("Arts & Culture"));
    expect(cleared.stateOf("Museum").checked).toBe(false);
    expect(cleared.stateOf("Arts & Culture").checked).toBe(false);

    const selected = filterOf(filterOf([]).toggle("Arts & Culture"));
    expect(selected.stateOf("Museum").checked).toBe(true);
    expect(ids(selected.visible)).toEqual(["museum", "church-museum", "castle-museum"]);
  });

  it("clears the parent but keeps siblings when a child is deselected", () => {
    const next = filterOf(filterOf(null).toggle("Church"));
    expect(next.stateOf("Church").checked).toBe(false);
    expect(next.stateOf("Cathedral").checked).toBe(true);
    expect(next.stateOf("Churches & cathedrals")).toMatchObject({
      checked: false,
      indeterminate: true,
    });
  });

  it("selects the parent again once all its available children are selected", () => {
    const withoutChurch = filterOf(null).toggle("Church");
    expect(
      filterOf(filterOf(withoutChurch).toggle("Church")).stateOf("Churches & cathedrals"),
    ).toMatchObject({ checked: true, indeterminate: false });
  });

  it("shows POIs matching any selected category, never uncategorized ones in a subset", () => {
    const filter = filterOf(["Cathedral", "Castle"]);
    expect(ids(filter.visible)).toEqual(["cathedral", "castle-museum"]);
    expect(filter.excludes(pois[5])).toBe(true);
  });

  it("keeps religious child scopes disjoint", () => {
    expect(ids(filterOf(["Church"]).visible)).toEqual(["church", "church-museum"]);
    expect(filterOf(null).stateOf("Church").count).toBe(2);
  });

  it("shows nothing once every category is cleared", () => {
    const filter = filterOf(filterOf(null).toggleAll());
    expect(filter.visible).toEqual([]);
    expect(filter.excludes(pois[0])).toBe(true);
    expect(filterOf([]).toggleAll()).toEqual(filter.available);
  });

  it("selects only a category and its children", () => {
    expect(filterOf(null).selectOnly("Arts & Culture")).toEqual([
      "Arts & Culture",
      "Museum",
      "Library",
      "Archive",
      "Academy",
    ]);
  });

  it("counts chosen leaf categories for the summary", () => {
    expect(filterOf(["Arts & Culture", "Museum", "Cathedral"]).selectedCount).toBe(2);
  });

  it("colors a marker by its first matching group, preferring a selected group", () => {
    const castleMuseum = pois[4];
    expect(filterOf(null).markerColor(castleMuseum)).toBe("#10b981");
    expect(filterOf(["Castle"]).markerColor(castleMuseum)).toBe("#ea580c");
    expect(filterOf(null).markerColor(pois[5])).toBe("#3FB1CE");
  });
});
