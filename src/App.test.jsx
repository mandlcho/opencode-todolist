import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

    const focusGroup = screen.getByRole("group", {
      name: /filter tasks by priority/i
    });
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

  it("archives completed tasks and shows them in the drawer", async () => {
    render(<App />);

    const titleInput = screen.getByPlaceholderText("add a task to backlog");
    const addButton = screen.getByRole("button", { name: /add/i });

    fireEvent.change(titleInput, { target: { value: "archive me" } });
    fireEvent.click(addButton);

    const checkbox = screen.getByRole("checkbox", { name: /archive me/i });
    fireEvent.click(checkbox);

    const archiveButton = screen.getByRole("button", { name: /^archive$/i });
    fireEvent.click(archiveButton);

    await waitFor(() =>
      expect(
        screen.queryByRole("checkbox", { name: /archive me/i })
      ).not.toBeInTheDocument()
    );

    const showArchiveButton = await screen.findByRole("button", {
      name: /show archived \(1\)/i
    });

    expect(showArchiveButton).toBeEnabled();

    const drawer = document.getElementById("archive-drawer");
    if (!drawer) {
      throw new Error("archive drawer not found");
    }
    expect(drawer).not.toHaveClass("open");

    fireEvent.click(showArchiveButton);

    expect(drawer).toHaveClass("open");
    expect(within(drawer).getAllByText("archive me")).toHaveLength(1);

    const hideArchiveButton = screen.getByRole("button", {
      name: /hide archived/i
    });
    expect(hideArchiveButton).toBeInTheDocument();
  });
});
