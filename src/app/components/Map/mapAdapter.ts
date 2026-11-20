"use client";

import {
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type ExpressionSpecification,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type MapMouseEvent,
  type PointLike,
  type SymbolLayerSpecification,
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
import { preloadPreviewImage } from "./PoiPreviewCard";
import { isTouchOnly } from "@/app/viewport";

// MapLibre 6 ships its worker as a separate module; Next emits it as a hashed asset.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());

/** Our own copies of OpenFreeMap's Liberty (light) and Fiord (dark) styles, edited for Mira. */
const mapStyleUrl = (isDark: boolean) => `/map-styles/${isDark ? "dark" : "light"}.json`;
const PREVIEW_CLOSE_DELAY_MS = 180;
const POI_SOURCE = "pois";
const POI_LAYER = "poi-markers";
/** The selected place stays out of clusters, so focusing it never hides it in a bubble. */
const SELECTED_POI_SOURCE = "selected-poi";
const SELECTED_POI_LAYER = "selected-poi-marker";
const CLUSTER_LAYER = "poi-clusters";
const CLUSTER_COUNT_LAYER = "poi-cluster-counts";
const POI_LAYERS = [POI_LAYER, SELECTED_POI_LAYER];
/**
 * Pixels within which places share a bubble, the fewest places a bubble holds,
 * and the zoom from which they all stand apart.
 */
const CLUSTER_RADIUS = 34;
const CLUSTER_MIN_POINTS = 3;
const CLUSTER_MAX_ZOOM = 16;
/**
 * The header's atlas blue (--color-atlas) ties bubbles to the app palette;
 * on the dark map it moves to the ink so the bubble itself stays light.
 */
const ATLAS_COLOR = "#345568";
const clusterColors = (isDark: boolean) =>
  isDark
    ? { fill: "#fafafa" /* light --canvas, zinc-50 */, ink: ATLAS_COLOR }
    : { fill: ATLAS_COLOR, ink: "#fff" };
/** Bubbles open no preview, so only single pins on screen are warmed, nearest to the center first. */
const PRELOAD_IMAGE_LIMIT = 20;
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

/** Groups of public transport the visitor can show or hide on the basemap. */
export const TRANSPORT_MODES = ["metro", "surface", "train", "airport"] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];
/** The light style's layer for each group; the dark style draws no transport. */
const TRANSPORT_LAYERS: Record<TransportMode, string> = {
  metro: "poi_metro",
  surface: "poi_surface",
  train: "poi_train",
  airport: "airport",
};

/** A POI Marker to draw, in the color the Category Filter chose. */
export type PoiMarker = { poi: Poi; color: string };

export interface MapAdapter {
  mount: (container: HTMLDivElement) => void;
  updateView: (view: MapViewUpdate) => void;
  updatePois: (markers: PoiMarker[]) => void;
  updateSelectedPoi: (poiId: string | null) => void;
  updateHiddenTransport: (hidden: TransportMode[]) => void;
  focusPoi: (poi: Poi, coveredArea: CoveredArea) => void;
  getZoom: () => number | null;
  setOnZoomChange: (handler: ((zoom: number) => void) | null) => void;
  setOnOpenPoiDetails: (handler: ((poiId: string) => void) | null) => void;
  setOnMapClick: (handler: (() => void) | null) => void;
  /** Called once the map is first drawn completely: style, street map and places. */
  setOnLoad: (handler: (() => void) | null) => void;
  setOnPreviewChange: (handler: ((preview: MapPreview | null) => void) | null) => void;
  destroy: () => void;
}

