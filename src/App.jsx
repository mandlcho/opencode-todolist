import { useMemo, useState } from "react";
import { useTodos } from "./hooks/useTodos";
import "./App.css";

const FILTERS = {
  backlog: (todo) => todo.status === "backlog",
  active: (todo) => todo.status === "active",
  completed: (todo) => todo.status === "completed"
};

const CARD_COLUMNS = [
  { key: "backlog", label: "backlog" },
  { key: "active", label: "active" },
  { key: "completed", label: "done" }
];

const formatTimestamp = (value) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch (error) {
    return value;
  }
};

function App() {
  const { todos, setTodos, stats } = useTodos();
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("backlog");
  const [viewMode, setViewMode] = useState("list");

  const filteredTodos = useMemo(
    () => todos.filter(FILTERS[filter]),
    [todos, filter]
  );

  const boardColumns = useMemo(
    () =>
      CARD_COLUMNS.map(({ key, label }) => ({
        key,
        label,
        todos: todos.filter(FILTERS[key])
      })),
    [todos]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim()) return;

    const nextTodo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      status: "backlog",
      completed: false,
      activatedAt: null,
      createdAt: new Date().toISOString()
    };

    setTodos((prev) => [nextTodo, ...prev]);
    setTitle("");
  };

  const updateTodoStatus = (id, status) => {
    const timestamp = new Date().toISOString();
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              status,
              completed: status === "completed",
              activatedAt:
                status === "active"
                  ? todo.activatedAt ?? timestamp
                  : status === "completed"
                  ? todo.activatedAt ?? timestamp
                  : null,
              completedAt: status === "completed" ? timestamp : null
            }
          : todo
      )
    );
  };

  const toggleTodo = (id, checked) => {
    updateTodoStatus(id, checked ? "completed" : "active");
  };

  const moveToBacklog = (id) => {
    updateTodoStatus(id, "backlog");
  };

  const moveToActive = (id) => {
    updateTodoStatus(id, "active");
  };

  const removeTodo = (id) => {
    setTodos((prev) =>
      prev.filter((todo) => todo.id !== id)
    );
  };

  const handleDismiss = (todo) => {
    if (todo.status === "active") {
      moveToBacklog(todo.id);
      return;
    }
    removeTodo(todo.id);
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((todo) => todo.status !== "completed"));
  };

  const renderTodo = (todo, variant = "list") => {
    const createdLabel = formatTimestamp(todo.createdAt);
    const activatedLabel = todo.activatedAt
      ? formatTimestamp(todo.activatedAt)
      : null;
    const completedLabel = todo.completedAt
      ? formatTimestamp(todo.completedAt)
      : null;
    const isCard = variant === "card";
    const dismissAriaLabel =
      todo.status === "active"
        ? `return ${todo.title} to backlog`
        : `delete ${todo.title}`;
    const footerActions = (
      <>
        {todo.status === "backlog" && (
          <button
            type="button"
            onClick={() => moveToActive(todo.id)}
            aria-label={`start ${todo.title}`}
          >
            start
          </button>
        )}
        {todo.status === "active" && (
          <button
            type="button"
            onClick={() => updateTodoStatus(todo.id, "completed")}
            aria-label={`mark ${todo.title} as done`}
          >
            done
          </button>
        )}
        {!isCard && (
          <button
            type="button"
            onClick={() => handleDismiss(todo)}
            aria-label={dismissAriaLabel}
          >
            ×
          </button>
        )}
      </>
    );

    const showFooterActions =
      todo.status === "backlog" ||
      todo.status === "active" ||
      !isCard;

    if (isCard) {
      return (
        <li
          key={todo.id}
          className={`todo${todo.completed ? " completed" : ""} todo-card`}
        >
          <div className="todo-card-header">
            <label className="todo-label">
              <input
                type="checkbox"
                checked={todo.status === "completed"}
                onChange={(event) => toggleTodo(todo.id, event.target.checked)}
              />
              <span>{todo.title}</span>
            </label>
            <button
              type="button"
              className="todo-dismiss"
              onClick={() => handleDismiss(todo)}
              aria-label={dismissAriaLabel}
            >
              ×
            </button>
          </div>
          <div className="todo-footer card-footer">
            <div className="todo-meta">
              <span>created: {createdLabel || "unknown"}</span>
              <span>
                activated: {activatedLabel ? activatedLabel : "not yet"}
              </span>
              {completedLabel && <span>done: {completedLabel}</span>}
            </div>
            {showFooterActions && (
              <div className="todo-actions card-actions">{footerActions}</div>
            )}
          </div>
        </li>
      );
    }

    return (
      <li
        key={todo.id}
        className={`todo${todo.completed ? " completed" : ""}`}
      >
        <div className="todo-content">
          <label className="todo-label">
            <input
              type="checkbox"
              checked={todo.status === "completed"}
              onChange={(event) => toggleTodo(todo.id, event.target.checked)}
            />
            <span>{todo.title}</span>
          </label>
        </div>
        <div className="todo-footer">
          <div className="todo-meta">
            <span>created: {createdLabel || "unknown"}</span>
            <span>
              activated: {activatedLabel ? activatedLabel : "not yet"}
            </span>
            {completedLabel && <span>done: {completedLabel}</span>}
          </div>
          <div className="todo-actions">{footerActions}</div>
        </div>
      </li>
    );
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>tasks</h1>
          <p>simple task app</p>
        </div>
        <div className="view-toggles" role="group" aria-label="view mode">
          <button
            type="button"
            className={viewMode === "list" ? "view-option active" : "view-option"}
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
          >
            list
          </button>
          <button
            type="button"
            className={viewMode === "card" ? "view-option active" : "view-option"}
            onClick={() => setViewMode("card")}
            aria-pressed={viewMode === "card"}
          >
            card
          </button>
        </div>
      </header>

      <section className="composer">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="add a task to backlog"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="task title"
            required
            autoComplete="off"
          />
          <button type="submit">add</button>
        </form>
        {viewMode === "list" && (
          <div className="filters" role="radiogroup" aria-label="filter todos">
            {CARD_COLUMNS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={filter === key ? "active" : ""}
                onClick={() => setFilter(key)}
                role="radio"
                aria-checked={filter === key}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section
        className={`todo-list${viewMode === "card" ? " card-view" : ""}`}
        aria-live="polite"
      >
        {viewMode === "card" ? (
          todos.length === 0 ? (
            <p className="empty-state">no todos yet. add one above.</p>
          ) : (
            <div className="todo-board">
              {boardColumns.map(({ key, label, todos: columnTodos }) => (
                <div key={key} className="todo-column">
                  <h2>{label}</h2>
                  {columnTodos.length === 0 ? (
                    <p className="column-empty">nothing here yet</p>
                  ) : (
                    <ul>{columnTodos.map((todo) => renderTodo(todo, "card"))}</ul>
                  )}
                </div>
              ))}
            </div>
          )
        ) : filteredTodos.length === 0 ? (
          <p className="empty-state">
            {filter === "active"
              ? "no tasks are active."
              : filter === "completed"
              ? "no tasks done yet."
              : "no todos yet. add one above."}
          </p>
        ) : (
          <ul>{filteredTodos.map((todo) => renderTodo(todo))}</ul>
        )}
      </section>

      <footer className="app-footer">
        <div className="footer-stats">
          <span>total: {stats.total}</span>
          <span>done: {stats.completed}</span>
          <span>remaining: {stats.remaining}</span>
        </div>
        <button type="button" onClick={clearCompleted} disabled={stats.completed === 0}>
          clear done
        </button>
      </footer>
    </main>
  );
}

export default App;
