// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { expect, it } from "vitest";
import { CategoryOption } from "./CategoryOption";

it("shows Sport's icon and blue pin when the top-level category has no subcategories", () => {
  const { container } = render(
    <CategoryOption
      category="sport"
      definitions={[{ id: "sport", name: "Sport", label: "Sport" }]}
      count={1}
      checked
      onToggle={() => {}}
    />,
  );

  expect(screen.getByRole("checkbox", { name: "Sport" })).toBeChecked();
  // The category symbol is decorative and deliberately hidden from accessible queries.
  expect(container.querySelector('img[src="/icons/categories/sport.svg"]')).toHaveClass("size-4");
  expect(container.querySelector(".text-blue-600")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
