import { z } from "zod";
import type { PublishedCityPreview, PublishedPerson, PublishedPoiDetail } from "@mira/shared";
import type { createPublicCatalog } from "@/server/publicCatalog";
import type { PublicStoryContent } from "@/server/storyWorkflow/storyContent";
import type { Poi } from "@/types/Poi";
import { compareBirthDates } from "@/utils/compareBirthDates";
import { toVisitorCity, toVisitorPerson, toVisitorStory } from "./adapters";

/** A link names a place by slug (`/rome/<slug>`); `poiId` and local IDs replaced online still resolve. */
export type PoiLink = { poi?: string; poiId?: string };

type OnlineReads = {
  getCity: (city: string) => Promise<PublishedCityPreview>;
  getStory: (id: string) => Promise<PublishedPoiDetail | null>;
  getPerson: (id: string) => Promise<PublishedPerson | null>;
  getPersonBySlug: (slug: string) => Promise<PublishedPerson | null>;
};

type VisitorStory = {
  storyContent: PublicStoryContent;
  /** The online publication; null for a local-only Story. */
  detail: PublishedPoiDetail | null;
  /** A local-only place's main image; online places carry theirs in `detail`. */
  mainImageUrl?: string;
};

const notFound = { status: "not-found" } as const;
const unavailable = { status: "unavailable" } as const;

const matchesPoiIdentity = (
  local: Pick<Poi, "id" | "wikidataId">,
  online: { id: string; wikidataId?: string | null },
) => local.id === online.id || Boolean(local.wikidataId && local.wikidataId === online.wikidataId);

const findLinkedPoi = (
  pois: Poi[],
  aliases: Record<string, string>,
  { poi: slug, poiId }: PoiLink,
) => {
  if (slug) {
    const matches = pois.filter((poi) => (poi.slug ?? poi.id) === slug);
    if (matches.length === 1) return matches[0];
    return matches.length === 0 && aliases[slug]
      ? pois.find((poi) => poi.id === aliases[slug])
      : undefined;
  }
  return poiId ? pois.find((poi) => poi.id === (aliases[poiId] ?? poiId)) : undefined;
};

/**
 * What visitors can reach in a city: online publications merged with the local public catalog.
 * An online publication replaces the whole matching local POI and a confirmed online removal
 * suppresses it; an online failure is `unavailable` and never falls back to local content.
 */
