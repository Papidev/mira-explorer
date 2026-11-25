import "server-only";
import { getContentPool } from "@/server/content/database";
import { createPostgresContent } from "@/server/content/postgresContent";
import { publicCatalog } from "@/server/publicCatalog";
import { createVisitorContent } from "./createVisitorContent";
import { createOnlineVisitorReads } from "./reads";

// Keys include the deployment, so redeploying resets the cache after changes made outside the API.
export const onlineVisitorReads = createOnlineVisitorReads(
  () => createPostgresContent(getContentPool()),
  process.env.VERCEL_DEPLOYMENT_ID,
);

export const visitorContent = createVisitorContent({
  online: onlineVisitorReads,
  local: publicCatalog,
});
