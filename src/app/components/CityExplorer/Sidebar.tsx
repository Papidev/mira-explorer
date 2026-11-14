import { useId, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import type { Poi } from "@/types/Poi";
import {
  DEFAULT_POI_CATEGORY_DEFINITIONS,
  type PoiCategory,
  type PoiCategoryDefinition,
} from "@/types/PoiCategory";
import { DrawerCloseButton } from "@/app/components/ui/DrawerCloseButton";
import { CategoryGroup } from "./CategoryGroup";
import { Search } from "./Search";

export const Sidebar = ({
  categoryDefinitions = DEFAULT_POI_CATEGORY_DEFINITIONS,
  pois,
  visiblePois,
  selectedCategories,
  availableCategories,
  allCategoriesSelected,
  selectedPoiId,
  onToggleCategory,
  onSelectOnlyCategory,
  onToggleAll,
  onOpenPoi,
  onSearchPoi,
  onClose,
}: {
  categoryDefinitions?: PoiCategoryDefinition[];
  pois: Poi[];
  visiblePois: Poi[];
  selectedCategories: PoiCategory[];
  availableCategories: PoiCategory[];
  allCategoriesSelected: boolean;
  selectedPoiId: string | null;
  onToggleCategory: (category: PoiCategory) => void;
  onSelectOnlyCategory: (category: PoiCategory) => void;
  onToggleAll: () => void;
  onOpenPoi: (poiId: string) => void;
  /** Omitted when search sits over the map instead. */
  onSearchPoi?: (poi: Poi) => void;
  onClose: () => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const categoriesId = useId();
  const placesHeadingId = useId();
  return (
    <aside
      aria-label="Discover places"
      className="border-line bg-canvas text-ink flex h-full w-full shrink-0 flex-col overflow-hidden border-r"
    >
      <div className="border-line shrink-0 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-2xl/7 tracking-tight">Explore the city</h2>
          <DrawerCloseButton label="Close filters" onClick={onClose} transparent />
        </div>
        <p className="text-ink-muted text-xs/5">Big city, huh? But you can filter what you want.</p>
        <span aria-hidden="true" className="bg-brand mt-3 block h-1 w-10 rounded-full" />
      </div>
      {onSearchPoi && (
        <div className="shrink-0 px-4 pt-3 pb-2">
          <Search pois={pois} onSelect={onSearchPoi} />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-4">
        <fieldset className="border-line bg-surface space-y-2 rounded-xl border px-3 py-1">
          <legend className="sr-only">Category filters</legend>
          <div className="relative flex items-center gap-2">
            <input
              type="checkbox"
              aria-label="All categories"
              checked={allCategoriesSelected}
              aria-describedby={`${categoriesId}-selection`}
              ref={(input) => {
                if (input)
                  input.indeterminate = !allCategoriesSelected && selectedCategories.length > 0;
              }}
              onChange={() => {
                if (allCategoriesSelected) setExpanded(true);
                onToggleAll();
              }}
              className="peer checked:border-accent indeterminate:border-accent focus-visible:outline-accent border-ink-subtle bg-surface size-4.5 shrink-0 cursor-pointer appearance-none rounded-sm border focus-visible:outline-2 focus-visible:outline-offset-2 forced-colors:appearance-auto"
            />
            <CheckIcon
              aria-hidden="true"
              strokeWidth={3}
              className="text-accent pointer-events-none absolute top-1/2 left-0.5 hidden size-3.5 -translate-y-1/2 peer-checked:block peer-indeterminate:hidden forced-colors:hidden"
            />
            <MinusIcon
              aria-hidden="true"
              strokeWidth={3}
              className="text-accent pointer-events-none absolute top-1/2 left-0.5 hidden size-3.5 -translate-y-1/2 peer-indeterminate:block forced-colors:hidden"
            />

            <button
              type="button"
              aria-label={`${expanded ? "Hide" : "Show"} categories`}
              aria-expanded={expanded}
              aria-controls={categoriesId}
              onClick={() => setExpanded(!expanded)}
              className="hover:bg-canvas focus-visible:outline-focus flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="flex-1">All categories</span>
              <span
                id={`${categoriesId}-selection`}
                className="text-ink-subtle shrink-0 text-xs font-normal tabular-nums"
              >
                {allCategoriesSelected
                  ? "All"
                  : !selectedCategories.length
                    ? "None"
                    : `${
                        selectedCategories.filter(
                          (category) =>
                            availableCategories.includes(category) &&
                            !categoryDefinitions.some(
                              (definition) =>
                                definition.parent === category &&
                                availableCategories.includes(definition.id),
                            ),
                        ).length
                      } selected`}
              </span>
              <span className="text-ink-subtle flex size-7 shrink-0 items-center justify-center">
                <ChevronDownIcon
                  aria-hidden="true"
                  className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </span>
            </button>
          </div>
          <div
            id={categoriesId}
            hidden={!expanded}
            className="border-line ml-1 space-y-2 border-l pl-2.5"
          >
            <p className="text-ink-subtle py-1 text-xs">
              Double-click a category to show only that one.
            </p>
            {categoryDefinitions
              .filter((category) => !category.parent)
              .sort(
                (a, b) =>
                  Number(a.id === "Other places") - Number(b.id === "Other places") ||
                  (a.label ?? a.name).localeCompare(b.label ?? b.name, "en"),
              )
              .map((category) => (
                <CategoryGroup
                  key={category.id}
                  category={category.id}
                  definitions={categoryDefinitions}
                  pois={pois}
                  selectedCategories={selectedCategories}
                  onToggleCategory={onToggleCategory}
                  onSelectOnlyCategory={onSelectOnlyCategory}
                />
              ))}
          </div>
        </fieldset>
        <h3 id={placesHeadingId} className="text-ink-muted mt-5 px-1 text-sm font-semibold">
          Places matching your filters
        </h3>
        {!visiblePois.length && (
          <p className="text-ink-subtle mt-2 text-sm">
            {selectedCategories.length
              ? "No places match these categories. Try another category."
              : "Select a category to explore places."}
          </p>
        )}
        <ul aria-labelledby={placesHeadingId} className="mt-3 space-y-2">
          {visiblePois.map((poi) => (
            <li key={poi.id}>
              <button
                type="button"
                aria-label={poi.name}
                aria-pressed={selectedPoiId === poi.id}
                onClick={() => onOpenPoi(poi.id)}
                className={`group focus-visible:outline-focus flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${selectedPoiId === poi.id ? "border-brand bg-brand-soft/50" : "hover:border-brand border-line bg-surface"}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-lg leading-snug font-medium">{poi.name}</span>
                  <span className="text-ink-subtle mt-1.5 block text-xs/5">
                    {poi.categories
                      ?.map(
                        (id) =>
                          categoryDefinitions.find((category) => category.id === id)?.name ?? id,
                      )
                      .sort((a, b) => a.localeCompare(b, "en"))
                      .join(" · ") || "Uncategorized"}
                  </span>
                </span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="text-ink-subtle group-hover:text-ink size-5 shrink-0 transition-colors"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
