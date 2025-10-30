import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

// Smoke test to ensure the component renders without crashing.
describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /tasks/i })).toBeInTheDocument();
  });

  it("allows setting and updating todo priority", () => {
    render(<App />);

    const titleInput = screen.getByPlaceholderText("add a task to backlog");
    const composerPriority = screen.getByLabelText("new task priority");

    expect(composerPriority).toHaveValue("medium");

    fireEvent.change(composerPriority, { target: { value: "high" } });
    fireEvent.change(titleInput, { target: { value: "write docs" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    const priorityBadge = screen.getByRole("button", {
      name: /priority high/i
    });
    fireEvent.click(priorityBadge);

    const mediumBadge = screen.getByRole("button", {
      name: /priority medium/i
    });
    fireEvent.click(mediumBadge);

    expect(
      screen.getByRole("button", { name: /priority low/i })
    ).toBeInTheDocument();
    expect(composerPriority).toHaveValue("medium");
  });
});
