import { describe, expect, it } from "vitest";
import { poiJsonLd, toJsonLdScript } from "./poiJsonLd";

const araPacis = {
  id: "0b6f3c1e-8c1a-4a55-9a51-1c2f8f7c9d10",
  slug: "ara-pacis",
  wikidataId: "Q244953",
  name: "Ara Pacis",
  city: "rome",
  coordinates: { lat: 41.906, lng: 12.475 },
  mainImageUrl: "https://upload.wikimedia.org/wikipedia/commons/ara.jpg",
};

describe("place structured data", () => {
  it("describes a place with its location, image, page and Wikidata identity", () => {
    expect(poiJsonLd(araPacis, "An altar to Peace.")).toEqual({
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      name: "Ara Pacis",
      description: "An altar to Peace.",
      url: "https://www.explorewithmira.app/rome?poi=ara-pacis",
      geo: { "@type": "GeoCoordinates", latitude: 41.906, longitude: 12.475 },
      image: "https://upload.wikimedia.org/wikipedia/commons/ara.jpg",
      sameAs: "https://www.wikidata.org/wiki/Q244953",
    });
  });

  it("leaves out what a place does not have", () => {
    const bare = { ...araPacis, mainImageUrl: undefined, wikidataId: undefined };
    expect(poiJsonLd(bare, "")).not.toHaveProperty("image");
    expect(poiJsonLd(bare, "")).not.toHaveProperty("sameAs");
  });

  it("cannot close its script tag from content", () => {
    const script = toJsonLdScript(poiJsonLd(araPacis, "</script><script>alert(1)</script>"));
    expect(script).not.toContain("<");
    expect(JSON.parse(script).description).toBe("</script><script>alert(1)</script>");
  });
});
