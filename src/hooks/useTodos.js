import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "todo-react-app::todos";

export function useTodos() {
  const [todos, setTodos] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
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
    const completed = todos.filter((todo) => todo.completed).length;
    return {
      total,
      completed,
      remaining: total - completed
    };
  }, [todos]);

  return { todos, setTodos, stats };
}
