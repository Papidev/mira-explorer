"use client";

import maplibregl, {
  Map as MapLibreMap,
  type ExpressionSpecification,
  type GeoJSONSource,
  type MapMouseEvent,
  type PointLike,
} from "maplibre-gl";
import type { Poi } from "@/types/Poi";
import { isDarkTheme, subscribeToDarkTheme } from "@/app/theme";
import {
  loadMarkerImages,
  MARKER_HEIGHT,
  MARKER_POPUP_OFFSET,
  MARKER_TIP_OFFSET,
  MARKER_WIDTH,
  SELECTED_MARKER_SCALE,
} from "./markerImages";

const mapStyleUrl = (isDark: boolean) =>
  `https://tiles.openfreemap.org/styles/${isDark ? "fiord" : "liberty"}`;

/** Fiord's street and place names are too faint; lift every label to near-white. */
const brightenDarkLabels = (map: MapLibreMap) => {
  for (const layer of map.getStyle().layers) {
    if (layer.type !== "symbol" || !layer.layout?.["text-field"]) continue;
    map.setPaintProperty(layer.id, "text-color", "hsl(210, 30%, 88%)");
    map.setPaintProperty(layer.id, "text-halo-color", "hsl(222, 35%, 14%)");
    map.setPaintProperty(layer.id, "text-halo-width", 1.5);
  }
};
const PREVIEW_CLOSE_DELAY_MS = 180;
const POI_SOURCE = "pois";
const POI_LAYER = "poi-markers";
/** Markers react a little beyond their outline, which keeps them easy to tap. */
const MARKER_HIT_SLOP = 8;

export type MapView = {
  center: [number, number];
  zoom: number;
};

export type MapViewUpdate = {
  center?: [number, number];
  zoom?: number;
};

/** Map edges hidden by panels: left and right in pixels, bottom as a share of the map height. */
export type CoveredArea = { left: number; right: number; bottom: number };

export type MapPreview = {
  poi: Poi;
  container: HTMLDivElement;
  onOpenDetails: () => void;
};

/** A POI Marker to draw, in the color the Category Filter chose. */
export type PoiMarker = { poi: Poi; color: string };

export interface MapAdapter {
  mount: (container: HTMLDivElement) => void;
  updateView: (view: MapViewUpdate) => void;
  updatePois: (markers: PoiMarker[]) => void;
  updateSelectedPoi: (poiId: string | null) => void;
  focusPoi: (poi: Poi, coveredArea: CoveredArea) => void;
  getZoom: () => number | null;
  setOnZoomChange: (handler: ((zoom: number) => void) | null) => void;
  setOnOpenPoiDetails: (handler: ((poiId: string) => void) | null) => void;
  setOnMapClick: (handler: (() => void) | null) => void;
  setOnPreviewChange: (handler: ((preview: MapPreview | null) => void) | null) => void;
  destroy: () => void;
}

