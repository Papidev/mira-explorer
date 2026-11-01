import "server-only";
import { getContentPool } from "@/server/content/database";
import { createPostgresContent } from "@/server/content/postgresContent";
import { createPublishedRead } from "./read";

export const visitorContent = {
  getPersonBySlug: createPublishedRead(
    async (slug) => (await createPostgresContent(getContentPool()).getPerson(slug, true)) ?? null,
  ),
  getCity: createPublishedRead(async (city) =>
    createPostgresContent(getContentPool()).getCityPreviews(city),
  ),
  getStory: createPublishedRead(
    async (poiId) => (await createPostgresContent(getContentPool()).getStory(poiId)) ?? null,
  ),
  getPerson: createPublishedRead(
    async (personId) => (await createPostgresContent(getContentPool()).getPerson(personId)) ?? null,
  ),
};
