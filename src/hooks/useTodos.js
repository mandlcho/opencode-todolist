import { useEffect, useMemo, useState } from "react";

export const TODO_PRIORITIES = ["high", "medium", "low"];
export const DEFAULT_PRIORITY = "medium";

const STORAGE_KEY = "todo-react-app::todos";
const VALID_PRIORITIES = new Set(TODO_PRIORITIES);
const EMPTY_STATE = { todos: [], archived: [] };

const normalizeTodo = (todo, { archived = false } = {}) => {
  if (!todo || typeof todo !== "object") {
    return null;
  }
  const hasStatus = typeof todo.status === "string";
  const rawStatus = hasStatus
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
  const status = archived ? "completed" : rawStatus;
  const isCompleted = status === "completed";
  const archivedAt =
    typeof todo.archivedAt === "string"
      ? todo.archivedAt
      : archived
      ? completedAt ?? null
      : null;

  return {
    ...todo,
    status,
    description,
    createdAt,
    activatedAt,
    completedAt: isCompleted ? completedAt : null,
    completed: isCompleted,
    priority,
    archivedAt
  };
};

const readInitialState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const todos = parsed
        .map((todo) => normalizeTodo(todo))
        .filter(Boolean);
      return { todos, archived: [] };
    }
    if (parsed && typeof parsed === "object") {
      const todos = Array.isArray(parsed.todos) ? parsed.todos : [];
      const archived = Array.isArray(parsed.archived) ? parsed.archived : [];
      return {
        todos: todos.map((todo) => normalizeTodo(todo)).filter(Boolean),
        archived: archived
          .map((todo) => normalizeTodo(todo, { archived: true }))
          .filter(Boolean)
      };
    }
  } catch (error) {
    console.warn("Failed to read todos from storage", error);
  }
  return EMPTY_STATE;
};

export function useTodos() {
  const initialState = useMemo(() => readInitialState(), []);
  const [todos, setTodos] = useState(initialState.todos);
  const [archivedTodos, setArchivedTodos] = useState(initialState.archived);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ todos, archived: archivedTodos })
      );
    } catch (error) {
      console.warn("Failed to persist todos", error);
    }
  }, [todos, archivedTodos]);

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

  return { todos, setTodos, stats, archivedTodos, setArchivedTodos };
}
