"use client";

import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from "react";
import { createPortal, flushSync } from "react-dom";
import type { Poi } from "@/types/Poi";
import { Spinner } from "@/app/components/ui/Spinner";
import "./markers.css";
import "./controls.css";
import {
  createMapLibreAdapter,
  type CoveredArea,
  type MapAdapter,
  type MapPreview,
  type PoiMarker,
} from "./mapAdapter";

export type { CoveredArea };
import { PoiPreviewCard } from "./PoiPreviewCard";

type Props = {
  coordinates: [number, number];
  zoom: number;
  markers: PoiMarker[];
  selectedPoiId?: string | null;
  onZoomChange?: (zoom: number) => void;
  onOpenPoiDetails?: (poiId: string) => void;
  onMapClick?: () => void;
  /** Called once the street map and places are first drawn. */
  onLoad?: () => void;
  /** Parts of the map hidden by panels; a focused place is centred in what remains. */
  coveredArea?: CoveredArea;
  focusRequest?: { poi: Poi; requestId: number };
};

type MapHandlers = {
  onZoomChange?: Props["onZoomChange"];
  onOpenPoiDetails?: Props["onOpenPoiDetails"];
  onMapClick?: Props["onMapClick"];
  onLoad?: Props["onLoad"];
};

const ZOOM_EPSILON = 0.001;

export const Map = ({
  coordinates,
  zoom,
  markers,
  selectedPoiId = null,
  onZoomChange,
  onOpenPoiDetails,
  onMapClick,
  onLoad,
  coveredArea = { left: 0, right: 0, bottom: 0 },
  focusRequest,
}: Props) => {
  const [preview, setPreview] = useState<MapPreview | null>(null);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const adapterRef = useRef<MapAdapter | null>(null);
  const lastZoomFromMapRef = useRef<number | null>(null);
  const handlersRef = useRef<MapHandlers>({ onZoomChange, onOpenPoiDetails, onMapClick, onLoad });
  const lastCenterRef = useRef<[number, number] | null>(null);
  const initialViewRef = useRef({ center: coordinates, zoom });

  useEffect(() => {
    handlersRef.current = { onZoomChange, onOpenPoiDetails, onMapClick, onLoad };
  }, [onZoomChange, onOpenPoiDetails, onMapClick, onLoad]);

  useEffect(() => {
    if (adapterRef.current || !containerRef.current) {
      return;
    }

    const adapter = createMapLibreAdapter(initialViewRef.current);
    adapter.setOnZoomChange((value) => {
      lastZoomFromMapRef.current = value;
      handlersRef.current.onZoomChange?.(value);
    });
    adapter.setOnOpenPoiDetails((poiId) => handlersRef.current.onOpenPoiDetails?.(poiId));
    adapter.setOnMapClick(() => handlersRef.current.onMapClick?.());
    adapter.setOnLoad(() => {
      setLoaded(true);
      handlersRef.current.onLoad?.();
    });
    adapter.setOnPreviewChange((nextPreview) => {
      if (nextPreview) {
        // MapLibre measures and positions the popup immediately after this callback.
        flushSync(() => setPreview(nextPreview));
      } else {
        setPreview(null);
      }
    });
    adapter.mount(containerRef.current);
    adapterRef.current = adapter;

    return () => {
      adapter.setOnPreviewChange(null);
      adapter.setOnLoad(null);
      adapter.destroy();
      adapterRef.current = null;
    };
  }, []);

  useEffect(() => {
    const adapter = adapterRef.current;
    if (!adapter) {
      return;
    }

    const previousCenter = lastCenterRef.current;
    if (
      !previousCenter ||
      previousCenter[0] !== coordinates[0] ||
      previousCenter[1] !== coordinates[1]
    ) {
      adapter.updateView({ center: coordinates });
      lastCenterRef.current = coordinates;
    }
  }, [coordinates]);

  useEffect(() => {
    const adapter = adapterRef.current;
    if (!adapter) {
      return;
    }

    const zoomFromMap = lastZoomFromMapRef.current;
    if (zoomFromMap !== null && Math.abs(zoomFromMap - zoom) < ZOOM_EPSILON) {
      return;
    }

    const currentZoom = adapter.getZoom();
    if (currentZoom !== null && Math.abs(currentZoom - zoom) < ZOOM_EPSILON) {
      return;
    }

    adapter.updateView({ zoom });
  }, [zoom]);

  useEffect(() => {
    adapterRef.current?.updatePois(markers);
  }, [markers]);

  useEffect(() => {
    adapterRef.current?.updateSelectedPoi(selectedPoiId);
  }, [selectedPoiId]);

  const focusSelectedPoi = useEffectEvent(() => {
    if (focusRequest) adapterRef.current?.focusPoi(focusRequest.poi, coveredArea);
  });
  const focusPoiId = focusRequest?.poi.id;
  const focusRequestId = focusRequest?.requestId;
  useEffect(() => {
    focusSelectedPoi();
  }, [focusPoiId, focusRequestId]);

  return (
    <>
      <div
        ref={containerRef}
        className="city-map h-full w-full"
        data-controls-covered={Object.values(coveredArea).some(Boolean)}
        style={{ "--map-controls-right-inset": `${coveredArea.right}px` } as CSSProperties}
      />
      {/* Continues the page's loading spinner until the street map and places are drawn. */}
      {!loaded && (
        <div role="status" className="pointer-events-none absolute inset-0 grid place-items-center">
          <Spinner />
          <span className="sr-only">Loading the map…</span>
        </div>
      )}
      {preview &&
        createPortal(
          <PoiPreviewCard
            key={preview.poi.id}
            // Current marker data, so previews loaded while the card is open still show.
            poi={markers.find(({ poi }) => poi.id === preview.poi.id)?.poi ?? preview.poi}
            onOpenDetails={preview.onOpenDetails}
          />,
          preview.container,
        )}
    </>
  );
};