export const createVisitorContent = ({
  online,
  local,
}: {
  online: OnlineReads;
  local: Pick<
    ReturnType<typeof createPublicCatalog>,
    | "getCatalogCity"
    | "getPois"
    | "getCategoryDefinitions"
    | "getStoryContent"
    | "getPerson"
    | "getPersonBySlug"
  >;
}) => {
  const findStory = async (city: string, poiId: string): Promise<VisitorStory | null> => {
    const localPoi = local.getPois(city).find(({ id }) => id === poiId);
    if (localPoi) {
      // Establish online ownership before considering the local version.
      const published = await online.getCity(city);
      if (published.removedPois?.some((removed) => matchesPoiIdentity(localPoi, removed)))
        return null;
      const match = published.pois.find((candidate) => matchesPoiIdentity(localPoi, candidate));
      if (!match) {
        const storyContent = local.getStoryContent(city, poiId);
        // The map's previews data is skipped on touch phones, so the panel's image comes from here.
        return storyContent
          ? { storyContent, detail: null, mainImageUrl: localPoi.mainImageUrl }
          : null;
      }
      poiId = match.id;
    }
    if (!z.uuid().safeParse(poiId).success) return null;
    const detail = await online.getStory(poiId);
    return detail && detail.city === city ? { storyContent: toVisitorStory(detail), detail } : null;
  };

  // Related People run oldest to newest by birth year, unknown dates first.
  const withPeopleByBirth = async (story: VisitorStory): Promise<VisitorStory> => {
    const datedPeople = await Promise.all(
      story.storyContent.relatedPeople.map(async (person) => {
        const profile = person.personId
          ? story.detail
            ? await online.getPerson(person.personId)
            : local.getPerson(person.personId)
          : undefined;
        return {
          person: { ...person, ...(profile ? { slug: profile.slug ?? profile.id } : {}) },
          birthDate: profile
            ? "content" in profile
              ? profile.content.birthDate
              : profile.birthDate
            : undefined,
        };
      }),
    );
    return {
      ...story,
      storyContent: {
        ...story.storyContent,
        relatedPeople: datedPeople
          .sort((left, right) => compareBirthDates(left.birthDate, right.birthDate))
          .map(({ person }) => person),
      },
    };
  };

  const isRelated = (story: VisitorStory, personId: string) =>
    story.storyContent.relatedPeople.some((person) => person.personId === personId);

  const findPerson = async (
    ref: { id: string } | { slug: string },
    { city, poiId }: { city?: string; poiId?: string },
  ) => {
    const parent = city && poiId ? await findStory(city, poiId) : undefined;
    if (city && poiId && !parent) return null;
    const localPerson = "slug" in ref ? local.getPersonBySlug(ref.slug) : local.getPerson(ref.id);
    const localResult = localPerson && {
      person: { ...localPerson, slug: localPerson.id },
      detail: null,
    };
    if (parent && !parent.detail)
      return localPerson && isRelated(parent, localPerson.id) ? localResult : null;
    const detail =
      "slug" in ref ? await online.getPersonBySlug(ref.slug) : await online.getPerson(ref.id);
    if (
      detail &&
      (!city || detail.linkedPois.some((poi) => poi.city === city)) &&
      (!parent || isRelated(parent, detail.id))
    )
      return { person: toVisitorPerson(detail), detail };
    // A local-only standalone profile is visible only through a still-visible local Story.
    if ("slug" in ref && !parent && localPerson) {
      const localCity = city ?? local.getCatalogCity();
      for (const poi of local.getPois(localCity)) {
        if (
          !local
            .getStoryContent(localCity, poi.id)
            ?.relatedPeople.some(({ personId }) => personId === localPerson.id)
        )
          continue;
        const story = await findStory(localCity, poi.id);
        if (story && !story.detail && isRelated(story, localPerson.id)) return localResult;
      }
    }
    return null;
  };

  return {
    map: async (city: string) => {
      let published: PublishedCityPreview;
      try {
        published = await online.getCity(city);
      } catch {
        return unavailable;
      }
      const visitorCity = toVisitorCity(published);
      const aliases: Record<string, string> = {};
      const localPois = local.getPois(published.city).filter((poi) => {
        const match = published.pois.find((candidate) => matchesPoiIdentity(poi, candidate));
        if (match) aliases[poi.id] = match.id;
        return (
          !match && !published.removedPois?.some((removed) => matchesPoiIdentity(poi, removed))
        );
      });
      const categories = new Map(
        local.getCategoryDefinitions().map((category) => [category.id, category]),
      );
      for (const category of visitorCity.categoryDefinitions)
        categories.set(category.id, { ...categories.get(category.id), ...category });
      const pois = [...visitorCity.pois, ...localPois];
      return {
        status: "found" as const,
        pois,
        categoryDefinitions: [...categories.values()],
        aliases,
        // Totals count online publications only, not local-only POIs.
        publishedCounts: { places: published.pois.length, people: published.peopleCount ?? 0 },
        findLinkedPoi: (link: PoiLink) => findLinkedPoi(pois, aliases, link),
      };
    },

    /** A POI's visible Story, by POI ID, legacy local ID or online UUID. */
    story: async (city: string, poiId: string) => {
      try {
        const story = await findStory(city, poiId);
        return story
          ? { status: "found" as const, story: await withPeopleByBirth(story) }
          : notFound;
      } catch {
        return unavailable;
      }
    },

    /** A Person by ID or slug; with a city and POI, only one of that visible Story's Related People. */
    person: async (
      ref: { id: string } | { slug: string },
      context: { city?: string; poiId?: string } = {},
    ) => {
      try {
        const found = await findPerson(ref, context);
        return found ? { status: "found" as const, ...found } : notFound;
      } catch {
        return unavailable;
      }
    },
  };
};
