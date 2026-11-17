import { z } from "zod";

export const mainImageCandidateSchema = z
  .object({
    commonsFileName: z.string().min(1),
    commonsPageUrl: z.url(),
    thumbnailUrl: z.url(),
    originalImageUrl: z.url(),
    license: z.string().optional(),
    attribution: z.string().optional(),
    author: z.string().optional(),
    width: z.number().int().nonnegative().optional(),
    height: z.number().int().nonnegative().optional(),
    discoveredVia: z.enum(["wikidata-p18", "wikipedia-page-image", "commons-category"]),
    isProposed: z.boolean(),
  })
  .strict();

export type MainImageCandidate = z.infer<typeof mainImageCandidateSchema>;

export const mainImageCandidatesArtifactSchema = z
  .object({
    candidates: z.array(mainImageCandidateSchema),
    selectedCommonsFileName: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((artifact, context) => {
    if (
      artifact.selectedCommonsFileName &&
      !artifact.candidates.some(
        (candidate) => candidate.commonsFileName === artifact.selectedCommonsFileName,
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["selectedCommonsFileName"],
        message: "Selected Main Image must reference an available candidate.",
      });
    }
  });
