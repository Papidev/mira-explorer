import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { PoiCategory } from "@/types/PoiCategory";

// Saved POI Categories for local-only POIs. Online recalculation lives in content/categoryInterpretation.
export const readPoiCategories = (
  city: string,
  dataDirectory = path.join(process.cwd(), "data"),
): Record<string, PoiCategory[]> => {
  const categoriesPath = path.join(dataDirectory, city, "pois", "categories.json");
  return existsSync(categoriesPath)
    ? (JSON.parse(readFileSync(categoriesPath, "utf-8")) as { pois: Record<string, PoiCategory[]> })
        .pois
    : {};
};
