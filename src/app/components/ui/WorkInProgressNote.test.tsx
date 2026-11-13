// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WorkInProgressNote } from "./WorkInProgressNote";

afterEach(cleanup);

describe("WorkInProgressNote", () => {
  it("shows the notice until the visitor dismisses it, then stays hidden", async () => {
    const user = userEvent.setup();
    render(<WorkInProgressNote />);

    expect(screen.getByText(/content may change/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss notice" }));
    expect(screen.queryByText(/content may change/)).not.toBeInTheDocument();

    cleanup();
    render(<WorkInProgressNote />);
    expect(screen.queryByText(/content may change/)).not.toBeInTheDocument();
  });
});
