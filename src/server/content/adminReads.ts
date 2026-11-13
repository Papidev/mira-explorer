import { z } from "zod";
import { publishedPersonSchema, publishedPoiDetailSchema } from "./publishedContent";
const personBaselineSchema = z.object({
  personId: z.string().min(1),
  wikidataId: z.string().regex(/^Q[1-9]\d*$/),
  profileVersion: z.uuid(),
});

export const adminSavedStorySchema = z.object({
  detail: publishedPoiDetailSchema,
  generation: z.object({ provider: z.string(), model: z.string(), completedAt: z.iso.datetime() }),
  people: z.array(
    personBaselineSchema.extend({
      person: publishedPersonSchema,
      generation: z.object({
        provider: z.string(),
        model: z.string(),
        completedAt: z.iso.datetime(),
      }),
    }),
  ),
});
