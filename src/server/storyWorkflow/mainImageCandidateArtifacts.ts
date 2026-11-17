import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { sanitizePoiIdForFile, toCitySlug } from "@/server/wikiPipeline/normalize";
import { mainImageCandidatesArtifactSchema } from "@/server/wikiPipeline/types";

export const readMainImageCandidateArtifact = (city: string, poiId: string) => {
  const filePath = path.join(
    process.cwd(),
    "data",
    toCitySlug(city),
    "stories",
    sanitizePoiIdForFile(poiId),
    "images.json",
  );
  if (!existsSync(filePath)) {
    return undefined;
  }

  try {
    return mainImageCandidatesArtifactSchema.parse(JSON.parse(readFileSync(filePath, "utf-8")));
  } catch (error) {
    throw new Error(`Invalid Main Image Candidates file ${filePath}: ${String(error)}`, {
      cause: error,
    });
  }
};
