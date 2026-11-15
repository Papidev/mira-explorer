"use client";

import { animate, motion, useDragControls, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Snap = "peek" | "full";

/** Share of the sheet's height that the preview covers; it leaves the top half visible. */
export const BOTTOM_SHEET_PEEK_RATIO = 0.5;

/**
 * Map-app bottom sheet: opens as a preview, drags up to full height and down to close.
 * In the preview the whole sheet drags; at full height only the handle does, so the
 * content can scroll. Children read the snap from `data-snap` on the `group/sheet`.
 */
export const BottomSheet = ({
  open,
  onClose,
  afterLeave,
  children,
}: {
  open: boolean;
  onClose: () => void;
  afterLeave?: () => void;
  children: ReactNode;
}) => {
  const sheetRef = useRef<HTMLElement>(null);
  const [snap, setSnap] = useState<Snap>("peek");
  // Every opening starts from the preview.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSnap("peek");
  }
  const y = useMotionValue(10_000);
  const dragControls = useDragControls();
  const wasDragged = useRef(false);
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 400, damping: 40 };

  const height = () => sheetRef.current?.offsetHeight ?? 0;
  const snapY = (target: Snap | "closed") =>
    target === "full" ? 0 : target === "peek" ? height() * BOTTOM_SHEET_PEEK_RATIO : height();

  const moveTo = (target: Snap) => {
    setSnap(target);
    animate(y, snapY(target), transition);
  };

  useEffect(() => {
    if (open) {
      animate(y, snapY("peek"), transition);
    } else {
      animate(y, snapY("closed"), transition).then(() => afterLeave?.());
    }
    // Only open/close moves the sheet; the other values are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <motion.aside
      ref={sheetRef}
      aria-hidden={!open}
      inert={!open}
      data-snap={snap}
      style={{ y }}
      drag="y"
      dragListener={snap === "peek"}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 10_000 }}
      dragElastic={0}
      dragMomentum={false}
      onDragStart={() => {
        wasDragged.current = true;
      }}
      onDragEnd={(_, { velocity }) => {
        // Project the release a little so a flick reaches the next position, but move one
        // step per gesture: from full height a swipe down returns to the preview first.
        const projected = y.get() + velocity.y * 0.2;
        const targets = (
          snap === "full"
            ? [
                ["full", snapY("full")],
                ["peek", snapY("peek")],
              ]
            : [
                ["full", snapY("full")],
                ["peek", snapY("peek")],
                ["closed", snapY("closed")],
              ]
        ) as [Snap | "closed", number][];
        const [nearest] = targets.reduce((best, target) =>
          Math.abs(target[1] - projected) < Math.abs(best[1] - projected) ? target : best,
        );
        if (nearest === "closed") onClose();
        else moveTo(nearest);
      }}
      className="group/sheet border-line bg-surface absolute inset-x-0 bottom-0 z-20 flex h-full flex-col rounded-t-2xl border-t shadow-2xl"
    >
      <button
        type="button"
        aria-expanded={snap === "full"}
        aria-label={snap === "full" ? "Collapse details" : "Expand details"}
        onPointerDown={(event) => dragControls.start(event)}
        onClick={() => {
          if (wasDragged.current) {
            wasDragged.current = false;
            return;
          }
          moveTo(snap === "full" ? "peek" : "full");
        }}
        className="focus-visible:outline-focus grid h-6 w-full shrink-0 cursor-grab touch-none place-items-center rounded-t-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 active:cursor-grabbing"
      >
        <span aria-hidden="true" className="bg-line-strong h-1 w-10 rounded-full" />
      </button>
      <div className="relative min-h-0 flex-1">{children}</div>
    </motion.aside>
  );
};
