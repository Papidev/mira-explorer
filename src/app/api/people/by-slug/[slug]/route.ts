import { visitorContent } from "@/server/visitorContent";

export const GET = async (request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const query = new URL(request.url).searchParams;
  const result = await visitorContent.person(
    { slug: slug },
    { city: query.get("city") ?? undefined, poiId: query.get("poiId") ?? undefined },
  );
  const headers = { "Cache-Control": "no-store" };
  return result.status === "found"
    ? Response.json({ person: result.person, detail: result.detail }, { headers })
    : Response.json(
        { person: null },
        { status: result.status === "not-found" ? 404 : 503, headers },
      );
};
