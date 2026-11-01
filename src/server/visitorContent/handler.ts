import { compareBirthDates } from "@/utils/compareBirthDates";
import { z } from "zod";
import type {
  PublishedCityPreview,
  PublishedPerson,
  PublishedPoiDetail,
} from "@/server/content/publishedContent";
import type { createPublicCatalog } from "@/server/publicCatalog";
import type { PublicStoryContent } from "@/server/storyWorkflow/storyContent";
import { matchesPoiIdentity } from "./mergeCity";
import { toVisitorPerson, toVisitorStory } from "./adapters";

export const createVisitorHandler = (
  reads: {
    getCity?: (city: string) => Promise<PublishedCityPreview>;
    getStory: (id: string) => Promise<PublishedPoiDetail | null>;
    getPerson: (id: string) => Promise<PublishedPerson | null>;
    getPersonBySlug?: (slug: string) => Promise<PublishedPerson | null>;
  },
  local?: ReturnType<typeof createPublicCatalog>,
) => {
  const getStory = async (
    city: string,
    poiId: string,
  ): Promise<{ storyContent: PublicStoryContent; detail: PublishedPoiDetail | null } | null> => {
    const localPoi = local?.getPois(city).find(({ id }) => id === poiId);
    if (localPoi) {
      // Establish online ownership before considering the local version. Failures never select it.
      if (!reads.getCity) throw new Error("Online city read is required.");
      const online = await reads.getCity(city);
      if (online.removedPois?.some((removed) => matchesPoiIdentity(localPoi, removed))) return null;
      const published = online.pois.find((candidate) => matchesPoiIdentity(localPoi, candidate));
      if (!published) {
        const storyContent = local?.getStoryContent(city, poiId);
        return storyContent ? { storyContent, detail: null } : null;
      }
      poiId = published.id;
    }
    if (!z.uuid().safeParse(poiId).success) return null;
    const detail = await reads.getStory(poiId);
    return detail && detail.city === city ? { storyContent: toVisitorStory(detail), detail } : null;
  };

  return {
    getStory: async (city: string, poiId: string) => {
      const headers = { "Cache-Control": "no-store" };
      try {
        const content = await getStory(city, poiId);
        if (content) {
          const datedPeople = await Promise.all(
            content.storyContent.relatedPeople.map(async (person) => {
              const profile = person.personId
                ? content.detail
                  ? await reads.getPerson(person.personId)
                  : local?.getPerson(person.personId)
                : undefined;
              return {
                person: {
                  ...person,
                  ...(profile ? { slug: profile.slug ?? profile.id } : {}),
                },
                birthDate: profile
                  ? "content" in profile
                    ? profile.content.birthDate
                    : profile.birthDate
                  : undefined,
              };
            }),
          );
          content.storyContent = {
            ...content.storyContent,
            relatedPeople: datedPeople
              .sort((left, right) => compareBirthDates(left.birthDate, right.birthDate))
              .map(({ person }) => person),
          };
        }
        return Response.json(content ?? { storyContent: null }, {
          status: content ? 200 : 404,
          headers,
        });
      } catch {
        return Response.json({ storyContent: null }, { status: 503, headers });
      }
    },
    getPerson: async (personId: string, city?: string, poiId?: string, bySlug = false) => {
      const headers = { "Cache-Control": "no-store" };
      try {
        const parent = city && poiId ? await getStory(city, poiId) : undefined;
        if (city && poiId && !parent)
          return Response.json({ person: null }, { status: 404, headers });
        const localPerson = bySlug ? local?.getPersonBySlug(personId) : local?.getPerson(personId);
        if (parent && !parent.detail) {
          const person =
            localPerson &&
            parent.storyContent.relatedPeople.some(({ personId }) => personId === localPerson.id)
              ? { ...localPerson, slug: localPerson.id }
              : null;
          return Response.json({ person, detail: null }, { status: person ? 200 : 404, headers });
        }
        const detail = bySlug
          ? await reads.getPersonBySlug?.(personId)
          : await reads.getPerson(personId);
        if (
          detail &&
          (!city || detail.linkedPois.some((poi) => poi.city === city)) &&
          (!parent ||
            parent.storyContent.relatedPeople.some(({ personId }) => personId === detail.id))
        )
          return Response.json({ person: toVisitorPerson(detail), detail }, { headers });
        // A local-only standalone profile is visible only through a still-visible local Story.
        if (bySlug && !parent && localPerson && local) {
          for (const poi of local.getPois(city ?? "rome")) {
            if (
              !local
                .getStoryContent(city ?? "rome", poi.id)
                ?.relatedPeople.some(({ personId }) => personId === localPerson.id)
            )
              continue;
            const story = await getStory(city ?? "rome", poi.id);
            if (
              story &&
              !story.detail &&
              story.storyContent.relatedPeople.some(({ personId }) => personId === localPerson.id)
            )
              return Response.json(
                { person: { ...localPerson, slug: localPerson.id }, detail: null },
                { headers },
              );
          }
        }
        return Response.json({ person: null }, { status: 404, headers });
      } catch {
        return Response.json({ person: null }, { status: 503, headers });
      }
    },
  };
};
