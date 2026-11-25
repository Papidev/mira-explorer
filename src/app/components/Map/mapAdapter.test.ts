// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { createElement, StrictMode } from "react";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Poi } from "@/types/Poi";

vi.mock("maplibre-gl", () => import("./maplibreFake"));

import { createMapLibreAdapter } from "./mapAdapter";
import { Map } from "./index";
import {
  clickMapMarker,
  fakeMaps,
  fakePopups,
  hoverMapMarker,
  leaveMap,
  mapClusters,
  mapMarkerHead,
  mapMarkerNames,
  mapMarkers,
  resetMapLibreFakes,
  selectedMapMarkerName,
} from "./maplibreFake";

const pois: Poi[] = [
  {
    id: "forum-boarium",
    name: "Forum Boarium",
    categories: ["Archaeological Site"],
    city: "Rome",
    coordinates: { lat: 41.889, lng: 12.481 },
    shortDescription: "The ancient cattle market beside the Tiber.",
    mainImageUrl: "https://example.com/forum-boarium.jpg",
  },
  {
    id: "cloisters-of-bramante",
    name: "Cloisters of Bramante",
    categories: ["Church", "Museum"],
    city: "Rome",
    coordinates: { lat: 41.9, lng: 12.47 },
    shortDescription: "A Renaissance cloister by Donato Bramante.",
  },
];

/** POIs beside Forum Boarium, close enough to share a bubble with it. */
const neighbor: Poi = { ...pois[1], coordinates: { lat: 41.889, lng: 12.4815 } };
const otherNeighbor: Poi = {
  ...pois[1],
  id: "mouth-of-truth",
  name: "Mouth of Truth",
  coordinates: { lat: 41.8892, lng: 12.4812 },
};

const dispatchPointerEvent = (element: HTMLElement, type: string, pointerType: string) => {
  const event = new Event(type);
  Object.defineProperty(event, "pointerType", { value: pointerType });
  act(() => element.dispatchEvent(event));
};

const markersOf = (places: Poi[]) => places.map((poi) => ({ poi, color: "#3FB1CE" }));

const mountAdapter = (zoom = 15) => {
  const adapter = createMapLibreAdapter({ center: [12.481, 41.889], zoom });
  const container = document.createElement("div");
  document.body.append(container);
  return { adapter, container };
};

