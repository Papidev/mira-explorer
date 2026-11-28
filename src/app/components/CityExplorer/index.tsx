"use client";

import {
  DEFAULT_POI_CATEGORY_DEFINITIONS,
  type PoiCategory,
  type PoiCategoryDefinition,
} from "@/types/PoiCategory";
import { categoryFilter, type CategorySelection } from "@/types/PoiCategory/filter";
import { Sidebar } from "./Sidebar";
import { Search } from "./Search";
import { useFilterSwipe } from "./useFilterSwipe";
import { useSelectedPoi } from "./useSelectedPoi";
import { useEffect, useMemo, useState } from "react";
import { PanelResizeHandle } from "@/app/components/ui/PanelResizeHandle";
import { DrawerTab } from "@/app/components/ui/DrawerTab";
import { Drawer } from "@/app/components/ui/Drawer";
import type { Poi } from "@/types/Poi";
import { Map, type CoveredArea } from "@/app/components/Map";
import { DETAILS_PANEL_WIDTH, DetailsPanel } from "@/app/components/DetailsPanel";
import type { InitialStory } from "@/app/components/usePoiStoryContent";
import { BOTTOM_SHEET_PEEK_RATIO } from "@/app/components/ui/BottomSheet";
import { isTouchOnly, useViewport, useViewportWidth } from "@/app/viewport";

/** Default width of the filters drawer, before the visitor resizes it. */
const SIDEBAR_WIDTH = 352;
/** Widest share of the screen the place details drawer may take. */
const DETAILS_MAX_SHARE = 0.45;
/** Least share of the screen width the map keeps beside the filters and an open place. */
const MAP_MIN_SHARE = 0.4;

type Props = {
  citySlug: string;
  cityName: string;
  coordinates: [number, number];
  initialZoom: number;
  initialSelectedPoiId?: string | null;
  initialPersonSlug?: string | null;
  aliases?: Record<string, string>;
  pois: Poi[];
  categoryDefinitions?: PoiCategoryDefinition[];
  initialStory?: InitialStory | null;
};

