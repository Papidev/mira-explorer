// Test-only MapLibre replacement: `vi.mock("maplibre-gl", () => import("./maplibreFake"))`.
// It keeps sources, layers and events in memory and "renders" a place under the pointer
// when a test points at it, so tests can drive the map the way a visitor would.
import { act } from "@testing-library/react";
import type { EaseToOptions } from "maplibre-gl";

type Feature = { properties: Record<string, unknown> };
type Handler = (event: { point: { x: number; y: number }; originalEvent?: Event }) => void;

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
  /** The place a test points at; queryRenderedFeatures returns it while it is drawn. */
  pointedPoiId: string | null = null;

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
  queryRenderedFeatures(_box: unknown, { layers }: { layers: string[] }) {
    if (!layers.some((id) => this.layers.has(id))) return [];
    return this.features().filter(({ properties }) => properties.id === this.pointedPoiId);
  }
  features() {
    return [...this.sources.values()].flatMap(({ data }) => data.features);
  }
  fire(type: string, originalEvent?: Event) {
    this.handlers
      .get(type)
      ?.forEach((handler) => handler({ point: { x: 0, y: 0 }, originalEvent }));
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

const pointAt = (name: string | null) => {
  const map = liveMap();
  const pin = name === null ? undefined : mapPins().find((pin) => pin.name === name);
  if (name !== null && !pin) throw new Error(`No pin for ${name}`);
  map.pointedPoiId = pin?.id ?? null;
  return map;
};

/** Moves the mouse over a place's pin, or over empty map with `null`. */
export const hoverMapPin = (name: string | null) => act(() => pointAt(name).fire("mousemove"));
/** Clicks or taps a place's pin, or empty map with `null`. */
export const clickMapPin = (name: string | null) => act(() => pointAt(name).fire("click"));
/** Moves the mouse off the map, optionally onto `to` (such as the preview popup). */
export const leaveMap = (to?: Element) =>
  act(() => pointAt(null).fire("mouseout", new MouseEvent("mouseout", { relatedTarget: to })));

export { FakeMap as Map, FakePopup as Popup, NavigationControl };
const maplibregl = { Map: FakeMap, Popup: FakePopup, NavigationControl };
export default maplibregl;