describe("Map and its MapLibre adapter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    resetMapLibreFakes();
  });

  afterEach(cleanup);

  it("cleans up previews during Strict Mode replay and React unmount without lifecycle errors", async () => {
    const consoleError = vi.spyOn(console, "error");
    try {
      const view = render(
        createElement(
          StrictMode,
          null,
          createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, markers: markersOf(pois) }),
        ),
      );
      hoverMapMarker("Forum Boarium");
      expect(await screen.findByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();

      view.unmount();

      await waitFor(() => {
        expect(fakePopups.every(({ element }) => !element?.hasChildNodes())).toBe(true);
      });
      expect(fakeMaps.length).toBe(2);
      expect(fakeMaps.every(({ removed }) => removed)).toBe(true);
      expect(consoleError.mock.calls.flat().join(" ")).not.toContain(
        "Attempted to synchronously unmount a root",
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("reports clicks on empty map, but opens details when a marker is clicked", () => {
    const onMapClick = vi.fn();
    const onOpenPoiDetails = vi.fn();
    const { adapter, container } = mountAdapter();
    adapter.setOnMapClick(onMapClick);
    adapter.setOnOpenPoiDetails(onOpenPoiDetails);
    adapter.mount(container);
    adapter.updatePois(markersOf(pois));

    clickMapMarker(null);
    expect(onMapClick).toHaveBeenCalledOnce();

    clickMapMarker("Forum Boarium");
    expect(onOpenPoiDetails).toHaveBeenCalledExactlyOnceWith("forum-boarium");
    expect(onMapClick).toHaveBeenCalledOnce();
    adapter.destroy();
  });

  it("draws every place on the map canvas, not as DOM markers, and keeps the selection", () => {
    const { adapter, container } = mountAdapter();
    adapter.updateSelectedPoi("forum-boarium");
    adapter.mount(container);
    adapter.updatePois(markersOf(pois));

    expect(mapMarkerNames().toSorted()).toEqual(["Cloisters of Bramante", "Forum Boarium"]);
    expect(container.querySelector(".maplibregl-marker")).toBeNull();
    expect(selectedMapMarkerName()).toBe("Forum Boarium");
    adapter.updateSelectedPoi("cloisters-of-bramante");
    expect(selectedMapMarkerName()).toBe("Cloisters of Bramante");

    adapter.updatePois(markersOf([pois[1]]));
    expect(mapMarkerNames()).toEqual(["Cloisters of Bramante"]);
    expect(selectedMapMarkerName()).toBe("Cloisters of Bramante");
    adapter.updateSelectedPoi(null);
    expect(selectedMapMarkerName()).toBeUndefined();
    adapter.destroy();
  });

  it("draws the markers again after the theme swaps the map style", () => {
    const { adapter, container } = mountAdapter();
    adapter.mount(container);
    adapter.updatePois(markersOf(pois));
    adapter.updateSelectedPoi("forum-boarium");

    act(() => fakeMaps[0].setStyle("/map-styles/dark.json"));

    expect(mapMarkerNames().toSorted()).toEqual(["Cloisters of Bramante", "Forum Boarium"]);
    expect(selectedMapMarkerName()).toBe("Forum Boarium");
    adapter.destroy();
  });

  it("draws each marker in the color it is given", () => {
    const { adapter, container } = mountAdapter();
    adapter.mount(container);
    adapter.updatePois([
      { poi: pois[0], color: "#3FB1CE" },
      { poi: pois[1], color: "#facc15" },
    ]);
    expect(mapMarkers().map(({ color }) => color)).toEqual(["#3FB1CE", "#facc15"]);
    adapter.destroy();
  });

  it("keeps an open preview when places are sent again and closes it when its place goes", () => {
    const { adapter, container } = mountAdapter();
    adapter.mount(container);
    adapter.updatePois(markersOf(pois));
    hoverMapMarker("Forum Boarium");

    adapter.updatePois(markersOf(pois.map((poi) => ({ ...poi }))));
    expect(fakePopups[0].isOpen).toBe(true);
    expect(fakePopups[0].additions).toBe(1);

    adapter.updatePois(markersOf([pois[1]]));
    expect(fakePopups[0].isOpen).toBe(false);
    adapter.destroy();
  });

  it("shows the matching preview while the mouse is over a marker", async () => {
    render(
      createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, markers: markersOf(pois) }),
    );
    const canvas = fakeMaps[0].getCanvas();

    hoverMapMarker("Forum Boarium");
    expect(await screen.findByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();
    expect(canvas).toHaveStyle({ cursor: "pointer" });

    hoverMapMarker(null);
    expect(canvas.style.cursor).toBe("");
    expect(screen.getByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Forum Boarium" })).not.toBeInTheDocument(),
    );

    hoverMapMarker("Cloisters of Bramante");
    expect(
      await screen.findByRole("heading", { name: "Cloisters of Bramante" }),
    ).toBeInTheDocument();
    leaveMap();
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Cloisters of Bramante" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("previews and opens the marker drawn on top where markers overlap", () => {
    const onOpenPoiDetails = vi.fn();
    // Zoomed in past the count bubbles, where nearby markers can still overlap.
    const { adapter, container } = mountAdapter(18);
    adapter.setOnOpenPoiDetails(onOpenPoiDetails);
    adapter.mount(container);
    // Ten pixels apart: both markers cover a point between their tips.
    const neighbor = { ...pois[1], coordinates: { lat: 41.889, lng: 12.4815 } };
    adapter.updatePois(markersOf([pois[0], neighbor]));
    const forum = mapMarkerHead("Forum Boarium");
    const overlap = { x: forum.x + 6, y: forum.y };

    clickMapMarker(overlap);
    expect(onOpenPoiDetails).toHaveBeenLastCalledWith("cloisters-of-bramante");

    adapter.updateSelectedPoi("forum-boarium");
    clickMapMarker(overlap);
    expect(onOpenPoiDetails).toHaveBeenLastCalledWith("forum-boarium");

    adapter.updateSelectedPoi(null);
    clickMapMarker({ x: forum.x - 6, y: forum.y });
    expect(onOpenPoiDetails).toHaveBeenLastCalledWith("forum-boarium");
    // Just beside a marker still counts, so markers stay easy to tap.
    clickMapMarker({ x: forum.x - 20, y: forum.y });
    expect(onOpenPoiDetails).toHaveBeenLastCalledWith("forum-boarium");
    clickMapMarker({ x: forum.x - 30, y: forum.y });
    expect(onOpenPoiDetails).toHaveBeenCalledTimes(4);
    adapter.destroy();
  });

  it("updates preview content before positioning it at another marker", async () => {
    render(
      createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, markers: markersOf(pois) }),
    );

    hoverMapMarker("Forum Boarium");
    expect(await screen.findByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();
    expect(fakePopups[0].positions.at(-1)).toContain("Forum Boarium");

    hoverMapMarker("Cloisters of Bramante");
    expect(
      await screen.findByRole("heading", { name: "Cloisters of Bramante" }),
    ).toBeInTheDocument();
    expect(fakePopups[0].positions.at(-1)).toContain("Cloisters of Bramante");
    expect(fakePopups[0].positions.at(-1)).not.toContain("Forum Boarium");
  });

  it("keeps the same preview attached when the mouse returns to its marker", async () => {
    render(
      createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, markers: markersOf(pois) }),
    );

    hoverMapMarker("Forum Boarium");
    expect(await screen.findByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();
    const card = screen.getByRole("button", { name: /Main image of Forum Boarium/ });
    hoverMapMarker(null);
    hoverMapMarker("Forum Boarium");
    hoverMapMarker("Forum Boarium");

    expect(screen.getByRole("button", { name: /Main image of Forum Boarium/ })).toBe(card);
    expect(fakePopups[0].additions).toBe(1);
  });

  it("keeps the preview open while moving to the card and opens details from it", async () => {
    const user = userEvent.setup();
    const onOpenPoiDetails = vi.fn();
    const onMapClick = vi.fn();
    render(
      createElement(Map, {
        coordinates: [12.481, 41.889],
        zoom: 15,
        markers: markersOf(pois),
        onOpenPoiDetails,
        onMapClick,
      }),
    );

    hoverMapMarker("Forum Boarium");
    expect(await screen.findByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();

    hoverMapMarker(null);
    dispatchPointerEvent(fakePopups[0].container, "pointerenter", "mouse");
    await new Promise((resolve) => setTimeout(resolve, 220));

    await user.click(
      within(fakePopups[0].element as HTMLElement).getByRole("button", {
        name: /Forum Boarium/,
      }),
    );

    expect(onOpenPoiDetails).toHaveBeenCalledWith("forum-boarium");
    expect(onMapClick).not.toHaveBeenCalled();
    expect(fakePopups[0].isOpen).toBe(false);
  });

  it("keeps the preview open when the pointer leaves the marker for the popup covering it", async () => {
    render(
      createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, markers: markersOf(pois) }),
    );

    hoverMapMarker("Forum Boarium");
    const heading = await screen.findByRole("heading", { name: "Forum Boarium" });
    const popup = fakePopups[0].container;
    // Boundary events: the popup is entered before the map reports the pointer leaving.
    dispatchPointerEvent(popup, "pointerenter", "mouse");
    leaveMap(popup);
    await new Promise((resolve) => setTimeout(resolve, 220));
    expect(heading).toBeInTheDocument();

    dispatchPointerEvent(popup, "pointerleave", "mouse");
    await waitFor(() => expect(heading).not.toBeInTheDocument());
  });

  it("keeps the preview open over its pointer and closes it after leaving the popup", async () => {
    render(
      createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, markers: markersOf(pois) }),
    );

    hoverMapMarker("Forum Boarium");
    const heading = await screen.findByRole("heading", { name: "Forum Boarium" });
    const popup = fakePopups[0].container;

    hoverMapMarker(null);
    dispatchPointerEvent(popup, "pointerenter", "mouse");
    await new Promise((resolve) => setTimeout(resolve, 220));
    expect(heading).toBeInTheDocument();

    dispatchPointerEvent(popup, "pointerleave", "mouse");
    await waitFor(() => expect(heading).not.toBeInTheDocument());
  });

  it("opens the active place when clicking the preview tip", async () => {
    const user = userEvent.setup();
    const onOpenPoiDetails = vi.fn();
    const onMapClick = vi.fn();
    render(
      createElement(Map, {
        coordinates: [12.481, 41.889],
        zoom: 15,
        markers: markersOf(pois),
        onOpenPoiDetails,
        onMapClick,
      }),
    );

    hoverMapMarker("Forum Boarium");
    hoverMapMarker("Cloisters of Bramante");
    await screen.findByRole("heading", { name: "Cloisters of Bramante" });
    await user.click(fakePopups[0].tip);

    expect(onOpenPoiDetails).toHaveBeenCalledExactlyOnceWith("cloisters-of-bramante");
    expect(onMapClick).not.toHaveBeenCalled();
  });

  it("opens details directly when a marker is clicked or tapped", () => {
    const openedPoiIds: string[] = [];
    render(
      createElement(Map, {
        coordinates: [12.481, 41.889],
        zoom: 15,
        markers: markersOf(pois),
        onOpenPoiDetails: (poiId) => openedPoiIds.push(poiId),
      }),
    );

    hoverMapMarker("Forum Boarium");
    clickMapMarker("Forum Boarium");
    clickMapMarker("Cloisters of Bramante");

    expect(openedPoiIds).toEqual(["forum-boarium", "cloisters-of-bramante"]);
    expect(fakePopups[0].isOpen).toBe(false);
  });

  it("keeps a pair of nearby places as separate markers", () => {
    const { adapter, container } = mountAdapter();
    adapter.mount(container);
    adapter.updatePois(markersOf([pois[0], neighbor]));

    expect(mapClusters()).toEqual([]);
    expect(mapMarkerNames().toSorted()).toEqual(["Cloisters of Bramante", "Forum Boarium"]);
    adapter.destroy();
  });

  it("groups nearby places into a count bubble that zooms in when clicked", async () => {
    const onMapClick = vi.fn();
    const onOpenPoiDetails = vi.fn();
    const { adapter, container } = mountAdapter();
    adapter.setOnMapClick(onMapClick);
    adapter.setOnOpenPoiDetails(onOpenPoiDetails);
    adapter.mount(container);
    adapter.updatePois(markersOf([pois[0], neighbor, otherNeighbor]));

    expect(mapMarkerNames()).toEqual([]);
    const [bubble] = mapClusters();
    expect(bubble.count).toBe(3);

    clickMapMarker(bubble.point);
    await waitFor(() =>
      expect(mapMarkerNames().toSorted()).toEqual([
        "Cloisters of Bramante",
        "Forum Boarium",
        "Mouth of Truth",
      ]),
    );
    expect(onMapClick).not.toHaveBeenCalled();
    expect(onOpenPoiDetails).not.toHaveBeenCalled();
    adapter.destroy();
  });

  it("keeps the selected place out of count bubbles", () => {
    const { adapter, container } = mountAdapter();
    adapter.mount(container);
    adapter.updatePois(markersOf([pois[0], neighbor, otherNeighbor]));

    adapter.updateSelectedPoi("forum-boarium");
    expect(selectedMapMarkerName()).toBe("Forum Boarium");
    expect(mapMarkerNames().toSorted()).toEqual([
      "Cloisters of Bramante",
      "Forum Boarium",
      "Mouth of Truth",
    ]);

    adapter.updateSelectedPoi(null);
    expect(mapMarkerNames()).toEqual([]);
    expect(mapClusters()).toHaveLength(1);
    adapter.destroy();
  });

  it("removes the map and closes the popup when destroyed", () => {
    const { adapter, container } = mountAdapter();
    adapter.mount(container);
    adapter.updatePois(markersOf(pois));
    hoverMapMarker("Forum Boarium");

    adapter.destroy();

    expect(fakeMaps[0].removed).toBe(true);
    expect(fakePopups[0].isOpen).toBe(false);
  });
});
