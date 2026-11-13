// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ThemeSwitch } from "./ThemeSwitch";

beforeAll(() => {
  // jsdom does not provide the layout observer used by Headless UI dropdowns.
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

describe("ThemeSwitch", () => {
  it("applies and remembers a chosen theme, and returns to the system setting", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitch tone="light" />);

    await user.click(screen.getByRole("button", { name: "Theme: System" }));
    await user.click(screen.getByRole("option", { name: "Dark" }));
    expect(screen.getByRole("button", { name: "Theme: Dark" })).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("mira-theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Theme: Dark" }));
    await user.click(screen.getByRole("option", { name: "System" }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem("mira-theme")).toBeNull();
  });
});
