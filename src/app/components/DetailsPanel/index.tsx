"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Poi } from "@/types/Poi";
import { Drawer } from "@/app/components/ui/Drawer";
import { BottomSheet } from "@/app/components/ui/BottomSheet";
import { PanelResizeHandle } from "@/app/components/ui/PanelResizeHandle";
import { DrawerCloseButton } from "@/app/components/ui/DrawerCloseButton";
import { Spinner } from "@/app/components/ui/Spinner";
import { usePoiStoryContent, type InitialStory } from "@/app/components/usePoiStoryContent";
import { usePerson } from "@/app/components/usePerson";
import { useViewport } from "@/app/viewport";
import { PoiDetails } from "./PoiDetails";
import { PersonDetails } from "./PersonDetails";

/** Default width of the details side drawer, before the visitor resizes it. */
export const DETAILS_PANEL_WIDTH = 448;

/**
 * Shows the selected place or Person: a bottom sheet below md, a resizable side drawer above.
 * The panel owns loading, closing and scrolling; the views only render content.
 */
export const DetailsPanel = ({
  citySlug,
  poi: selectedPoi,
  personSlug,
  onSelectPerson,
  onClose,
  openRequestId = 0,
  width = DETAILS_PANEL_WIDTH,
  onResize,
  excludedByFilters = false,
  initialStory,
}: {
  citySlug: string;
  poi?: Poi;
  personSlug: string | null;
  onSelectPerson: (slug: string | null) => void;
  onClose: () => void;
  openRequestId?: number;
  width?: number;
  onResize?: (width: number) => void;
  excludedByFilters?: boolean;
  initialStory?: InitialStory | null;
}) => {
  // Keep showing the last place while the panel animates closed.
  const [poi, setPoi] = useState(selectedPoi);
  if (selectedPoi && selectedPoi !== poi) setPoi(selectedPoi);
  const story = usePoiStoryContent({ citySlug, poiId: poi?.id, initial: initialStory });
  const { person, isLoading: isPersonLoading } = usePerson(
    personSlug ?? undefined,
    citySlug,
    selectedPoi?.id,
    true,
  );
  const { detailsAsSheet } = useViewport();

  const isOpen = Boolean(selectedPoi || personSlug);
  const afterLeave = () => {
    if (!selectedPoi) setPoi(undefined);
  };
  const isLoading = personSlug ? isPersonLoading : story.isLoading && story.showLoading;
  const backToPoi = personSlug && selectedPoi ? () => onSelectPerson(null) : undefined;

  const scrollRef = useRef<HTMLDivElement>(null);
  // Where the visitor left the Story, kept while a Person covers it.
  const storyScrollTop = useRef(0);
  // A closed drawer cannot take focus until its transition starts showing it.
  const focusPending = useRef(false);
  const focusHeading = () => {
    const heading = scrollRef.current?.querySelector<HTMLElement>("h2");
    heading?.focus({ preventScroll: true });
    focusPending.current = Boolean(heading) && document.activeElement !== heading;
  };
  const shown = useRef({ poiId: poi?.id, personSlug, openRequestId });
  useLayoutEffect(() => {
    const previous = shown.current;
    shown.current = { poiId: poi?.id, personSlug, openRequestId };
    if (previous.poiId !== poi?.id) storyScrollTop.current = 0;
    const container = scrollRef.current;
    // A page load keeps the browser's focus; only a visitor's choice moves it.
    const unchanged =
      previous.poiId === poi?.id &&
      previous.personSlug === personSlug &&
      previous.openRequestId === openRequestId;
    if (!isOpen || !container || unchanged) return;
    if (personSlug) container.scrollTop = 0;
    else if (previous.personSlug && previous.poiId === poi?.id)
      container.scrollTop = storyScrollTop.current;
    focusHeading();
  }, [isOpen, poi?.id, personSlug, openRequestId]);

  const panel =
    poi || personSlug ? (
      <>
        {onResize ? (
          <PanelResizeHandle edge="left" label="Resize details panel" onResize={onResize} />
        ) : null}
        {isLoading ? (
          <div
            role="status"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <Spinner />
            <span className="sr-only">{personSlug ? "Loading person..." : "Loading place..."}</span>
          </div>
        ) : null}
        {/* In the bottom sheet preview the whole sheet drags, so the content does not scroll. */}
        <div
          key={poi?.id ?? "person"}
          ref={scrollRef}
          onScroll={(event) => {
            if (!personSlug) storyScrollTop.current = event.currentTarget.scrollTop;
          }}
          className="h-full overflow-y-auto group-data-[snap=peek]/sheet:overflow-hidden"
        >
          <div className="absolute top-4 right-4 z-10">
            <DrawerCloseButton onClick={backToPoi ?? onClose} />
          </div>
          {personSlug ? (
            <PersonDetails
              person={person}
              isLoading={isPersonLoading}
              loadingName={
                story.content?.relatedPeople.find(
                  ({ personId, slug }) => personId === personSlug || slug === personSlug,
                )?.name
              }
              poiName={selectedPoi?.name}
              onBack={() => onSelectPerson(null)}
            />
          ) : poi ? (
            <PoiDetails
              poi={poi}
              story={story}
              galleryKey={
                selectedPoi && story.detail ? `${story.detail.id}-${openRequestId}` : undefined
              }
              width={width}
              excludedByFilters={excludedByFilters}
              onOpenPerson={(personId) =>
                onSelectPerson(
                  story.content?.relatedPeople.find((related) => related.personId === personId)
                    ?.slug ?? personId,
                )
              }
            />
          ) : null}
        </div>
      </>
    ) : null;

  return detailsAsSheet ? (
    <BottomSheet open={isOpen} onClose={onClose} afterLeave={afterLeave}>
      {panel}
    </BottomSheet>
  ) : (
    <Drawer
      open={isOpen}
      side="right"
      width={width}
      beforeEnter={() => focusPending.current && focusHeading()}
      afterLeave={afterLeave}
    >
      {panel}
    </Drawer>
  );
};
