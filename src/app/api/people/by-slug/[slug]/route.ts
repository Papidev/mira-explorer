import { visitorContent } from "@/server/visitorContent";
import { createVisitorHandler } from "@/server/visitorContent/handler";
import { publicCatalog } from "@/server/publicCatalog";

export const GET = async (request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const query = new URL(request.url).searchParams;
  return createVisitorHandler(visitorContent, publicCatalog).getPerson(
    slug,
    query.get("city") ?? undefined,
    query.get("poiId") ?? undefined,
    true,
  );
};
