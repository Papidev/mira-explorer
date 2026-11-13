import { describe, expect, it } from "vitest";
import { shortenAttribution } from "./ImageAttribution";

describe("shortenAttribution", () => {
  it("keeps short credits unchanged", () => {
    expect(shortenAttribution("Wolfgang Moroder")).toBe("Wolfgang Moroder");
  });

  it("shortens long usage notes at a word boundary", () => {
    const short = shortenAttribution(
      "This Photo was taken by Wolfgang Moroder. Feel free to use my photos, but please mention me as the author and send me a message.",
    );
    expect(short.length).toBeLessThanOrEqual(81);
    expect(short).toMatch(/^This Photo was taken by Wolfgang Moroder\. .*[a-z]…$/);
  });
});
