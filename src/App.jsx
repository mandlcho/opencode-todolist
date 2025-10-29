import { useMemo, useState } from "react";
import { useTodos } from "./hooks/useTodos";
import "./App.css";

const FILTERS = {
  all: () => true,
  active: (todo) => !todo.completed,
  completed: (todo) => todo.completed
};

const CARD_COLUMNS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" }
];

function App() {
  const { todos, setTodos, stats } = useTodos();
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
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
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTodos((prev) => [nextTodo, ...prev]);
    setTitle("");
  };

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? { ...todo, completed: !todo.completed, completedAt: !todo.completed ? new Date().toISOString() : null }
          : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  };

  const renderTodo = (todo, variant = "list") => (
    <li
      key={todo.id}
      className={`todo${todo.completed ? " completed" : ""}${
        variant === "card" ? " todo-card" : ""
      }`}
    >
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => toggleTodo(todo.id)}
        />
        <span>{todo.title}</span>
      </label>
      <button
        type="button"
        onClick={() => deleteTodo(todo.id)}
        aria-label={`Delete ${todo.title}`}
      >
        ×
      </button>
    </li>
  );

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Todo React App</h1>
          <p>Persist todos locally. Everything stays in your browser.</p>
        </div>
        <button
          type="button"
          className="view-toggle"
          onClick={() => setViewMode((prev) => (prev === "list" ? "card" : "list"))}
          aria-pressed={viewMode === "card"}
        >
          {viewMode === "list" ? "Card view" : "List view"}
        </button>
      </header>

      <section className="composer">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            placeholder="Add a todo"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="Todo title"
            required
            autoComplete="off"
          />
          <button type="submit">Add</button>
        </form>
        <div className="filters" role="radiogroup" aria-label="Filter todos">
          {Object.keys(FILTERS).map((key) => (
            <button
              key={key}
              type="button"
              className={filter === key ? "active" : ""}
              onClick={() => setFilter(key)}
              role="radio"
              aria-checked={filter === key}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section
        className={`todo-list${viewMode === "card" ? " card-view" : ""}`}
        aria-live="polite"
      >
        {viewMode === "card" ? (
          todos.length === 0 ? (
            <p className="empty-state">No todos yet. Add one above.</p>
          ) : (
            <div className="todo-board">
              {boardColumns.map(({ key, label, todos: columnTodos }) => (
                <div key={key} className="todo-column">
                  <h2>{label}</h2>
                  {columnTodos.length === 0 ? (
                    <p className="column-empty">Nothing here yet</p>
                  ) : (
                    <ul>{columnTodos.map((todo) => renderTodo(todo, "card"))}</ul>
                  )}
                </div>
              ))}
            </div>
          )
        ) : filteredTodos.length === 0 ? (
          <p className="empty-state">No todos yet. Add one above.</p>
        ) : (
          <ul>{filteredTodos.map((todo) => renderTodo(todo))}</ul>
        )}
      </section>

      <footer className="app-footer">
        <span>Total: {stats.total}</span>
        <span>Completed: {stats.completed}</span>
        <span>Remaining: {stats.remaining}</span>
        <button type="button" onClick={clearCompleted} disabled={stats.completed === 0}>
          Clear completed
        </button>
      </footer>
    </main>
  );
}

export default App;
