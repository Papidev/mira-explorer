import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { poiPath } from "@/app/rome/linkedPoi";
import { siteUrl } from "@/app/site";
import { publicCatalog } from "@/server/publicCatalog";
import { visitorContent } from "@/server/visitorContent";
import { mergeVisitorCity } from "@/server/visitorContent/mergeCity";

// Built per request from the published catalog, like the map, so it never reads the database at build time.
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  await connection();
  const { pois } = mergeVisitorCity(await visitorContent.getCity("rome"), publicCatalog);
  return [
    { url: siteUrl },
    { url: `${siteUrl}/rome` },
    ...pois.map((poi) => ({ url: `${siteUrl}${poiPath(poi)}` })),
  ];
};

export default sitemap;
