import type { MainImageCandidate } from "@/server/wikiPipeline/types";
import type { StoryContent } from "./storyContent";

// A saved local Story read from data/<city>/stories. Mira Admin owns Draft Story Generation.
export type DraftStorySnapshot = {
  poiId: string;
  storyContent?: StoryContent;
  draftMainImage?: MainImageCandidate;
};
