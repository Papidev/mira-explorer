import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { getLocalDataDirectory } from "./localData";
import { readGenerationMetadata, replaceGenerationCheckpoint } from "./generationMetadata";
import { readGenerationRuns, writeGenerationLogEntry } from "./generationRunLog";
import { getDefaultInputPath, getDefaultOutputDir } from "./wikiPipeline/io";

const originalWorkingDirectory = process.cwd();
const originalDirectory = process.env.HISTORICAL_EXPLORER_LOCAL_DATA_DIR;
let directory: string;

beforeEach(() => {
  directory = realpathSync(mkdtempSync(path.join(tmpdir(), "local-data-")));
  for (const checkout of ["main", "worktree"]) {
    mkdirSync(path.join(directory, checkout, "data", "rome", "pois"), { recursive: true });
  }
  process.env.HISTORICAL_EXPLORER_LOCAL_DATA_DIR = path.join(directory, "shared");
  process.chdir(path.join(directory, "main"));
});

afterEach(() => {
  process.chdir(originalWorkingDirectory);
  if (originalDirectory === undefined) delete process.env.HISTORICAL_EXPLORER_LOCAL_DATA_DIR;
  else process.env.HISTORICAL_EXPLORER_LOCAL_DATA_DIR = originalDirectory;
  rmSync(directory, { recursive: true, force: true });
});

it("uses the same external default regardless of the checkout", () => {
  delete process.env.HISTORICAL_EXPLORER_LOCAL_DATA_DIR;
  expect(getLocalDataDirectory()).toBe(
    path.join(homedir(), ".local", "share", "historical-explorer"),
  );
  process.chdir(path.join(directory, "worktree"));
  expect(getLocalDataDirectory()).toBe(
    path.join(homedir(), ".local", "share", "historical-explorer"),
  );
});

it("shares Sources, checkpoints and logs without links while keeping POIs in each branch", () => {
  mkdirSync(getDefaultOutputDir("rome"), { recursive: true });
  writeFileSync(path.join(getDefaultOutputDir("rome"), "tower.txt"), "Shared Wikipedia Source");
  replaceGenerationCheckpoint("rome", "tower", "wiki", {
    durationMs: 1,
    completedAt: "2026-10-14T00:00:00.000Z",
  });
  writeGenerationLogEntry({
    city: "rome",
    operation: "draftStory.generate",
    runId: "shared-run",
    at: "2026-10-14T00:00:00.000Z",
    event: "completed",
  });

  for (const checkout of ["main", "worktree"]) {
    process.chdir(path.join(directory, checkout));
    writeFileSync(
      getDefaultInputPath("rome"),
      JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "tower",
            wikidataId: "Q1",
            properties: { name: checkout },
            geometry: { type: "Point", coordinates: [12, 41] },
          },
        ],
      }),
    );

    expect(readFileSync(path.join(getDefaultOutputDir("rome"), "tower.txt"), "utf8")).toBe(
      "Shared Wikipedia Source",
    );
    expect(readGenerationMetadata("rome").tower.wiki?.durationMs).toBe(1);
    expect(readGenerationRuns("rome")[0].runId).toBe("shared-run");
    expect(existsSync(path.join("data", "rome", "generated"))).toBe(false);
    expect(existsSync(path.join("data", "generated"))).toBe(false);
    expect(getDefaultInputPath("rome")).toBe(
      path.join(directory, checkout, "data", "rome", "pois", "pois.geojson"),
    );
  }
});
