import { useId, useState } from "react";
import {
  DEFAULT_POI_CATEGORY_DEFINITIONS,
  type PoiCategory,
  type PoiCategoryDefinition,
} from "@/types/PoiCategory";
import type { CategoryFilter } from "@/types/PoiCategory/filter";
import { CategoryOption } from "./CategoryOption";

export const CategoryGroup = ({
  category,
  definitions = DEFAULT_POI_CATEGORY_DEFINITIONS,
  filter,
  onToggleCategory,
  onSelectOnlyCategory,
}: {
  category: PoiCategory;
  definitions?: PoiCategoryDefinition[];
  filter: CategoryFilter;
  onToggleCategory: (category: PoiCategory) => void;
  onSelectOnlyCategory: (category: PoiCategory) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const subcategoriesId = useId();
  const { checked, indeterminate, count } = filter.stateOf(category);
  const children = definitions
    .filter(({ parent }) => parent === category)
    .sort((a, b) => (a.label ?? a.name).localeCompare(b.label ?? b.name, "en"))
    .map(({ id }) => ({
      name: id,
      count: filter.stateOf(id).count,
    }))
    .filter(({ count }) => count > 0);
  if (!count) return null;
  return (
    <div className={children.length ? "bg-canvas -mx-2 rounded-lg px-2 py-1.5" : undefined}>
      <div className="flex items-center gap-2">
        <CategoryOption
          category={category}
          definitions={definitions}
          count={count}
          checked={checked}
          indeterminate={indeterminate}
          onToggle={() => onToggleCategory(category)}
          onSelectOnly={() => onSelectOnlyCategory(category)}
          disclosure={
            children.length
              ? {
                  expanded,
                  controls: subcategoriesId,
                  label: `${expanded ? "Hide" : "Show"} subcategories for ${definitions.find((definition) => definition.id === category)?.name ?? category}`,
                  onToggle: () => setExpanded(!expanded),
                }
              : undefined
          }
        />
        {!children.length && <span aria-hidden="true" className="w-7 shrink-0" />}
      </div>
      {children.length > 0 && (
        <div
          id={subcategoriesId}
          hidden={!expanded}
          className="border-line mt-1 ml-5 space-y-2 border-l pr-9 pl-3"
        >
          {children.map(({ name, count }) => (
            <CategoryOption
              key={name}
              category={name}
              definitions={definitions}
              count={count}
              checked={filter.stateOf(name).checked}
              onToggle={() => onToggleCategory(name)}
              onSelectOnly={() => onSelectOnlyCategory(name)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
