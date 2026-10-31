"use client";

import { usePanelResize } from "./usePanelResize";

export const PanelResizeHandle = ({
  edge,
  label,
  onResize,
}: {
  edge: "left" | "right";
  label: string;
  onResize: (width: number) => void;
}) => (
  <button
    type="button"
    aria-label={label}
    title="Drag or use the Left and Right arrow keys to resize"
    {...usePanelResize(edge, onResize)}
    onTouchStart={(event) => event.stopPropagation()}
    onTouchEnd={(event) => event.stopPropagation()}
    className={`group absolute inset-y-0 z-40 hidden w-2 cursor-ew-resize touch-none items-center justify-center hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-900 md:flex ${edge === "left" ? "left-0" : "right-0"}`}
  >
    <span
      aria-hidden="true"
      className="h-10 w-1 rounded-full bg-zinc-300 group-hover:bg-blue-900"
    />
  </button>
);
