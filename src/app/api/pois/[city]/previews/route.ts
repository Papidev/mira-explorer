import { visitorContent } from "@/server/visitorContent";
import { mergeVisitorCity } from "@/server/visitorContent/mergeCity";
import { publicCatalog } from "@/server/publicCatalog";

type Context = {
  params: Promise<{ city: string }>;
};

/**
 * Preview text and main image of every place on the city map. The map page leaves them out
 * of its HTML and loads them once the map is drawn, so they never delay the start-up.
 */
export const GET = async (_request: Request, { params }: Context) => {
  const { city } = await params;
  try {
    const { pois } = mergeVisitorCity(await visitorContent.getCity(city), publicCatalog);
    const previews = Object.fromEntries(
      pois.map(({ id, previewDescription, shortDescription, mainImageUrl }) => [
        id,
        { previewDescription, shortDescription, mainImageUrl },
      ]),
    );
    // Short, so the CDN adds at most a minute to the online reads' 10-minute recheck.
    return Response.json({ previews }, { headers: { "Cache-Control": "public, s-maxage=60" } });
  } catch {
    return Response.json(
      { previews: null },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
};
