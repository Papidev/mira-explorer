// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeSwitch } from "./ThemeSwitch";

afterEach(cleanup);

describe("ThemeSwitch", () => {
  it("toggles between light and dark and remembers the choice", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitch tone="light" />);

    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("mira-theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Switch to light theme" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("mira-theme")).toBe("light");
  });
});
