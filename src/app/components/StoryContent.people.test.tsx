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
      expect(screen.getByText("fountain")).toHaveClass("font-semibold", "text-story-emphasis");
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

  it.each(["markdown", undefined] as const)(
    "links names with Unicode spaces while preserving the Story text (%s)",
    async (textFormat) => {
      const opened: string[] = [];
      render(
        <StoryContent
          onOpenPerson={(id) => opened.push(id)}
          content={{
            textFormat,
            introduction: "Named after Nilde\u202fIotti.",
            topics: {
              history: [{ description: "Nilde\u202fIotti met President Roberto\u202fFico." }],
              design: [{ description: "Ernesto\u00a0Basile designed the library." }],
              art: [],
            },
            relatedPeople: [
              { name: "Nilde Iotti", personId: "nilde-iotti" },
              { name: "Roberto Fico", personId: "roberto-fico" },
              { name: "Ernesto Basile", personId: "ernesto-basile" },
            ],
          }}
        />,
      );
      for (const name of [/Nilde\sIotti/, /Roberto\sFico/, /Ernesto\sBasile/]) {
        expect(screen.getAllByRole("link", { name })).toHaveLength(1);
      }
      expect(screen.getByRole("link", { name: /Roberto\sFico/ }).textContent).toBe(
        "Roberto\u202fFico",
      );
      expect(screen.getByRole("link", { name: /Ernesto\sBasile/ }).textContent).toBe(
        "Ernesto\u00a0Basile",
      );
      await userEvent.setup().click(screen.getByRole("link", { name: /Roberto\sFico/ }));
      expect(opened).toEqual(["roberto-fico"]);
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
