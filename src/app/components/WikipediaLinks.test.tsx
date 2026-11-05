// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import { WikipediaLinks } from "./WikipediaLinks";

beforeAll(() => {
  // jsdom does not provide the layout observer used by Headless UI menus.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = () => {};
      unobserve = () => {};
      disconnect = () => {};
    },
  );
});
afterEach(cleanup);
afterAll(() => vi.unstubAllGlobals());

it("keeps other editions hidden until requested and opens articles in new tabs", async () => {
  const user = userEvent.setup();
  render(
    <WikipediaLinks
      sources={[
        { title: "Foro Boario", url: "https://it.wikipedia.org/wiki/Foro_Boario" },
        { title: "Forum Boarium", url: "https://en.wikipedia.org/wiki/Forum_Boarium" },
      ]}
    />,
  );
  const primary = screen.getByRole("link", {
    name: "Forum Boarium on Wikipedia (opens in a new tab)",
  });
  expect(primary).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Forum_Boarium");
  expect(primary).toHaveAttribute("target", "_blank");
  expect(primary).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  await user.tab();
  await user.tab();
  const trigger = screen.getByRole("button", { name: "Other languages" });
  expect(trigger).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  const italian = screen.getByRole("menuitem", {
    name: "Foro Boario on Wikipedia (opens in a new tab)",
  });
  expect(italian).toHaveTextContent("Italian");
  expect(italian).toHaveAttribute("href", "https://it.wikipedia.org/wiki/Foro_Boario");
  expect(italian).toHaveAttribute("target", "_blank");
  expect(italian).toHaveAttribute("rel", "noopener noreferrer");
  await user.keyboard("{Escape}");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveFocus();
});

it("links a sole non-English edition without offering an empty language menu", () => {
  render(
    <WikipediaLinks
      sources={[{ title: "Foro Boario", url: "https://it.wikipedia.org/wiki/Foro_Boario" }]}
    />,
  );
  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    "https://it.wikipedia.org/wiki/Foro_Boario",
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("omits external reading controls for legacy content without a resolved URL", () => {
  const { container } = render(<WikipediaLinks />);
  expect(container).toBeEmptyDOMElement();
});
