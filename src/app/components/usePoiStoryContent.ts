"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicStoryContent } from "@/server/storyWorkflow/storyContent";
import type { PublishedPoiDetail } from "@mira/shared";

type StoryContentState = {
  content: PublicStoryContent | null;
  detail?: PublishedPoiDetail | null;
  /** A local-only place's main image; online places carry theirs in `detail`. */
  mainImageUrl?: string;
  isLoading: boolean;
  showLoading: boolean;
  poiId: string | null;
};

/** A Story the server already loaded, so a shared link's page carries its text. */
export type InitialStory = {
  poiId: string;
  storyContent: PublicStoryContent;
  detail: PublishedPoiDetail | null;
  mainImageUrl?: string;
};

export const usePoiStoryContent = ({
  citySlug,
  poiId,
  initial,
}: {
  citySlug: string;
  poiId?: string;
  initial?: InitialStory | null;
}) => {
  const [state, setState] = useState<StoryContentState>(() =>
    initial
      ? {
          content: initial.storyContent,
          detail: initial.detail,
          mainImageUrl: initial.mainImageUrl,
          isLoading: false,
          showLoading: false,
          poiId: initial.poiId,
        }
      : { content: null, isLoading: false, showLoading: false, poiId: null },
  );
  // Only the first showing uses the server's Story; reopening the place loads it again.
  const seededPoiId = useRef(initial?.poiId);

  useEffect(() => {
    if (poiId !== seededPoiId.current) seededPoiId.current = undefined;
    if (!poiId || seededPoiId.current) {
      return;
    }

    const abortController = new AbortController();
    const loadingTimeout = window.setTimeout(() => {
      setState((current) =>
        current.poiId === poiId && current.isLoading ? { ...current, showLoading: true } : current,
      );
    }, 200);

    const loadStoryContent = async () => {
      setState({ content: null, isLoading: true, showLoading: false, poiId });

      try {
        const response = await fetch(
          `/api/pois/${encodeURIComponent(citySlug)}/${encodeURIComponent(poiId)}/dialog-content`,
          { signal: abortController.signal },
        );

        if (!response.ok) {
          setState({ content: null, isLoading: false, showLoading: false, poiId });
          return;
        }

        const payload = (await response.json()) as {
          storyContent?: PublicStoryContent | null;
          detail?: PublishedPoiDetail;
          mainImageUrl?: string;
        };
        setState({
          content: payload.storyContent ?? null,
          detail: payload.detail ?? null,
          mainImageUrl: payload.mainImageUrl,
          isLoading: false,
          showLoading: false,
          poiId,
        });
      } catch {
        if (!abortController.signal.aborted) {
          setState({ content: null, isLoading: false, showLoading: false, poiId });
        }
      } finally {
        window.clearTimeout(loadingTimeout);
      }
    };

    void loadStoryContent();

    return () => {
      window.clearTimeout(loadingTimeout);
      abortController.abort();
    };
  }, [citySlug, poiId]);

  return {
    content: state.poiId === poiId ? state.content : null,
    detail: state.poiId === poiId ? state.detail : null,
    mainImageUrl: state.poiId === poiId ? state.mainImageUrl : undefined,
    isLoading: Boolean(poiId) && (state.poiId !== poiId || state.isLoading),
    showLoading: state.poiId === poiId && state.showLoading,
  };
};
