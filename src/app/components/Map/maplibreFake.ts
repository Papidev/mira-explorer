// Test-only MapLibre replacement: `vi.mock("maplibre-gl", () => import("./maplibreFake"))`.
// It keeps sources, layers and events in memory and "renders" a place under the pointer
// when a test points at it, so tests can drive the map the way a visitor would.
// Clustered sources merge places drawn closer than their cluster radius into one bubble.
import { act } from "@testing-library/react";
import type { EaseToOptions } from "maplibre-gl";

type Point = { x: number; y: number };
type Feature = {
  geometry: { coordinates: [number, number] };
  properties: Record<string, unknown>;
};
type Handler = (event: { point: Point; originalEvent?: Event }) => void;

export const fakeMaps: FakeMap[] = [];
export const fakePopups: FakePopup[] = [];
export const cameraUpdates: EaseToOptions[] = [];

class FakeMap {
  container: HTMLDivElement;
  canvas = document.createElement("canvas");
  center: EaseToOptions["center"];
  zoom: number;
  removed = false;
  styleUrl: string;
  sources = new Map<
    string,
    {
      data: { features: Feature[] };
      cluster?: { radius: number; minPoints: number; maxZoom: number };
    }
  >();
  /** Layer ids, with whether each draws bubbles rather than single places. */
  layers = new Map<string, { drawsClusters: boolean }>();
  images = new Set<string>();
  handlers = new Map<string, Handler[]>();
  /** Where the mouse is, in pixels; markers are drawn at their projected positions. */
  pointer: Point = { x: -1e9, y: -1e9 };

  constructor({
    container,
    center,
    zoom,
    style,
  }: {
    container: HTMLDivElement;
    center: [number, number];
    zoom: number;
    style: string;
  }) {
    this.container = container;
    this.center = center;
    this.zoom = zoom;
    this.styleUrl = style;
    container.append(this.canvas);
    fakeMaps.push(this);
  }

  addControl() {}
  easeTo(view: EaseToOptions) {
    cameraUpdates.push(view);
    if (view.center) this.center = view.center;
    if (view.zoom !== undefined) this.zoom = view.zoom;
  }
  getCenter() {
    return this.center;
  }
  project([lng, lat]: [number, number]) {
    return { x: lng * 20000, y: -lat * 20000 };
  }
  getZoom() {
    return this.zoom;
  }
  getContainer() {
    return this.container;
  }
  getCanvas() {
    return this.canvas;
  }
  getCanvasContainer() {
    return this.container;
  }
  getStyle() {
    return { layers: [] };
  }
  /** The style counts as loaded, so style.load handlers run at once and on every swap. */
  setStyle(url: string) {
    this.styleUrl = url;
    this.sources.clear();
    this.layers.clear();
    this.images.clear();
    this.handlers.get("style.load")?.forEach((handler) => handler({ point: { x: 0, y: 0 } }));
  }
  on(type: string, handler: Handler) {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler]);
    if (type === "style.load") handler({ point: { x: 0, y: 0 } });
  }
  off() {}
  once(type: string, handler: () => void) {
    if (type === "load") handler();
  }
  addSource(
    id: string,
    {
      data,
      cluster,
      clusterRadius = 50,
      clusterMinPoints = 2,
      clusterMaxZoom = 14,
    }: {
      data: { features: Feature[] };
      cluster?: boolean;
      clusterRadius?: number;
      clusterMinPoints?: number;
      clusterMaxZoom?: number;
    },
  ) {
    this.sources.set(id, {
      data,
      cluster: cluster
        ? { radius: clusterRadius, minPoints: clusterMinPoints, maxZoom: clusterMaxZoom }
        : undefined,
    });
  }
  getSource(id: string) {
    const source = this.sources.get(id);
    return (
      source && {
        setData: (data: { features: Feature[] }) => (source.data = data),
        // Bubbles in this fake only separate past the source's cluster max zoom.
        getClusterExpansionZoom: async () => (source.cluster?.maxZoom ?? this.zoom) + 1,
      }
    );
  }
  addLayer({ id, filter }: { id: string; filter?: unknown }) {
    this.layers.set(id, { drawsClusters: JSON.stringify(filter) === '["has","point_count"]' });
  }
  getLayer(id: string) {
    return this.layers.has(id) ? { id } : undefined;
  }
  hasImage(id: string) {
    return this.images.has(id);
  }
  addImage(id: string) {
    this.images.add(id);
  }
  /** Like MapLibre, matches whole marker images, shadow margin included, in no particular order. */
  queryRenderedFeatures(
    area: Point | [[number, number], [number, number]],
    { layers }: { layers: string[] },
  ) {
    const [[left, top], [right, bottom]] = Array.isArray(area)
      ? area
      : [
          [area.x, area.y],
          [area.x, area.y],
        ];
    const drawn = layers.flatMap((id) => this.layers.get(id) ?? []);
    if (!drawn.length) return [];
    const wantsClusters = drawn.some(({ drawsClusters }) => drawsClusters);
    const isCluster = ({ properties }: Feature) => "point_count" in properties;
    return this.features().filter((feature) => {
      if (isCluster(feature) !== wantsClusters) return false;
      const { geometry } = feature;
      const tip = this.project(geometry.coordinates);
      return tip.x - 25 <= right && tip.x + 25 >= left && tip.y - 55 <= bottom && tip.y + 10 >= top;
    });
  }
  /** Single places and bubbles as drawn now; a bubble sits on its first place. */
  features() {
    return [...this.sources.values()].flatMap(({ data, cluster }) => {
      if (!cluster || this.zoom > cluster.maxZoom) return data.features;
      const groups: Feature[][] = [];
      for (const feature of data.features) {
        const at = this.project(feature.geometry.coordinates);
        const group = groups.find(([first]) => {
          const other = this.project(first.geometry.coordinates);
          return Math.hypot(at.x - other.x, at.y - other.y) < cluster.radius;
        });
        if (group) group.push(feature);
        else groups.push([feature]);
      }
      return groups.flatMap((group, index) =>
        group.length < cluster.minPoints
          ? group
          : {
              geometry: group[0].geometry,
              properties: { cluster_id: index, point_count: group.length },
            },
      );
    });
  }
  fire(type: string, originalEvent?: Event) {
    this.handlers.get(type)?.forEach((handler) => handler({ point: this.pointer, originalEvent }));
  }
  remove() {
    this.removed = true;
    this.canvas.remove();
  }
}

