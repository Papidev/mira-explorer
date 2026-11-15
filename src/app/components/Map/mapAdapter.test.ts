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
  clickMapPin,
  fakeMaps,
  fakePopups,
  hoverMapPin,
  leaveMap,
  mapPinNames,
  mapPins,
  resetMapLibreFakes,
  selectedMapPinName,
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
    funFacts: [],
  },
  {
    id: "cloisters-of-bramante",
    name: "Cloisters of Bramante",
    categories: ["Church", "Museum"],
    city: "Rome",
    coordinates: { lat: 41.9, lng: 12.47 },
    shortDescription: "A Renaissance cloister by Donato Bramante.",
    funFacts: [],
  },
];

const dispatchPointerEvent = (element: HTMLElement, type: string, pointerType: string) => {
  const event = new Event(type);
  Object.defineProperty(event, "pointerType", { value: pointerType });
  act(() => element.dispatchEvent(event));
};

const mountAdapter = () => {
  const adapter = createMapLibreAdapter({ center: [12.481, 41.889], zoom: 15 });
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
          createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, pois }),
        ),
      );
      hoverMapPin("Forum Boarium");
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

  it("reports clicks on empty map, but opens details when a pin is clicked", () => {
    const onMapClick = vi.fn();
    const onOpenPoiDetails = vi.fn();
    const { adapter, container } = mountAdapter();
    adapter.setOnMapClick(onMapClick);
    adapter.setOnOpenPoiDetails(onOpenPoiDetails);
    adapter.mount(container);
    adapter.updatePois(pois);

    clickMapPin(null);
    expect(onMapClick).toHaveBeenCalledOnce();

    clickMapPin("Forum Boarium");
    expect(onOpenPoiDetails).toHaveBeenCalledExactlyOnceWith("forum-boarium");
    expect(onMapClick).toHaveBeenCalledOnce();
    adapter.destroy();
  });

  it("draws every place as a pin without DOM markers and keeps the selection", () => {
    const { adapter, container } = mountAdapter();
    adapter.updateSelectedPoi("forum-boarium");
    adapter.mount(container);
    adapter.updatePois(pois);

    expect(mapPinNames()).toEqual(["Forum Boarium", "Cloisters of Bramante"]);
    expect(container.querySelector(".maplibregl-marker")).toBeNull();
    expect(selectedMapPinName()).toBe("Forum Boarium");
    adapter.updateSelectedPoi("cloisters-of-bramante");
    expect(selectedMapPinName()).toBe("Cloisters of Bramante");

    adapter.updatePois([pois[1]]);
    expect(mapPinNames()).toEqual(["Cloisters of Bramante"]);
    expect(selectedMapPinName()).toBe("Cloisters of Bramante");
    adapter.updateSelectedPoi(null);
    expect(selectedMapPinName()).toBeUndefined();
    adapter.destroy();
  });

  it("draws the pins again after the theme swaps the map style", () => {
    const { adapter, container } = mountAdapter();
    adapter.mount(container);
    adapter.updatePois(pois);
    adapter.updateSelectedPoi("forum-boarium");

    act(() => fakeMaps[0].setStyle("https://tiles.openfreemap.org/styles/fiord"));

    expect(mapPinNames()).toEqual(["Forum Boarium", "Cloisters of Bramante"]);
    expect(selectedMapPinName()).toBe("Forum Boarium");
    adapter.destroy();
  });

  it("colors pins by category and a place shared by two groups with the active group's color", () => {
    const { adapter, container } = mountAdapter();
    adapter.mount(container);
    adapter.updatePois(pois);
    expect(mapPins().map(({ color }) => color)).toEqual(["#3FB1CE", "#facc15"]);
    const sharedPoi = { ...pois[1], categories: ["Museum", "Castle"] };

    adapter.updatePois([sharedPoi], undefined, ["Architecture", "Castle"]);
    expect(mapPins()[0].color).toBe("#ea580c");

    adapter.updatePois([sharedPoi], undefined, ["Arts & Culture", "Museum"]);
    expect(mapPins()[0].color).toBe("#10b981");
    adapter.destroy();
  });

  it("keeps an open preview when places are sent again and closes it when its place goes", () => {
    const { adapter, container } = mountAdapter();
    adapter.mount(container);
    adapter.updatePois(pois);
    hoverMapPin("Forum Boarium");

    adapter.updatePois(pois.map((poi) => ({ ...poi })));
    expect(fakePopups[0].isOpen).toBe(true);
    expect(fakePopups[0].additions).toBe(1);

    adapter.updatePois([pois[1]]);
    expect(fakePopups[0].isOpen).toBe(false);
    adapter.destroy();
  });

  it("shows the matching preview while the mouse is over a pin", async () => {
    render(createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, pois }));
    const canvas = fakeMaps[0].getCanvas();

    hoverMapPin("Forum Boarium");
    expect(await screen.findByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();
    expect(canvas).toHaveStyle({ cursor: "pointer" });

    hoverMapPin(null);
    expect(canvas.style.cursor).toBe("");
    expect(screen.getByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Forum Boarium" })).not.toBeInTheDocument(),
    );

    hoverMapPin("Cloisters of Bramante");
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

  it("updates preview content before positioning it at another pin", async () => {
    render(createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, pois }));

    hoverMapPin("Forum Boarium");
    expect(await screen.findByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();
    expect(fakePopups[0].positions.at(-1)).toContain("Forum Boarium");

    hoverMapPin("Cloisters of Bramante");
    expect(
      await screen.findByRole("heading", { name: "Cloisters of Bramante" }),
    ).toBeInTheDocument();
    expect(fakePopups[0].positions.at(-1)).toContain("Cloisters of Bramante");
    expect(fakePopups[0].positions.at(-1)).not.toContain("Forum Boarium");
  });

  it("keeps the same preview attached when the mouse returns to its pin", async () => {
    render(createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, pois }));

    hoverMapPin("Forum Boarium");
    expect(await screen.findByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();
    const card = screen.getByRole("button", { name: /Main image of Forum Boarium/ });
    hoverMapPin(null);
    hoverMapPin("Forum Boarium");
    hoverMapPin("Forum Boarium");

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
        pois,
        onOpenPoiDetails,
        onMapClick,
      }),
    );

    hoverMapPin("Forum Boarium");
    expect(await screen.findByRole("heading", { name: "Forum Boarium" })).toBeInTheDocument();

    hoverMapPin(null);
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

  it("keeps the preview open when the pointer leaves the pin for the popup covering it", async () => {
    render(createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, pois }));

    hoverMapPin("Forum Boarium");
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
    render(createElement(Map, { coordinates: [12.481, 41.889], zoom: 15, pois }));

    hoverMapPin("Forum Boarium");
    const heading = await screen.findByRole("heading", { name: "Forum Boarium" });
    const popup = fakePopups[0].container;

    hoverMapPin(null);
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
        pois,
        onOpenPoiDetails,
        onMapClick,
      }),
    );

    hoverMapPin("Forum Boarium");
    hoverMapPin("Cloisters of Bramante");
    await screen.findByRole("heading", { name: "Cloisters of Bramante" });
    await user.click(fakePopups[0].tip);

    expect(onOpenPoiDetails).toHaveBeenCalledExactlyOnceWith("cloisters-of-bramante");
    expect(onMapClick).not.toHaveBeenCalled();
  });

  it("opens details directly when a pin is clicked or tapped", () => {
    const openedPoiIds: string[] = [];
    render(
      createElement(Map, {
        coordinates: [12.481, 41.889],
        zoom: 15,
        pois,
        onOpenPoiDetails: (poiId) => openedPoiIds.push(poiId),
      }),
    );

    hoverMapPin("Forum Boarium");
    clickMapPin("Forum Boarium");
    clickMapPin("Cloisters of Bramante");

    expect(openedPoiIds).toEqual(["forum-boarium", "cloisters-of-bramante"]);
    expect(fakePopups[0].isOpen).toBe(false);
  });

  it("removes the map and closes the popup when destroyed", () => {
    const { adapter, container } = mountAdapter();
    adapter.mount(container);
    adapter.updatePois(pois);
    hoverMapPin("Forum Boarium");

    adapter.destroy();

    expect(fakeMaps[0].removed).toBe(true);
    expect(fakePopups[0].isOpen).toBe(false);
  });
});
