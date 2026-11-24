import type { MetadataRoute } from "next";
import { siteUrl } from "@/app/site";

const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: "*", allow: "/", disallow: "/api/" },
  sitemap: `${siteUrl}/sitemap.xml`,
});

export default robots;
