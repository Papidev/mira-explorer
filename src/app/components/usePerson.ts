"use client";

import { useEffect, useState } from "react";
import type { PublicPerson } from "@/server/person";

export const usePerson = (personId?: string, city?: string, poiId?: string, bySlug = false) => {
  const [state, setState] = useState<{
    requestKey: string | null;
    person: PublicPerson | null;
  }>({ requestKey: null, person: null });
  const requestKey = JSON.stringify([personId, city, poiId, bySlug]);

  useEffect(() => {
    if (!personId) return;
    const controller = new AbortController();
    void fetch(
      `/api/people/${bySlug ? "by-slug/" : ""}${encodeURIComponent(personId)}${city ? `?${new URLSearchParams({ city, ...(poiId ? { poiId } : {}) })}` : ""}`,
      { signal: controller.signal },
    )
      .then(async (response) =>
        response.ok ? ((await response.json()) as { person?: PublicPerson | null }) : {},
      )
      .then(({ person }) => setState({ requestKey, person: person ?? null }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ requestKey, person: null });
      });
    return () => controller.abort();
  }, [personId, city, poiId, bySlug, requestKey]);

  return {
    person: state.requestKey === requestKey ? state.person : null,
    isLoading: Boolean(personId) && state.requestKey !== requestKey,
  };
};
