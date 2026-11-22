import { after } from "next/server";
import { getContentPool } from "@/server/content/database";
import { createContentHandler } from "@/server/content/handler";
import { createPostgresContent } from "@/server/content/postgresContent";
import { createVisitorClear } from "@/server/visitorContent/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const clearVisitorContent = createVisitorClear(after);
const handle = createContentHandler(() =>
  createPostgresContent(getContentPool(), clearVisitorContent),
);
export {
  handle as GET,
  handle as PUT,
  handle as POST,
  handle as PATCH,
  handle as DELETE,
  handle as HEAD,
  handle as OPTIONS,
};
