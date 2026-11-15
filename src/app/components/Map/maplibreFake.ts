// Test-only MapLibre replacement: `vi.mock("maplibre-gl", () => import("./maplibreFake"))`.
// It keeps sources, layers and events in memory and "renders" a place under the pointer
// when a test points at it, so tests can drive the map the way a visitor would.
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
  removed = false;
  styleUrl: string;
  sources = new Map<string, { data: { features: Feature[] } }>();
  layers = new Set<string>();
  images = new Set<string>();
  handlers = new Map<string, Handler[]>();
  /** Where the mouse is, in pixels; pins are drawn at their projected positions. */
  pointer: Point = { x: -1e9, y: -1e9 };

  constructor({
    container,
    center,
    style,
  }: {
    container: HTMLDivElement;
    center: [number, number];
    style: string;
  }) {
    this.container = container;
    this.center = center;
    this.styleUrl = style;
    container.append(this.canvas);
    fakeMaps.push(this);
  }

  addControl() {}
  easeTo(view: EaseToOptions) {
    cameraUpdates.push(view);
    if (view.center) this.center = view.center;
  }
  getCenter() {
    return this.center;
  }
  project([lng, lat]: [number, number]) {
    return { x: lng * 20000, y: -lat * 20000 };
  }
  getZoom() {
    return 15;
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
  addSource(id: string, { data }: { data: { features: Feature[] } }) {
    this.sources.set(id, { data });
  }
  getSource(id: string) {
    const source = this.sources.get(id);
    return source && { setData: (data: { features: Feature[] }) => (source.data = data) };
  }
  addLayer({ id }: { id: string }) {
    this.layers.add(id);
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
  /** Like MapLibre, matches whole pin images, shadow margin included, in no particular order. */
  queryRenderedFeatures(
    [[left, top], [right, bottom]]: [[number, number], [number, number]],
    { layers }: { layers: string[] },
  ) {
    if (!layers.some((id) => this.layers.has(id))) return [];
    return this.features().filter(({ geometry }) => {
      const tip = this.project(geometry.coordinates);
      return tip.x - 25 <= right && tip.x + 25 >= left && tip.y - 55 <= bottom && tip.y + 10 >= top;
    });
  }
  features() {
    return [...this.sources.values()].flatMap(({ data }) => data.features);
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

/** Places currently drawn as pins, by name. */
export const mapPins = () =>
  liveMap()
    .features()
    .map(
      ({ properties }) =>
        properties as { id: string; name: string; color: string; selected: boolean },
    );

export const mapPinNames = () => mapPins().map(({ name }) => name);
export const selectedMapPinName = () => mapPins().find(({ selected }) => selected)?.name;

/** A point on the head of a place's pin. */
export const mapPinHead = (name: string) => {
  const map = liveMap();
  const feature = map.features().find(({ properties }) => properties.name === name);
  if (!feature) throw new Error(`No pin for ${name}`);
  const tip = map.project(feature.geometry.coordinates);
  return { x: tip.x, y: tip.y - 25 };
};

const pointAt = (target: string | Point | null) => {
  const map = liveMap();
  map.pointer =
    target === null
      ? { x: -1e9, y: -1e9 }
      : typeof target === "string"
        ? mapPinHead(target)
        : target;
  return map;
};

/** Moves the mouse over a place's pin, a point, or empty map with `null`. */
export const hoverMapPin = (target: string | Point | null) =>
  act(() => pointAt(target).fire("mousemove"));
/** Clicks or taps a place's pin, a point, or empty map with `null`. */
export const clickMapPin = (target: string | Point | null) =>
  act(() => pointAt(target).fire("click"));
/** Moves the mouse off the map, optionally onto `to` (such as the preview popup). */
export const leaveMap = (to?: Element) =>
  act(() => pointAt(null).fire("mouseout", new MouseEvent("mouseout", { relatedTarget: to })));

export { FakeMap as Map, FakePopup as Popup, NavigationControl };
const maplibregl = { Map: FakeMap, Popup: FakePopup, NavigationControl };
export default maplibregl;