export const createMapLibreAdapter = (initialView: MapView): MapAdapter => {
  let map: MapLibreMap | null = null;
  let markers: PoiMarker[] = [];
  let poisById = new Map<string, Poi>();
  let hoveredPoiId: string | null = null;
  let selectedPoiId: string | null = null;
  let previewPopup: maplibregl.Popup | null = null;
  let previewContainer: HTMLDivElement | null = null;
  let activePreviewPoiId: string | null = null;
  let previewCloseTimeout: ReturnType<typeof setTimeout> | null = null;
  let unsubscribeFromTheme: (() => void) | null = null;
  let onZoomChange: ((zoom: number) => void) | null = null;
  let onOpenPoiDetails: ((poiId: string) => void) | null = null;
  let onMapClick: (() => void) | null = null;
  let onPreviewChange: ((preview: MapPreview | null) => void) | null = null;

  const poiAt = ({ x, y }: { x: number; y: number }) => {
    if (!map?.getLayer(POI_LAYER)) return undefined;
    const box: [PointLike, PointLike] = [
      [x - MARKER_HIT_SLOP, y - MARKER_HIT_SLOP],
      [x + MARKER_HIT_SLOP, y + MARKER_HIT_SLOP],
    ];
    // Image boxes include the transparent shadow margin, so measure each drawn marker instead.
    let best: { poi: Poi; distance: number; order: number } | undefined;
    for (const { properties } of map.queryRenderedFeatures(box, { layers: [POI_LAYER] })) {
      const poi = poisById.get(String(properties.id));
      if (!poi) continue;
      const tip = map.project([poi.coordinates.lng, poi.coordinates.lat]);
      const scale = poi.id === selectedPoiId ? SELECTED_MARKER_SCALE : 1;
      const dx = Math.max(Math.abs(x - tip.x) - (MARKER_WIDTH / 2) * scale, 0);
      const dy = Math.max(tip.y - MARKER_HEIGHT * scale - y, y - tip.y, 0);
      const distance = Math.hypot(dx, dy);
      const order = Number(properties.order);
      // Markers under the pointer win, the one drawn on top first; otherwise the nearest.
      if (
        distance <= MARKER_HIT_SLOP &&
        (!best || distance < best.distance || (distance === best.distance && order > best.order))
      ) {
        best = { poi, distance, order };
      }
    }
    return best?.poi;
  };

  const handleMapClick = (event: MapMouseEvent) => {
    const poi = poiAt(event.point);
    if (poi) openPoiDetails(poi.id);
    else onMapClick?.();
  };

  const setHoveredPoi = (poi: Poi | undefined) => {
    if (map) map.getCanvas().style.cursor = poi ? "pointer" : "";
    if (poi) openPreview(poi);
    else if (hoveredPoiId) schedulePreviewClose(hoveredPoiId);
    hoveredPoiId = poi?.id ?? null;
  };
  const handleMouseMove = (event: MapMouseEvent) => setHoveredPoi(poiAt(event.point));
  const handleMouseOut = ({ originalEvent }: MapMouseEvent) => {
    // The preview covers its marker; the popup's own pointerleave closes it from there.
    const to = originalEvent.relatedTarget;
    if (to instanceof Node && previewPopup?.getElement()?.contains(to)) hoveredPoiId = null;
    setHoveredPoi(undefined);
  };

  const cancelPreviewClose = () => {
    if (previewCloseTimeout) {
      clearTimeout(previewCloseTimeout);
      previewCloseTimeout = null;
    }
  };

  const closePreview = (poiId?: string) => {
    if (poiId && activePreviewPoiId !== poiId) {
      return;
    }

    cancelPreviewClose();
    const popupElement = previewPopup?.getElement();
    popupElement?.removeEventListener("pointerenter", handlePreviewPointerEnter);
    popupElement?.removeEventListener("pointerleave", handlePreviewPointerLeave);
    popupElement?.removeEventListener("click", handlePreviewClick);
    popupElement?.removeEventListener("wheel", handlePreviewWheel);
    previewPopup?.remove();
    if (activePreviewPoiId !== null) {
      onPreviewChange?.(null);
    }
    activePreviewPoiId = null;
  };

  const schedulePreviewClose = (poiId?: string) => {
    cancelPreviewClose();
    previewCloseTimeout = setTimeout(() => {
      previewCloseTimeout = null;
      closePreview(poiId);
    }, PREVIEW_CLOSE_DELAY_MS);
  };

  const handlePreviewPointerEnter = () => cancelPreviewClose();
  const handlePreviewPointerLeave = () => schedulePreviewClose(activePreviewPoiId ?? undefined);
  const handlePreviewClick = (event: MouseEvent) => {
    if (!activePreviewPoiId) return;
    event.stopPropagation();
    openPoiDetails(activePreviewPoiId);
  };
  // MapLibre mounts popups outside the canvas container that owns scroll zoom.
  const handlePreviewWheel = (event: WheelEvent) => {
    event.preventDefault();
    map?.getCanvasContainer().dispatchEvent(new WheelEvent(event.type, event));
  };
  const handlePreviewFocusIn = () => cancelPreviewClose();
  const handlePreviewFocusOut = (event: FocusEvent) => {
    if (!previewContainer?.contains(event.relatedTarget as Node | null)) {
      schedulePreviewClose(activePreviewPoiId ?? undefined);
    }
  };

  const openPoiDetails = (poiId: string) => {
    closePreview();
    onOpenPoiDetails?.(poiId);
  };

  const openPreview = (poi: Poi) => {
    if (!map || !previewPopup || !previewContainer) {
      return;
    }

    cancelPreviewClose();
    if (activePreviewPoiId === poi.id) return;
    const isPreviewOpen = activePreviewPoiId !== null;
    activePreviewPoiId = poi.id;
    onPreviewChange?.({
      poi,
      container: previewContainer,
      onOpenDetails: () => openPoiDetails(poi.id),
    });
    previewPopup.setLngLat([poi.coordinates.lng, poi.coordinates.lat]);
    if (!isPreviewOpen) previewPopup.addTo(map);
    const popupElement = previewPopup.getElement();
    // The MapLibre tip is outside the React card but still receives pointer events.
    popupElement.addEventListener("pointerenter", handlePreviewPointerEnter);
    popupElement.addEventListener("pointerleave", handlePreviewPointerLeave);
    popupElement.addEventListener("click", handlePreviewClick);
    popupElement.addEventListener("wheel", handlePreviewWheel, { passive: false });
    const popupContent = popupElement.querySelector<HTMLElement>(".maplibregl-popup-content");
    popupElement.style.pointerEvents = "auto";
    if (popupContent) {
      popupContent.style.overflow = "hidden";
      popupContent.style.borderRadius = "var(--radius-xl)";
      popupContent.style.background = "transparent";
      popupContent.style.padding = "0";
      popupContent.style.boxShadow = "var(--shadow-xl)";
      popupContent.style.pointerEvents = "auto";
    }
  };

  /** Markers are drawn by the GPU, so moving the map never touches the DOM. */
  const renderPois = () => {
    const source = map?.getSource<GeoJSONSource>(POI_SOURCE);
    if (!source) return;
    source.setData({
      type: "FeatureCollection",
      features: markers.map(({ poi, color }, index) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [poi.coordinates.lng, poi.coordinates.lat] },
        properties: {
          id: poi.id,
          name: poi.name,
          color,
          selected: poi.id === selectedPoiId,
          // Draw order, which hover and taps follow when markers overlap; selected on top.
          order: poi.id === selectedPoiId ? markers.length : index,
        },
      })),
    });
  };

  const addPoiLayer = () => {
    if (!map || map.getSource(POI_SOURCE)) return;
    map.addSource(POI_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    const selected: ExpressionSpecification = ["get", "selected"];
    map.addLayer({
      id: POI_LAYER,
      type: "symbol",
      source: POI_SOURCE,
      layout: {
        // Matches markerImageId(color, selected).
        "icon-image": [
          "concat",
          "poi-marker-",
          ["get", "color"],
          ["case", selected, "-selected", ""],
        ],
        "icon-size": ["case", selected, SELECTED_MARKER_SCALE, 1],
        "icon-anchor": "bottom",
        "icon-offset": [0, MARKER_TIP_OFFSET],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        // Hover and taps hit the marker itself, not a padded box over its neighbors.
        "icon-padding": 0,
        "symbol-sort-key": ["get", "order"],
      },
    });
    renderPois();
    const styledMap = map;
    loadMarkerImages().then(
      (images) => {
        if (map !== styledMap || !map.getSource(POI_SOURCE)) return;
        for (const { id, image, pixelRatio } of images) {
          if (!map.hasImage(id)) map.addImage(id, image, { pixelRatio });
        }
      },
      () => {},
    );
  };

  return {
    mount(container) {
      if (map) {
        return;
      }

      map = new maplibregl.Map({
        container,
        style: mapStyleUrl(isDarkTheme()),
        center: initialView.center,
        zoom: initialView.zoom,
        minZoom: 9,
        maxZoom: 21,
      });
      // Without the compass button on touch screens, a rotated map could not be reset to north.
      if (window.matchMedia?.("(hover: none) and (pointer: coarse)").matches) {
        map.touchZoomRotate.disableRotation();
        map.touchPitch.disable();
      }
      // A style swap drops the markers' source, layer and images; the popup is a DOM overlay.
      unsubscribeFromTheme = subscribeToDarkTheme((isDark) => map?.setStyle(mapStyleUrl(isDark)));
      map.on("style.load", () => {
        if (map && isDarkTheme()) brightenDarkLabels(map);
        addPoiLayer();
      });

      const navigationControl = new maplibregl.NavigationControl();
      const zoomValue = document.createElement("output");
      zoomValue.className = "map-zoom-value";
      zoomValue.setAttribute("aria-label", "Zoom level");
      const updateZoomValue = () => {
        if (map) zoomValue.value = map.getZoom().toFixed(2);
      };
      map.addControl(
        {
          onAdd: (map) => {
            const container = navigationControl.onAdd(map);
            container.append(zoomValue);
            updateZoomValue();
            map.on("zoom", updateZoomValue);
            return container;
          },
          onRemove: () => {
            map?.off("zoom", updateZoomValue);
            navigationControl.onRemove();
          },
        },
        "top-right",
      );
      previewContainer = document.createElement("div");
      previewContainer.addEventListener("focusin", handlePreviewFocusIn);
      previewContainer.addEventListener("focusout", handlePreviewFocusOut);
      previewPopup = new maplibregl.Popup({
        className: "poi-preview-popup cursor-pointer",
        closeButton: false,
        closeOnClick: false,
        focusAfterOpen: false,
        maxWidth: "calc(100vw - 2rem)",
        offset: MARKER_POPUP_OFFSET,
      }).setDOMContent(previewContainer);
      map.on("zoomend", () => {
        if (!map || !onZoomChange) {
          return;
        }
        onZoomChange(map.getZoom());
      });
      map.once("load", () => {
        for (const layer of map?.getStyle().layers ?? []) {
          if (layer.type !== "symbol" || layer["source-layer"] !== "poi") {
            continue;
          }

          map?.setFilter(layer.id, [
            "all",
            // Liberty uses expression filters; preserve its geometry and zoom-rank restrictions.
            (layer.filter as ExpressionSpecification | undefined) ?? true,
            [
              "any",
              [
                "match",
                ["get", "class"],
                [
                  "museum",
                  "monument",
                  "memorial",
                  "castle",
                  "archaeological_site",
                  "place_of_worship",
                  "theatre",
                ],
                true,
                false,
              ],
              [
                "match",
                ["get", "subclass"],
                ["artwork", "gallery", "arts_centre", "library"],
                true,
                false,
              ],
            ],
          ]);
        }
      });
      map.on("click", handleMapClick);
      map.on("mousemove", handleMouseMove);
      map.on("mouseout", handleMouseOut);
    },
    updateView(view) {
      if (!map) {
        return;
      }

      const nextView: { center?: [number, number]; zoom?: number } = {};

      if (view.center) {
        nextView.center = view.center;
      }

      if (view.zoom !== undefined) {
        nextView.zoom = view.zoom;
      }

      if (Object.keys(nextView).length === 0) {
        return;
      }

      map.easeTo(nextView);
    },
    updatePois(nextMarkers) {
      markers = nextMarkers;
      poisById = new Map(nextMarkers.map(({ poi }) => [poi.id, poi]));
      if (activePreviewPoiId && !poisById.has(activePreviewPoiId)) closePreview();
      renderPois();
    },
    updateSelectedPoi(poiId) {
      selectedPoiId = poiId;
      renderPois();
    },
    focusPoi(poi, { left, right, bottom }) {
      if (!map) return;
      closePreview();
      const center: [number, number] = [poi.coordinates.lng, poi.coordinates.lat];
      // An offset, unlike easeTo's padding, does not persist into later zooms.
      const offsetX = (left - right) / 2;
      const coveredBelow = bottom * map.getContainer().clientHeight;
      const offsetY = coveredBelow ? -coveredBelow / 2 : 0;
      const target = map.project(center);
      const current = map.project(map.getCenter());
      const distance = Math.hypot(target.x - current.x - offsetX, target.y - current.y - offsetY);
      map.easeTo({
        center,
        duration: Math.min(1150, Math.max(600, distance * 1.1)),
        easing: (progress) => progress * progress * (3 - 2 * progress),
        offset: [offsetX, offsetY],
      });
    },
    getZoom() {
      return map ? map.getZoom() : null;
    },
    setOnZoomChange(handler) {
      onZoomChange = handler;
    },
    setOnOpenPoiDetails(handler) {
      onOpenPoiDetails = handler;
    },
    setOnMapClick(handler) {
      onMapClick = handler;
    },
    setOnPreviewChange(handler) {
      onPreviewChange = handler;
    },
    destroy() {
      unsubscribeFromTheme?.();
      unsubscribeFromTheme = null;
      closePreview();
      previewContainer?.removeEventListener("focusin", handlePreviewFocusIn);
      previewContainer?.removeEventListener("focusout", handlePreviewFocusOut);
      previewContainer = null;
      previewPopup?.remove();
      previewPopup = null;
      map?.remove();
      map = null;
      markers = [];
      poisById = new Map();
      hoveredPoiId = null;
    },
  };
};
