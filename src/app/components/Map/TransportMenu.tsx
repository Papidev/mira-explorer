"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { TRANSPORT_MODES, type TransportMode } from "./mapAdapter";

const LABELS: Record<TransportMode, string> = {
  metro: "Metro",
  surface: "Buses & trams",
  train: "Trains",
  airport: "Airports",
};

const MetroSign = ({ size }: { size: number }) => (
  <Image
    src="/map-styles/sprites/mira@2x.png"
    alt=""
    width={size}
    height={size}
    className="rounded-[2px]"
  />
);

/** A small corner button: transport is an extra, so its switches stay out of the way. */
export const TransportMenu = ({
  hidden,
  onToggle,
  style,
}: {
  hidden: TransportMode[];
  onToggle: (mode: TransportMode) => void;
  /** Keeps the button clear of panels covering the map. */
  style?: CSSProperties;
}) => (
  <Popover className="absolute z-10" style={style}>
    <PopoverButton
      aria-label="Transport on the map"
      className="border-line bg-surface hover:bg-canvas grid size-9 cursor-pointer place-items-center rounded-xl border shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <MetroSign size={20} />
    </PopoverButton>
    <PopoverPanel
      anchor="top end"
      transition
      className="border-line bg-surface z-20 rounded-xl border px-3 py-2 shadow-md transition [--anchor-gap:0.5rem] data-closed:opacity-0 motion-reduce:transition-none"
    >
      <fieldset>
        <legend className="text-ink-muted pb-1 text-xs font-semibold">Transport on the map</legend>
        {TRANSPORT_MODES.map((mode) => (
          <label
            key={mode}
            className="text-ink flex min-h-8 cursor-pointer items-center gap-2 text-sm pointer-coarse:min-h-11"
          >
            <input
              type="checkbox"
              checked={!hidden.includes(mode)}
              onChange={() => onToggle(mode)}
              className="accent-accent size-4 cursor-pointer"
            />
            {mode === "metro" && <MetroSign size={14} />}
            {LABELS[mode]}
          </label>
        ))}
        <p className="text-ink-subtle pt-1 text-xs">Stops show when you zoom in close.</p>
      </fieldset>
    </PopoverPanel>
  </Popover>
);
