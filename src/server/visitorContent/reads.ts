import type { RuntimeCache } from "@vercel/functions";
import type { PublishedPerson } from "@mira/shared";
import type { createPostgresContent } from "@/server/content/postgresContent";
import { visitorLabels } from "@/server/content/visitorLabels";
import { createPublishedRead } from "./read";

// Vercel allows 128 tags per entry, and each also carries `all` and its Person.
const maxLinkedPoiLabels = 126;

const personLabels = (person: PublishedPerson | null) =>
  person
    ? [
        visitorLabels.person(person.id),
        // ponytail: above the limit any POI save clears this Person; split the entry if that becomes common.
        ...(person.linkedPois.length > maxLinkedPoiLabels
          ? [visitorLabels.anyPoi]
          : person.linkedPois.map(({ id }) => visitorLabels.poi(id))),
      ]
    : undefined;

// Missing identities and empty cities come from arbitrary URLs: they stay in instance memory only,
// where the 10-minute recheck also lets newly published content appear.
export const createVisitorReads = (
  getRepository: () => Pick<
    ReturnType<typeof createPostgresContent>,
    "getCityPreviews" | "getStory" | "getPerson"
  >,
  deployment: string | undefined,
  getShared?: () => Pick<RuntimeCache, "get" | "set">,
) => {
  const getStory = createPublishedRead(async (id) => (await getRepository().getStory(id)) ?? null, {
    name: "story",
    deployment,
    getShared,
    labels: (story) => (story ? [visitorLabels.poi(story.id)] : undefined),
  });
  return {
    getCity: createPublishedRead(async (city) => getRepository().getCityPreviews(city), {
      name: "map",
      deployment,
      getShared,
      labels: ({ pois, removedPois }) =>
        pois.length || removedPois?.length ? [visitorLabels.map] : undefined,
    }),
    // One entry per Story, whatever the case of the UUID in the URL.
    getStory: (id: string) => getStory(id.toLowerCase()),
    getPerson: createPublishedRead(async (id) => (await getRepository().getPerson(id)) ?? null, {
      name: "person",
      deployment,
      getShared,
      labels: personLabels,
    }),
    getPersonBySlug: createPublishedRead(
      async (slug) => (await getRepository().getPerson(slug, true)) ?? null,
      { name: "person-slug", deployment, getShared, labels: personLabels },
    ),
  };
};