class FakePopup {
  container = document.createElement("div");
  tip = document.createElement("div");
  content = document.createElement("div");
  element?: HTMLElement;
  isOpen = false;
  positions: string[] = [];
  additions = 0;

  constructor() {
    this.content.className = "maplibregl-popup-content";
    this.container.append(this.tip, this.content);
    fakePopups.push(this);
  }

  setDOMContent(element: HTMLElement) {
    this.element = element;
    this.content.append(element);
    return this;
  }
  setLngLat() {
    this.positions.push(this.element?.textContent ?? "");
    return this;
  }
  addTo(map: FakeMap) {
    this.additions += 1;
    map.getContainer().append(this.container);
    this.isOpen = true;
    return this;
  }
  getElement() {
    return this.container;
  }
  remove() {
    this.container.remove();
    this.isOpen = false;
    return this;
  }
}

class NavigationControl {}

export const resetMapLibreFakes = () => {
  fakeMaps.length = 0;
  fakePopups.length = 0;
  cameraUpdates.length = 0;
};

const liveMap = () => {
  const map = fakeMaps.findLast(({ removed }) => !removed);
  if (!map) throw new Error("No mounted map");
  return map;
};

/** Places currently drawn as markers, by name; places inside bubbles are not drawn. */
export const mapMarkers = () =>
  liveMap()
    .features()
    .filter(({ properties }) => !("point_count" in properties))
    .map(
      ({ properties }) =>
        properties as { id: string; name: string; color: string; selected: boolean },
    );

export const mapMarkerNames = () => mapMarkers().map(({ name }) => name);
export const selectedMapMarkerName = () => mapMarkers().find(({ selected }) => selected)?.name;

/** A point on the head of a place's marker. */
export const mapMarkerHead = (name: string) => {
  const map = liveMap();
  const feature = map.features().find(({ properties }) => properties.name === name);
  if (!feature) throw new Error(`No marker for ${name}`);
  const tip = map.project(feature.geometry.coordinates);
  return { x: tip.x, y: tip.y - 25 };
};

/** Count bubbles currently drawn, with a point on each to click. */
export const mapClusters = () => {
  const map = liveMap();
  return map
    .features()
    .filter(({ properties }) => "point_count" in properties)
    .map(({ geometry, properties }) => ({
      count: Number(properties.point_count),
      point: map.project(geometry.coordinates),
    }));
};

const pointAt = (target: string | Point | null) => {
  const map = liveMap();
  map.pointer =
    target === null
      ? { x: -1e9, y: -1e9 }
      : typeof target === "string"
        ? mapMarkerHead(target)
        : target;
  return map;
};

/** Moves the mouse over a place's marker, a point, or empty map with `null`. */
export const hoverMapMarker = (target: string | Point | null) =>
  act(() => pointAt(target).fire("mousemove"));
/** Clicks or taps a place's marker, a point, or empty map with `null`. */
export const clickMapMarker = (target: string | Point | null) =>
  act(() => pointAt(target).fire("click"));
/** Moves the mouse off the map, optionally onto `to` (such as the preview popup). */
export const leaveMap = (to?: Element) =>
  act(() => pointAt(null).fire("mouseout", new MouseEvent("mouseout", { relatedTarget: to })));

export { FakeMap as Map, FakePopup as Popup, NavigationControl };
const maplibregl = { Map: FakeMap, Popup: FakePopup, NavigationControl };
export default maplibregl;
