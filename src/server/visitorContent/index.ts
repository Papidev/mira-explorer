import "server-only";
import { getContentPool } from "@/server/content/database";
import { createPostgresContent } from "@/server/content/postgresContent";
import { createVisitorReads } from "./reads";

// Keys include the deployment, so redeploying resets the cache after changes made outside the API.
export const visitorContent = createVisitorReads(
  () => createPostgresContent(getContentPool()),
  process.env.VERCEL_DEPLOYMENT_ID,
);
