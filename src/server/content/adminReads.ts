import { z } from "zod";
import { publishedPersonSchema, publishedPoiDetailSchema } from "./publishedContent";
const generationSchema = z.object({
  provider: z.string(),
  model: z.string(),
  completedAt: z.iso.datetime(),
});

export const adminPersonProfileSchema = z.object({
  personId: z.string().min(1),
  wikidataId: z.string().regex(/^Q[1-9]\d*$/),
  profileVersion: z.uuid(),
  person: publishedPersonSchema,
  generation: generationSchema,
});

export const adminPeopleIdsSchema = z
  .array(z.string().regex(/^[a-z0-9][a-z0-9-]*$/))
  .min(1)
  .max(100)
  .refine((values) => new Set(values).size === values.length);

// A saved Story lists its People in `detail.story.relatedPeople`; their profiles are a separate read.
export const adminSavedStorySchema = z.object({
  detail: publishedPoiDetailSchema,
  generation: generationSchema,
});
