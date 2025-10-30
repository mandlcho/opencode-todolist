import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTodos, TODO_PRIORITIES, DEFAULT_PRIORITY } from "./hooks/useTodos";
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

const PRIORITY_OPTIONS = TODO_PRIORITIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1)
}));

const getNextPriority = (current) => {
  const index = TODO_PRIORITIES.indexOf(current);
  if (index === -1) {
    return DEFAULT_PRIORITY;
  }
  return TODO_PRIORITIES[(index + 1) % TODO_PRIORITIES.length];
};

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
  const { todos, setTodos, stats, archivedTodos, setArchivedTodos } = useTodos();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(DEFAULT_PRIORITY);
  const [priorityFocus, setPriorityFocus] = useState("");
  const [filter, setFilter] = useState("backlog");
  const [viewMode, setViewMode] = useState("list");
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [draggingTodoId, setDraggingTodoId] = useState(null);
  const [dragOverTodoId, setDragOverTodoId] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState("before");
  const archiveDrawerRef = useRef(null);
  const archiveToggleRef = useRef(null);
  const isListView = viewMode === "list";

  useEffect(() => {
    if (archivedTodos.length === 0) {
      setIsArchiveOpen(false);
    }
  }, [archivedTodos.length]);

  useEffect(() => {
    if (!isArchiveOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const drawerNode = archiveDrawerRef.current;
      const toggleNode = archiveToggleRef.current;
      const target = event.target;

      if (
        (drawerNode && drawerNode.contains(target)) ||
        (toggleNode && toggleNode.contains(target))
      ) {
        return;
      }

      setIsArchiveOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isArchiveOpen, setIsArchiveOpen]);

  const resetDragState = useCallback(() => {
    setDraggingTodoId(null);
    setDragOverTodoId(null);
    setDragOverPosition("before");
  }, []);

  const handlePrioritySelect = (value) => {
    if (TODO_PRIORITIES.includes(value)) {
      setPriority(value);
    }
  };

  const handlePriorityFocus = (value) => {
    if (!TODO_PRIORITIES.includes(value)) {
      return;
    }
    setPriorityFocus((prev) => (prev === value ? "" : value));
  };

  const archiveCompleted = () => {
    if (todos.length === 0) {
      return;
    }

    const completedTodos = todos.filter(
      (todo) => todo.status === "completed" || todo.completed
    );

    if (completedTodos.length === 0) {
      return;
    }

    const archivedBatch = completedTodos.map((todo) => {
      const timestamp = new Date().toISOString();
      return {
        ...todo,
        status: "completed",
        completed: true,
        completedAt: todo.completedAt ?? timestamp,
        archivedAt: todo.archivedAt ?? timestamp
      };
    });

    const archivedIds = new Set(archivedBatch.map((todo) => todo.id));

    setTodos((prev) => prev.filter((todo) => !archivedIds.has(todo.id)));

    setArchivedTodos((prev) => {
      if (prev.length === 0) {
        return archivedBatch;
      }

      const merged = new Map(prev.map((todo) => [todo.id, todo]));
      archivedBatch.forEach((todo) => {
        const existing = merged.get(todo.id);
        merged.set(todo.id, existing ? { ...existing, ...todo } : todo);
      });

      const orderedNew = archivedBatch.map((todo) => merged.get(todo.id));
      const remaining = prev.filter((todo) => !archivedIds.has(todo.id));

      return [...orderedNew, ...remaining];
    });
  };

  const reorderByPriorityFocus = useCallback(
    (items) => {
      if (!priorityFocus || !TODO_PRIORITIES.includes(priorityFocus)) {
        return items;
      }
      const prioritized = [];
      const others = [];
      items.forEach((item) => {
        if (item.priority === priorityFocus) {
          prioritized.push(item);
        } else {
          others.push(item);
        }
      });
      return prioritized.length ? [...prioritized, ...others] : items;
    },
    [priorityFocus]
  );

  const filteredTodos = useMemo(() => {
    const list = todos.filter(FILTERS[filter]);
    return reorderByPriorityFocus(list);
  }, [todos, filter, reorderByPriorityFocus]);

  const reorderListTodos = useCallback(
    (sourceId, targetId, position = "before") => {
      if (!sourceId || sourceId === targetId) {
        return;
      }

      const displayIds = filteredTodos.map((todo) => todo.id);
      const sourceIndex = displayIds.indexOf(sourceId);
      if (sourceIndex === -1) {
        return;
      }

      const workingIds = [...displayIds];
      const [moved] = workingIds.splice(sourceIndex, 1);

      let insertionIndex;
      if (!targetId) {
        insertionIndex = workingIds.length;
      } else {
        const targetIndex = workingIds.indexOf(targetId);
        if (targetIndex === -1) {
          return;
        }
        insertionIndex = position === "after" ? targetIndex + 1 : targetIndex;
      }

      workingIds.splice(insertionIndex, 0, moved);

      const hasChanged = workingIds.some((id, index) => id !== displayIds[index]);
      if (!hasChanged) {
        return;
      }

      const displayIdSet = new Set(displayIds);

      setTodos((prev) => {
        const idToTodo = new Map(prev.map((todo) => [todo.id, todo]));
        const queue = workingIds.map((id) => idToTodo.get(id));
        if (queue.some((todo) => !todo)) {
          return prev;
        }

        const queueCopy = [...queue];
        const next = [];

        prev.forEach((todo) => {
          if (!displayIdSet.has(todo.id)) {
            next.push(todo);
            return;
          }

          const nextTodo = queueCopy.shift();
          if (nextTodo) {
            next.push(nextTodo);
          }
        });

        return next;
      });
    },
    [filteredTodos, setTodos]
  );

  const boardColumns = useMemo(
    () =>
      CARD_COLUMNS.map(({ key, label }) => ({
        key,
        label,
        todos: reorderByPriorityFocus(todos.filter(FILTERS[key]))
      })),
    [todos, reorderByPriorityFocus]
  );
  const sortedArchivedTodos = useMemo(() => {
    if (archivedTodos.length === 0) {
      return [];
    }
    return [...archivedTodos].sort((a, b) => {
      const aTime = new Date(a.archivedAt ?? a.completedAt ?? a.createdAt).getTime();
      const bTime = new Date(b.archivedAt ?? b.completedAt ?? b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [archivedTodos]);

  const handleListDragStart = useCallback(
    (event, todoId) => {
      if (!isListView) {
        return;
      }
      event.dataTransfer.effectAllowed = "move";
      try {
        event.dataTransfer.setData("text/plain", todoId);
      } catch (error) {
        // ignore browsers that disallow setData during dragstart
      }
      setDraggingTodoId(todoId);
      setDragOverTodoId(todoId);
      setDragOverPosition("before");
    },
    [isListView]
  );

  const handleListDragOver = useCallback(
    (event, todoId) => {
      if (!isListView || !draggingTodoId) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (!todoId || todoId === draggingTodoId) {
        return;
      }
      const bounds = event.currentTarget.getBoundingClientRect();
      const offsetY = event.clientY - bounds.top;
      const position = offsetY > bounds.height / 2 ? "after" : "before";

      setDragOverTodoId((prev) => (prev === todoId ? prev : todoId));
      setDragOverPosition((prev) => (prev === position ? prev : position));
    },
    [isListView, draggingTodoId]
  );

  const handleListDrop = useCallback(
    (event, todoId) => {
      if (!isListView || !draggingTodoId) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      reorderListTodos(draggingTodoId, todoId, dragOverPosition);
      resetDragState();
    },
    [
      isListView,
      draggingTodoId,
      dragOverPosition,
      reorderListTodos,
      resetDragState
    ]
  );

  const handleListContainerDragOver = useCallback(
    (event) => {
      if (!isListView || !draggingTodoId) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (event.target === event.currentTarget) {
        setDragOverTodoId(null);
        setDragOverPosition("after");
      }
    },
    [isListView, draggingTodoId]
  );

  const handleListContainerDrop = useCallback(
    (event) => {
      if (!isListView || !draggingTodoId) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      if (event.target === event.currentTarget) {
        reorderListTodos(draggingTodoId, null, "after");
      } else if (dragOverTodoId && dragOverTodoId !== draggingTodoId) {
        reorderListTodos(draggingTodoId, dragOverTodoId, dragOverPosition);
      }

      resetDragState();
    },
    [
      isListView,
      draggingTodoId,
      dragOverTodoId,
      dragOverPosition,
      reorderListTodos,
      resetDragState
    ]
  );

  const handleListDragEnd = useCallback(() => {
    if (!draggingTodoId) {
      return;
    }
    resetDragState();
  }, [draggingTodoId, resetDragState]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim()) return;

    const nextTodo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "backlog",
      completed: false,
      activatedAt: null,
      createdAt: new Date().toISOString()
    };

    setTodos((prev) => [nextTodo, ...prev]);
    setTitle("");
    setDescription("");
    setPriority(DEFAULT_PRIORITY);
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

  const removeArchivedTodo = (id) => {
    setArchivedTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const renderArchivedTodo = (todo) => {
    const currentPriority = TODO_PRIORITIES.includes(todo.priority)
      ? todo.priority
      : DEFAULT_PRIORITY;
    const archivedLabel = formatTimestamp(todo.archivedAt);
    const completedLabel = todo.completedAt ? formatTimestamp(todo.completedAt) : null;
    return (
      <li key={todo.id} className="archived-todo">
        <div className="archived-header">
          <span className="archived-title">{todo.title}</span>
          <div className="archived-actions">
            <span
              className={`todo-priority-badge priority-${currentPriority}`}
              aria-label={`priority ${currentPriority}`}
            >
              {currentPriority}
            </span>
            <button
              type="button"
              className="archived-delete"
              onClick={() => removeArchivedTodo(todo.id)}
              aria-label={`delete archived task ${todo.title}`}
            >
              X
            </button>
          </div>
        </div>
        <p
          className={`archived-description${
            todo.description ? "" : " archived-description--empty"
          }`}
        >
          {todo.description || "\u00a0"}
        </p>
        <div className="archived-meta">
          {archivedLabel && <span>archived: {archivedLabel}</span>}
          {completedLabel && archivedLabel !== completedLabel && (
            <span>done: {completedLabel}</span>
          )}
        </div>
      </li>
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

  const updateTodoPriority = (id, value) => {
    if (!TODO_PRIORITIES.includes(value)) {
      return;
    }
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, priority: value } : todo
      )
    );
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
      </>
    );

    const currentPriority = TODO_PRIORITIES.includes(todo.priority)
      ? todo.priority
      : DEFAULT_PRIORITY;

    const nextPriority = getNextPriority(currentPriority);

    const priorityBadge = (
      <button
        type="button"
        className={`todo-priority-badge priority-${currentPriority}`}
        onClick={() => updateTodoPriority(todo.id, nextPriority)}
        title={`priority: ${currentPriority}. click to set ${nextPriority}.`}
        aria-label={`priority ${currentPriority}. next: ${nextPriority}`}
      >
        {currentPriority}
      </button>
    );

    const showFooterActions =
      todo.status === "backlog" ||
      todo.status === "active" ||
      !isCard;

    const isDragging = isListView && draggingTodoId === todo.id;
    const isDropTarget =
      isListView && dragOverTodoId === todo.id && draggingTodoId !== todo.id;
    const dropClasses = isDropTarget ? ` drop-target drop-${dragOverPosition}` : "";
    const listDragProps = isListView
      ? {
          draggable: true,
          onDragStart: (event) => handleListDragStart(event, todo.id),
          onDragOver: (event) => handleListDragOver(event, todo.id),
          onDrop: (event) => handleListDrop(event, todo.id),
          onDragEnd: handleListDragEnd,
          "aria-grabbed": isDragging || undefined,
          "data-drop-position": isDropTarget ? dragOverPosition : undefined
        }
      : {};

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
            <div className="todo-controls">
              {priorityBadge}
              <button
                type="button"
                className="todo-dismiss"
                onClick={() => handleDismiss(todo)}
                aria-label={dismissAriaLabel}
              >
                ×
              </button>
            </div>
          </div>
          {todo.description && (
            <p className="todo-description">{todo.description}</p>
          )}
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
        className={`todo${todo.completed ? " completed" : ""}${
          isDragging ? " dragging" : ""
        }${dropClasses}`}
        {...listDragProps}
      >
        <div className="todo-header">
          <label className="todo-label">
            <input
              type="checkbox"
              checked={todo.status === "completed"}
              onChange={(event) => toggleTodo(todo.id, event.target.checked)}
            />
            <span>{todo.title}</span>
          </label>
          <div className="todo-controls">
            {priorityBadge}
            <button
              type="button"
              className="todo-dismiss"
              onClick={() => handleDismiss(todo)}
              aria-label={dismissAriaLabel}
            >
              ×
            </button>
          </div>
        </div>
        {todo.description && (
          <p className="todo-description">{todo.description}</p>
        )}
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
          <textarea
            name="description"
            placeholder="add a short description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-label="task description"
            rows={2}
          />
          <label className="composer-priority">
            priority
            <select
              name="priority"
              value={priority}
              onChange={(event) => handlePrioritySelect(event.target.value)}
              aria-label="new task priority"
            >
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">add</button>
        </form>
        <div className="filter-row">
          <div
            className={viewMode === "list" ? "filters" : "filters filters-hidden"}
            role="radiogroup"
            aria-label="filter todos"
            aria-hidden={viewMode !== "list"}
          >
            {CARD_COLUMNS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={filter === key ? "active" : ""}
                onClick={() => setFilter(key)}
                role="radio"
                aria-checked={filter === key}
                tabIndex={viewMode === "list" ? 0 : -1}
                disabled={viewMode !== "list"}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="priority-focus-filter">
            <span>filter</span>
            <div
              className="priority-focus-options"
              role="group"
              aria-label="filter tasks by priority"
            >
              {PRIORITY_OPTIONS.map(({ value, label }) => {
                const isActive = priorityFocus === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`priority-focus-button priority-${value}${
                      isActive ? " active" : ""
                    }`}
                    onClick={() => handlePriorityFocus(value)}
                    aria-pressed={isActive}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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
          <ul
            onDragOver={handleListContainerDragOver}
            onDrop={handleListContainerDrop}
          >
            {filteredTodos.map((todo) => renderTodo(todo))}
          </ul>
        )}
      </section>

      <footer className="app-footer">
        <div className="footer-stats">
          <span>total: {stats.total}</span>
          <span>done: {stats.completed}</span>
          <span>remaining: {stats.remaining}</span>
        </div>
        <div className="footer-actions">
          <button
            type="button"
            onClick={archiveCompleted}
            disabled={stats.completed === 0}
          >
            archive
          </button>
          <button
            type="button"
            onClick={() => setIsArchiveOpen((prev) => !prev)}
            ref={archiveToggleRef}
            disabled={archivedTodos.length === 0}
            aria-expanded={isArchiveOpen}
            aria-controls="archive-drawer"
          >
            {isArchiveOpen
              ? "hide archived"
              : `show archived (${archivedTodos.length})`}
          </button>
        </div>
      </footer>

      {archivedTodos.length > 0 && (
        <aside
          id="archive-drawer"
          ref={archiveDrawerRef}
          className={`archive-drawer${isArchiveOpen ? " open" : ""}`}
          role="region"
          aria-label="archived tasks"
          aria-hidden={!isArchiveOpen}
        >
          <div className="archive-header">
            <h2>archive</h2>
            <span>{archivedTodos.length}</span>
          </div>
          <ul>{sortedArchivedTodos.map((todo) => renderArchivedTodo(todo))}</ul>
        </aside>
      )}
    </main>
  );
}

export default App;
