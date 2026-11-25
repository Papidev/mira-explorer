import { visitorContent } from "@/server/visitorContent";

type Context = {
  params: Promise<{ city: string; poiId: string }>;
};

export const GET = async (_request: Request, { params }: Context) => {
  const { city, poiId } = await params;
  const result = await visitorContent.story(city, poiId);
  const headers = { "Cache-Control": "no-store" };
  return result.status === "found"
    ? Response.json(result.story, { headers })
    : Response.json(
        { storyContent: null },
        { status: result.status === "not-found" ? 404 : 503, headers },
      );
};
