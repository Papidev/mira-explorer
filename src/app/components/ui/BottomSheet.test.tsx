// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BottomSheet } from "./BottomSheet";

afterEach(cleanup);

describe("BottomSheet", () => {
  it("opens as a preview, expands from the handle, and collapses again", async () => {
    const user = userEvent.setup();
    render(
      <BottomSheet open onClose={vi.fn()}>
        <p>Story text</p>
      </BottomSheet>,
    );

    expect(screen.getByText("Story text")).toBeInTheDocument();
    const handle = screen.getByRole("button", { name: "Expand details" });
    expect(handle).toHaveAttribute("aria-expanded", "false");

    await user.click(handle);
    expect(screen.getByRole("button", { name: "Collapse details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Collapse details" }));
    expect(screen.getByRole("button", { name: "Expand details" })).toBeInTheDocument();
  });

  it("hides its content from assistive technology while closed", () => {
    render(
      <BottomSheet open={false} onClose={vi.fn()}>
        <p>Story text</p>
      </BottomSheet>,
    );

    expect(screen.queryByRole("button", { name: "Expand details" })).not.toBeInTheDocument();
  });
});
