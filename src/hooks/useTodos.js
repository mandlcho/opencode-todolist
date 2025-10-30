import { useEffect, useMemo, useState } from "react";

export const TODO_PRIORITIES = ["high", "medium", "low"];
export const DEFAULT_PRIORITY = "medium";

const STORAGE_KEY = "todo-react-app::todos";
const VALID_PRIORITIES = new Set(TODO_PRIORITIES);

export function useTodos() {
  const [todos, setTodos] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((todo) => {
          const hasStatus = typeof todo.status === "string";
          const status = hasStatus
            ? todo.status
            : todo.completed
            ? "completed"
            : "backlog";
          const description =
            typeof todo.description === "string" ? todo.description : "";
          const createdAt =
            typeof todo.createdAt === "string"
              ? todo.createdAt
              : new Date().toISOString();
          const activatedAt =
            typeof todo.activatedAt === "string" ? todo.activatedAt : null;
          const completedAt =
            typeof todo.completedAt === "string" ? todo.completedAt : null;
          const priority =
            typeof todo.priority === "string" && VALID_PRIORITIES.has(todo.priority)
              ? todo.priority
              : DEFAULT_PRIORITY;
          return {
            ...todo,
            status,
            description,
            createdAt,
            activatedAt,
            completedAt: status === "completed" ? completedAt : null,
            completed: status === "completed",
            priority
          };
        });
      }
      return [];
    } catch (error) {
      console.warn("Failed to read todos from storage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
      console.warn("Failed to persist todos", error);
    }
  }, [todos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((todo) => todo.status === "completed").length;
    const active = todos.filter((todo) => todo.status === "active").length;
    const backlog = todos.filter((todo) => todo.status === "backlog").length;
    return {
      total,
      backlog,
      active,
      completed,
      remaining: total - completed
    };
  }, [todos]);

  return { todos, setTodos, stats };
}
