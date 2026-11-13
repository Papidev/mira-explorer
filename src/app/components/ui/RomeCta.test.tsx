// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { RomeCta } from "./RomeCta";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@vercel/analytics", () => ({ track }));
afterEach(cleanup);

it("links to the Rome map and reports which homepage placement was clicked", async () => {
  render(<RomeCta placement="numbers" label="Start exploring" />);

  const link = screen.getByRole("link", { name: "Start exploring" });
  expect(link).toHaveAttribute("href", "/rome");

  link.addEventListener("click", (event) => event.preventDefault());
  await userEvent.click(link);
  expect(track).toHaveBeenCalledWith("rome_cta_click", { placement: "numbers" });
});
