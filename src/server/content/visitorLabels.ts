// What cached visitor reads contain, and therefore what a save clears.
export const visitorLabels = {
  all: "all",
  map: "map",
  /** Carried instead of `poi` labels by a Person linked to more POIs than an entry can carry. */
  anyPoi: "any-poi",
  poi: (id: string) => `poi:${id.toLowerCase()}`,
  person: (id: string) => `person:${id}`,
};