export const createMapLibreAdapter = (initialView: MapView): MapAdapter => {
  let map: MapLibreMap | null = null;
  let markers: PoiMarker[] = [];
  let poisById = new Map<string, Poi>();
  let hoveredPoiId: string | null = null;
  let selectedPoiId: string | null = null;
  let hiddenTransport: TransportMode[] = [];
  let previewPopup: Popup | null = null;
  let previewContainer: HTMLDivElement | null = null;
  let activePreviewPoiId: string | null = null;
  let previewCloseTimeout: ReturnType<typeof setTimeout> | null = null;
  let unsubscribeFromTheme: (() => void) | null = null;
  let onZoomChange: ((zoom: number) => void) | null = null;
  let onOpenPoiDetails: ((poiId: string) => void) | null = null;
  let onMapClick: (() => void) | null = null;
  let onLoad: (() => void) | null = null;
  let onPreviewChange: ((preview: MapPreview | null) => void) | null = null;

  const poiAt = ({ x, y }: { x: number; y: number }) => {
    const layers = POI_LAYERS.filter((id) => map?.getLayer(id));
    if (!map || !layers.length) return undefined;
    const box: [PointLike, PointLike] = [
      [x - MARKER_HIT_SLOP, y - MARKER_HIT_SLOP],
      [x + MARKER_HIT_SLOP, y + MARKER_HIT_SLOP],
    ];
    // Image boxes include the transparent shadow margin, so measure each drawn marker instead.
    let best: { poi: Poi; distance: number; order: number } | undefined;
    for (const { properties } of map.queryRenderedFeatures(box, { layers })) {
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

  const clusterAt = (point: PointLike) =>
    map?.getLayer(CLUSTER_LAYER)
      ? map.queryRenderedFeatures(point, { layers: [CLUSTER_LAYER] })[0]
      : undefined;

  /** Zooms just far enough for the bubble's places to separate. */
  const expandCluster = async (cluster: MapGeoJSONFeature) => {
    const source = map?.getSource<GeoJSONSource>(POI_SOURCE);
    if (!source || cluster.geometry.type !== "Point") return;
    const zoom = await source.getClusterExpansionZoom(Number(cluster.properties.cluster_id));
    map?.easeTo({ center: cluster.geometry.coordinates as [number, number], zoom });
  };

  const handleMapClick = (event: MapMouseEvent) => {
    const poi = poiAt(event.point);
    const cluster = poi ? undefined : clusterAt(event.point);
    if (poi) openPoiDetails(poi.id);
    else if (cluster) void expandCluster(cluster);
    else onMapClick?.();
  };

  const setHoveredPoi = (poi: Poi | undefined) => {
    if (map) map.getCanvas().style.cursor = poi ? "pointer" : "";
    if (poi) openPreview(poi);
    else if (hoveredPoiId) schedulePreviewClose(hoveredPoiId);
    hoveredPoiId = poi?.id ?? null;
  };
  const handleMouseMove = (event: MapMouseEvent) => {
    const poi = poiAt(event.point);
    setHoveredPoi(poi);
    if (map && !poi && clusterAt(event.point)) map.getCanvas().style.cursor = "pointer";
  };
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

  const preloadVisiblePreviewImages = () => {
    const current = map;
    if (!current?.getLayer(POI_LAYER)) return;
    const center = current.project(current.getCenter());
    const distanceToCenter = ({ coordinates }: Poi) => {
      const { x, y } = current.project([coordinates.lng, coordinates.lat]);
      return Math.hypot(x - center.x, y - center.y);
    };
    current
      .queryRenderedFeatures({ layers: [POI_LAYER] })
      .flatMap(({ properties }) => poisById.get(String(properties.id)) ?? [])
      .sort((a, b) => distanceToCenter(a) - distanceToCenter(b))
      .slice(0, PRELOAD_IMAGE_LIMIT)
      .forEach(preloadPreviewImage);
  };

  /** Markers are drawn by the GPU, so moving the map never touches the DOM. */
  const renderPois = () => {
    const source = map?.getSource<GeoJSONSource>(POI_SOURCE);
    const selectedSource = map?.getSource<GeoJSONSource>(SELECTED_POI_SOURCE);
    if (!source || !selectedSource) return;
    const features = markers.map(({ poi, color }, index) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [poi.coordinates.lng, poi.coordinates.lat],
      },
      properties: {
        id: poi.id,
        name: poi.name,
        color,
        selected: poi.id === selectedPoiId,
        // Draw order, which hover and taps follow when markers overlap; selected on top.
        order: poi.id === selectedPoiId ? markers.length : index,
      },
    }));
    source.setData({
      type: "FeatureCollection",
      features: features.filter(({ properties }) => !properties.selected),
    });
    selectedSource.setData({
      type: "FeatureCollection",
      features: features.filter(({ properties }) => properties.selected),
    });
  };

  const showTransport = () => {
    if (!map) return;
    for (const mode of TRANSPORT_MODES) {
      const layer = TRANSPORT_LAYERS[mode];
      if (!map.getLayer(layer)) continue;
      const visibility = hiddenTransport.includes(mode) ? "none" : "visible";
      map.setLayoutProperty(layer, "visibility", visibility);
    }
  };

  const addPoiLayer = () => {
    if (!map || map.getSource(POI_SOURCE)) return;
    const empty = { type: "FeatureCollection" as const, features: [] };
    const clusters = clusterColors(isDarkTheme());
    // Nearby places merge into count bubbles until they have room to stand apart.
    map.addSource(POI_SOURCE, {
      type: "geojson",
      data: empty,
      cluster: true,
      clusterRadius: CLUSTER_RADIUS,
      clusterMinPoints: CLUSTER_MIN_POINTS,
      clusterMaxZoom: CLUSTER_MAX_ZOOM,
    });
    map.addSource(SELECTED_POI_SOURCE, { type: "geojson", data: empty });
    const selected: ExpressionSpecification = ["get", "selected"];
    const isCluster: ExpressionSpecification = ["has", "point_count"];
    const pinLayer = (id: string, source: string): SymbolLayerSpecification => ({
      id,
      type: "symbol",
      source,
      filter: ["!", isCluster],
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
    map.addLayer(pinLayer(POI_LAYER, POI_SOURCE));
    map.addLayer({
      id: CLUSTER_LAYER,
      type: "circle",
      source: POI_SOURCE,
      filter: isCluster,
      paint: {
        // Small bubbles hint at more places without outweighing the markers.
        "circle-color": clusters.fill,
        "circle-opacity": 0.95,
        "circle-radius": ["step", ["get", "point_count"], 13, 10, 16, 30, 20],
        "circle-stroke-color": clusters.ink,
        "circle-stroke-width": 2,
      },
    });
    map.addLayer({
      id: CLUSTER_COUNT_LAYER,
      type: "symbol",
      source: POI_SOURCE,
      filter: isCluster,
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        // Both map styles serve this font.
        "text-font": ["Noto Sans Regular"],
        "text-size": 13,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: { "text-color": clusters.ink },
    });
    map.addLayer(pinLayer(SELECTED_POI_LAYER, SELECTED_POI_SOURCE));
    renderPois();
  };

  return {
    mount(container) {
      if (map) {
        return;
      }

      map = new MapLibreMap({
        container,
        style: mapStyleUrl(isDarkTheme()),
        // MapLibre needs absolute sprite URLs; our styles point at Mira's icons by path.
        transformStyle: (_previous, style) =>
          Array.isArray(style.sprite)
            ? {
                ...style,
                sprite: style.sprite.map((sprite) => ({
                  ...sprite,
                  url: new URL(sprite.url, window.location.href).href,
                })),
              }
            : style,
        center: initialView.center,
        zoom: initialView.zoom,
        minZoom: 9,
        maxZoom: 21,
      });
      // Without the compass button on touch screens, a rotated map could not be reset to north.
      const touchOnly = isTouchOnly();
      if (touchOnly) {
        map.touchZoomRotate.disableRotation();
        map.touchPitch.disable();
      }
      // Tiles wait for this before drawing, on every style, so markers are in place by `load`.
      const styledMap = map;
      map.setMissingStyleImageResolver(async (id) => {
        const marker = (await loadMarkerImages()).find((image) => image.id === id);
        if (marker && map === styledMap && !map.hasImage(id)) {
          map.addImage(id, marker.image, { pixelRatio: marker.pixelRatio });
        }
      });
      // A style swap drops the markers' source and layer; the popup is a DOM overlay.
      unsubscribeFromTheme = subscribeToDarkTheme((isDark) => map?.setStyle(mapStyleUrl(isDark)));
      map.on("style.load", () => {
        addPoiLayer();
        showTransport();
      });

      const navigationControl = new NavigationControl();
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
      previewPopup = new Popup({
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
        onLoad?.();
      });
      map.on("click", handleMapClick);
      map.on("mousemove", handleMouseMove);
      // idle fires once the map settles, so panning and zooming never start downloads.
      // Touch-only screens never show the hover card, so they skip its images.
      if (!touchOnly) map.on("idle", preloadVisiblePreviewImages);
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
    updateHiddenTransport(hidden) {
      hiddenTransport = hidden;
      showTransport();
    },
    updateSelectedPoi(poiId) {
      selectedPoiId = poiId;
      renderPois();
    },
    focusPoi(poi, { left, right, bottom }) {
      if (!map) return;
      closePreview();
      const center: [number, number] = [poi.coordinates.lng, poi.coordinates.lat];
      // The middle of the map area left uncovered by panels. Unlike easeTo's padding,
      // anchoring there does not persist into later zooms.
      const { clientWidth, clientHeight } = map.getContainer();
      const visibleCenter: [number, number] = [
        (clientWidth + left - right) / 2,
        (clientHeight * (1 - bottom)) / 2,
      ];
      const target = map.project(center);
      const distance = Math.hypot(target.x - visibleCenter[0], target.y - visibleCenter[1]);
      map.easeTo({
        ...map.calculateAnchoredCameraOptions({
          anchorLocation: center,
          anchorScreenPoint: visibleCenter,
        }),
        duration: Math.min(1150, Math.max(600, distance * 1.1)),
        easing: (progress) => progress * progress * (3 - 2 * progress),
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
    setOnLoad(handler) {
      onLoad = handler;
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
