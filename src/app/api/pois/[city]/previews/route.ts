import { visitorContent } from "@/server/visitorContent";

type Context = {
  params: Promise<{ city: string }>;
};

/**
 * Preview text and main image of every place on the city map. The map page leaves them out
 * of its HTML and loads them once the map is drawn, so they never delay the start-up.
 */
export const GET = async (_request: Request, { params }: Context) => {
  const { city } = await params;
  const map = await visitorContent.map(city);
  if (map.status === "found") {
    const previews = Object.fromEntries(
      map.pois.map(({ id, previewDescription, shortDescription, mainImageUrl }) => [
        id,
        { previewDescription, shortDescription, mainImageUrl },
      ]),
    );
    // Short, so the CDN adds at most a minute to the online reads' 10-minute recheck.
    return Response.json({ previews }, { headers: { "Cache-Control": "public, s-maxage=60" } });
  }
  return Response.json(
    { previews: null },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
};
