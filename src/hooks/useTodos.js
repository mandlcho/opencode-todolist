import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "todo-react-app::todos";

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
          const createdAt =
            typeof todo.createdAt === "string"
              ? todo.createdAt
              : new Date().toISOString();
          const activatedAt =
            typeof todo.activatedAt === "string" ? todo.activatedAt : null;
          const completedAt =
            typeof todo.completedAt === "string" ? todo.completedAt : null;
          return {
            ...todo,
            status,
            createdAt,
            activatedAt,
            completedAt: status === "completed" ? completedAt : null,
            completed: status === "completed"
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