export const CityExplorer = ({
  citySlug,
  cityName,
  coordinates,
  initialZoom,
  initialSelectedPoiId = null,
  initialPersonSlug = null,
  aliases = {},
  pois: catalogPois,
  categoryDefinitions = DEFAULT_POI_CATEGORY_DEFINITIONS,
  initialStory,
}: Props) => {
  const [previews, setPreviews] = useState<Record<string, Partial<Poi>> | null>(null);
  const pois = useMemo(
    () => (previews ? catalogPois.map((poi) => ({ ...poi, ...previews[poi.id] })) : catalogPois),
    [catalogPois, previews],
  );
  // Preview text and images wait for the map, so they never compete with its downloads.
  // Only the hover card uses them, which touch-only screens never show.
  const loadPreviews = () => {
    if (isTouchOnly()) return;
    fetch(`/api/pois/${citySlug}/previews`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.previews) setPreviews(data.previews);
      })
      .catch(() => {});
  };
  const [categorySelection, setSelectedCategories] = useState<CategorySelection>(null);
  const filter = useMemo(
    () => categoryFilter(categoryDefinitions, pois, categorySelection),
    [categoryDefinitions, pois, categorySelection],
  );
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);
  const { detailsAsSheet, sidebarBesideMap } = useViewport();
  const viewportWidth = useViewportWidth();
  // A closed sidebar still holds ~1,000 place rows; drop them once it has slid away.
  const [poisListed, setPoisListed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH);
  const [detailsWidth, setDetailsWidth] = useState(DETAILS_PANEL_WIDTH);
  const openFiltersSwipe = useFilterSwipe("right", () => setSidebarOpen(true));
  const closeFiltersSwipe = useFilterSwipe("left", () => setSidebarOpen(false));
  const [zoom, setZoom] = useState(initialZoom);
  const { selectedPoiId, selectPoi, selectedPersonSlug, selectPerson } = useSelectedPoi(
    citySlug,
    initialSelectedPoiId,
    pois,
    initialPersonSlug,
    aliases,
  );
  const [previousSelectedPoiId, setPreviousSelectedPoiId] = useState(selectedPoiId);
  const [openRequestId, setOpenRequestId] = useState(0);
  const [searchPoiId, setSearchPoiId] = useState<string | null>(null);
  const visiblePois = filter.visible;
  const selectedPoi = selectedPoiId
    ? (searchPoiId === selectedPoiId ? pois : visiblePois).find((poi) => poi.id === selectedPoiId)
    : undefined;
  const searchExcluded = Boolean(selectedPoi && !visiblePois.includes(selectedPoi));
  // Selection changes the URL without a navigation, so the tab title follows it here.
  // Matches the page metadata and the root layout's "%s · Mira" template.
  const title = `${selectedPoi?.name ?? cityName} · Mira`;
  useEffect(() => {
    document.title = title;
  }, [title]);
  if (selectedPoiId !== previousSelectedPoiId) {
    setPreviousSelectedPoiId(selectedPoiId);
    setOpenRequestId((current) => current + 1);
    if (searchPoiId !== selectedPoiId) setSearchPoiId(null);
    if (selectedPoiId && !selectedPoi && pois.some((poi) => poi.id === selectedPoiId)) {
      setSelectedCategories(null);
    }
  }
  const updateCategories = (next: PoiCategory[]) => {
    setSelectedCategories(next);
    if (
      selectedPoi &&
      searchPoiId !== selectedPoiId &&
      categoryFilter(categoryDefinitions, pois, next).excludes(selectedPoi)
    ) {
      selectPoi(null);
    }
  };
  const markers = useMemo(
    () =>
      (searchExcluded && selectedPoi ? [...visiblePois, selectedPoi] : visiblePois).map((poi) => ({
        poi,
        color: filter.markerColor(poi),
      })),
    [filter, visiblePois, searchExcluded, selectedPoi],
  );
  const openPoi = (poiId: string) => {
    selectPoi(poiId);
    if (poiId === selectedPoiId) setOpenRequestId((current) => current + 1);
    setSidebarOpen((current) => (current === false ? false : null));
  };
  const searchPoi = (poi: Poi) => {
    setSearchPoiId(poi.id);
    openPoi(poi.id);
  };
  const detailsOpen = Boolean(selectedPoi || selectedPersonSlug);
  const shownDetailsWidth = Math.min(detailsWidth, Math.round(viewportWidth * DETAILS_MAX_SHARE));
  // From lg the filters stay beside the map, unless they and an open place would leave it too
  // little room; they come back when the place closes. A visitor's own choice still wins.
  const roomBesidePoi =
    viewportWidth - sidebarWidth - shownDetailsWidth >= viewportWidth * MAP_MIN_SHARE;
  const sidebarVisible = sidebarOpen ?? (sidebarBesideMap && (!detailsOpen || roomBesidePoi));
  if (sidebarVisible && !poisListed) setPoisListed(true);
  // Below lg, opening a place closes the filters, so they only ever cover the map beside it.
  const coveredArea: CoveredArea = {
    left: sidebarVisible ? sidebarWidth : 0,
    right: detailsOpen && !detailsAsSheet ? shownDetailsWidth : 0,
    bottom: detailsOpen && detailsAsSheet ? BOTTOM_SHEET_PEEK_RATIO : 0,
  };

  return (
    <div data-panel-container className="relative flex h-full w-full overflow-hidden">
      <Drawer
        id="discovery-sidebar"
        open={sidebarVisible}
        side="left"
        width={sidebarWidth}
        afterLeave={() => setPoisListed(false)}
        {...closeFiltersSwipe}
        className="z-30 touch-pan-y"
      >
        <Sidebar
          categoryDefinitions={categoryDefinitions}
          pois={pois}
          visiblePois={poisListed ? visiblePois : []}
          filter={filter}
          selectedPoiId={selectedPoiId}
          onToggleCategory={(category) => updateCategories(filter.toggle(category))}
          onSelectOnlyCategory={(category) => updateCategories(filter.selectOnly(category))}
          onToggleAll={() => updateCategories(filter.toggleAll())}
          onOpenPoi={openPoi}
          onSearchPoi={detailsAsSheet ? undefined : searchPoi}
          onClose={() => setSidebarOpen(false)}
        />
        <PanelResizeHandle edge="right" label="Resize filters panel" onResize={setSidebarWidth} />
      </Drawer>
      <div data-panel-container className="relative min-w-0 flex-1 overflow-hidden">
        {!sidebarVisible && (
          <DrawerTab
            label="Filters"
            aria-label="Open filters"
            aria-expanded={false}
            aria-controls="discovery-sidebar"
            {...openFiltersSwipe}
            onClick={() => setSidebarOpen(true)}
            className={detailsOpen ? "hidden md:block" : undefined}
          />
        )}
        {detailsAsSheet && (
          // Phones search from a bar over the map; the details sheet and filters cover it.
          <div className="absolute inset-x-2 top-2 z-10">
            <Search variant="floating" pois={pois} onSelect={searchPoi} />
          </div>
        )}
        <Map
          coordinates={coordinates}
          zoom={zoom}
          markers={markers}
          focusRequest={selectedPoi ? { poi: selectedPoi, requestId: openRequestId } : undefined}
          coveredArea={coveredArea}
          selectedPoiId={selectedPoiId}
          onZoomChange={setZoom}
          onOpenPoiDetails={openPoi}
          onMapClick={() => selectPoi(null)}
          onLoad={loadPreviews}
        />
        <DetailsPanel
          citySlug={citySlug}
          personSlug={selectedPersonSlug}
          onSelectPerson={selectPerson}
          openRequestId={openRequestId}
          poi={selectedPoi}
          excludedByFilters={searchExcluded}
          width={shownDetailsWidth}
          onResize={setDetailsWidth}
          onClose={() => selectPoi(null)}
          initialStory={initialStory}
        />
      </div>
    </div>
  );
};
