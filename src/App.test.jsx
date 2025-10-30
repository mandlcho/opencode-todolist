import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("reorders todos when a priority focus is selected", () => {
    render(<App />);

    const titleInput = screen.getByPlaceholderText("add a task to backlog");
    const composerPriority = screen.getByLabelText("new task priority");
    const addButton = screen.getByRole("button", { name: /add/i });

    const addTodo = (title, priorityValue) => {
      if (priorityValue) {
        fireEvent.change(composerPriority, { target: { value: priorityValue } });
      }
      fireEvent.change(titleInput, { target: { value: title } });
      fireEvent.click(addButton);
    };

    addTodo("high priority task", "high");
    addTodo("low priority task", "low");
    addTodo("medium priority task", "medium");

    const list = screen.getByRole("list");
    const getTitles = () =>
      within(list)
        .getAllByRole("listitem")
        .map(
          (item) => item.querySelector(".todo-label span")?.textContent ?? ""
        );

    expect(getTitles()).toEqual([
      "medium priority task",
      "low priority task",
      "high priority task"
    ]);

    const focusGroup = screen.getByRole("group", { name: /focus priority/i });
    const [highButton, mediumButton, lowButton] =
      within(focusGroup).getAllByRole("button");

    fireEvent.click(highButton);
    expect(getTitles()).toEqual([
      "high priority task",
      "medium priority task",
      "low priority task"
    ]);

    fireEvent.click(lowButton);
    expect(getTitles()).toEqual([
      "low priority task",
      "medium priority task",
      "high priority task"
    ]);

    fireEvent.click(lowButton);
    expect(getTitles()).toEqual([
      "medium priority task",
      "low priority task",
      "high priority task"
    ]);
  });
});
