// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { StrictMode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { StoryContent } from "./StoryContent";

afterEach(cleanup);

describe("People mentioned in a Story", () => {
  it.each(["markdown", undefined] as const)(
    "links only the first mention across the Story (%s)",
    async (textFormat) => {
      const opened: string[] = [];
      const content = {
        textFormat,
        introduction: textFormat
          ? "**Bernini** made the **fountain**. Bernini returned."
          : "Bernini made the fountain. Bernini returned.",
        introductionEmphasis: ["Bernini", "fountain"],
        topics: {
          history: [{ description: "Bernini worked here before Borromini." }],
          design: [{ description: "Borromini studied the building." }],
          art: [{ description: "Bernini and Borromini." }],
        },
        relatedPeople: [
          { name: "Bernini", personId: "bernini" },
          { name: "Borromini", personId: "borromini" },
        ],
      };
      const { rerender } = render(
        <StrictMode>
          <StoryContent content={content} onOpenPerson={(id) => opened.push(id)} />
        </StrictMode>,
      );
      expect(screen.getAllByRole("link", { name: "Bernini" })).toHaveLength(1);
      expect(screen.getAllByRole("link", { name: "Borromini" })).toHaveLength(1);
      expect(screen.getByRole("link", { name: "Bernini" }).closest("strong")).toBeNull();
      expect(screen.getByText("fountain")).toHaveClass("font-semibold", "text-emphasis");
      expect(screen.getByText("fountain")).not.toHaveClass("underline");
      expect(screen.getByRole("link", { name: "Bernini" })).toHaveClass(
        "text-sky-800",
        "underline",
      );
      await userEvent.setup().click(screen.getByRole("link", { name: "Bernini" }));
      expect(opened).toEqual(["bernini"]);
      rerender(
        <StrictMode>
          <StoryContent content={content} onOpenPerson={(id) => opened.push(id)} />
        </StrictMode>,
      );
      expect(screen.getAllByRole("link", { name: "Bernini" })).toHaveLength(1);
    },
  );

  it("keeps existing links and avoids partial names and unresolved People", () => {
    render(
      <StoryContent
        onOpenPerson={() => {}}
        content={{
          textFormat: "markdown",
          introduction:
            "Berninian [Bernini](https://example.com) and Bernini. Annalisa met Anna. Missing arrived.",
          topics: { history: [], design: [], art: [] },
          relatedPeople: [
            { name: "Bernini", personId: "bernini" },
            { name: "Anna", personId: "anna" },
            { name: "Missing" },
          ],
        }}
      />,
    );
    expect(screen.getAllByRole("link", { name: "Bernini" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Bernini" })[0]).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(screen.getAllByRole("link", { name: "Anna" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Missing" })).not.toBeInTheDocument();
  });

  it("does not create Person links without an action to open the sheet", () => {
    render(
      <StoryContent
        content={{
          introduction: "Bernini.",
          topics: { history: [], design: [], art: [] },
          relatedPeople: [{ name: "Bernini", personId: "bernini" }],
        }}
      />,
    );
    expect(screen.queryByRole("link", { name: "Bernini" })).not.toBeInTheDocument();
  });
});
