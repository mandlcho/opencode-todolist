import { useMemo, useState } from "react";
import { useTodos } from "./hooks/useTodos";
import "./App.css";

const FILTERS = {
  all: () => true,
  active: (todo) => !todo.completed,
  completed: (todo) => todo.completed
};

function App() {
  const { todos, setTodos, stats } = useTodos();
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredTodos = useMemo(
    () => todos.filter(FILTERS[filter]),
    [todos, filter]
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

  return (
    <main className="app-shell">
      <header>
        <h1>Todo React App</h1>
        <p>Persist todos locally. Everything stays in your browser.</p>
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

      <section className="todo-list" aria-live="polite">
        {filteredTodos.length === 0 ? (
          <p className="empty-state">No todos yet. Add one above.</p>
        ) : (
          <ul>
            {filteredTodos.map((todo) => (
              <li key={todo.id} className={todo.completed ? "todo completed" : "todo"}>
                <label>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                  />
                  <span>{todo.title}</span>
                </label>
                <button type="button" onClick={() => deleteTodo(todo.id)} aria-label={`Delete ${todo.title}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
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
