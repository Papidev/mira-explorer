import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { Poi } from "@/types/Poi";
import type { PoiCategoryDefinition } from "@/types/PoiCategory";

/** Clicks are handled by the list, so a tap re-renders only the rows whose selection changed. */
export const PlaceRow = ({
  poi,
  selected,
  categoryDefinitions,
}: {
  poi: Poi;
  selected: boolean;
  categoryDefinitions: PoiCategoryDefinition[];
}) => (
  <li>
    <button
      type="button"
      data-poi-id={poi.id}
      aria-label={poi.name}
      aria-pressed={selected}
      className={`group focus-visible:outline-focus flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${selected ? "border-brand bg-brand-soft/50" : "hover:border-brand border-line bg-surface"}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-lg leading-snug font-medium">{poi.name}</span>
        <span className="text-ink-subtle mt-1.5 block text-xs/5">
          {poi.categories
            ?.map((id) => categoryDefinitions.find((category) => category.id === id)?.name ?? id)
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
);
