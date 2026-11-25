import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { poiPath } from "@/app/rome/linkedPoi";
import { siteUrl } from "@/app/site";
import { visitorContent } from "@/server/visitorContent";

// Built per request from the published catalog, like the map, so it never reads the database at build time.
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  await connection();
  const map = await visitorContent.map("rome");
  if (map.status !== "found") throw new Error("Visitor content is unavailable.");
  return [
    { url: siteUrl },
    { url: `${siteUrl}/rome` },
    ...map.pois.map((poi) => ({ url: `${siteUrl}${poiPath(poi)}` })),
  ];
};

export default sitemap;
