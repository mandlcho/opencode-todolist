import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

// Smoke test to ensure the component renders without crashing.
describe("App", () => {
  it("renders heading", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /todo react app/i })
    ).toBeInTheDocument();
  });
});
