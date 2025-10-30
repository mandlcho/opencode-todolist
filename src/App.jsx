import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "./components/AppHeader";
import TodoComposer from "./components/TodoComposer";
import TodoList from "./components/TodoList";
import TodoBoard from "./components/TodoBoard";
import ArchiveDrawer from "./components/ArchiveDrawer";
import AppFooter from "./components/AppFooter";
import { useTodos, TODO_PRIORITIES, DEFAULT_PRIORITY } from "./hooks/useTodos";
import { useListDragAndDrop } from "./hooks/useListDragAndDrop";
import { useBoardDragAndDrop } from "./hooks/useBoardDragAndDrop";
import { useThemePreference } from "./hooks/useThemePreference";
import { PRIORITY_OPTIONS } from "./utils/todoFormatting";
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

function App() {
  const { todos, setTodos, stats, archivedTodos, setArchivedTodos } = useTodos();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priorityFocus, setPriorityFocus] = useState("");
  const [filter, setFilter] = useState("backlog");
  const [viewMode, setViewMode] = useState("list");
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [composerError, setComposerError] = useState("");
  const archiveDrawerRef = useRef(null);
  const archiveToggleRef = useRef(null);
  const isListView = viewMode === "list";
  const isCardView = viewMode === "card";
  const { theme, setTheme } = useThemePreference();

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
  }, [isArchiveOpen]);

  const handlePriorityFocus = useCallback((value) => {
    if (!TODO_PRIORITIES.includes(value)) {
      return;
    }
    setPriorityFocus((prev) => (prev === value ? "" : value));
  }, []);

  const archiveCompleted = useCallback(() => {
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
  }, [todos, setTodos, setArchivedTodos]);

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

  const listDragAndDrop = useListDragAndDrop({
    isEnabled: isListView,
    todos: filteredTodos,
    setTodos
  });

  const boardDragAndDrop = useBoardDragAndDrop({
    isEnabled: isCardView,
    columns: CARD_COLUMNS,
    setTodos
  });

  const handleDueDateChange = useCallback((nextValue) => {
    setDueDate(nextValue);
    if (nextValue) {
      setComposerError("");
    }
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!title.trim()) return;
      if (!dueDate) {
        setComposerError("pick a due date before adding the task.");
        return;
      }

      const nextTodo = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description.trim(),
        priority: DEFAULT_PRIORITY,
        status: "backlog",
        completed: false,
        activatedAt: null,
        createdAt: new Date().toISOString(),
        dueDate: dueDate ? dueDate.trim() : null
      };

      setTodos((prev) => [nextTodo, ...prev]);
      setTitle("");
      setDescription("");
      setDueDate("");
      setComposerError("");
    },
    [title, description, dueDate, setTodos]
  );

  const updateTodoStatus = useCallback(
    (id, status) => {
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
    },
    [setTodos]
  );

  const toggleTodo = useCallback(
    (id, checked) => {
      updateTodoStatus(id, checked ? "completed" : "active");
    },
    [updateTodoStatus]
  );

  const moveToBacklog = useCallback(
    (id) => {
      updateTodoStatus(id, "backlog");
    },
    [updateTodoStatus]
  );

  const moveToActive = useCallback(
    (id) => {
      updateTodoStatus(id, "active");
    },
    [updateTodoStatus]
  );

  const updateTodoPriority = useCallback(
    (id, value) => {
      if (!TODO_PRIORITIES.includes(value)) {
        return;
      }
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? { ...todo, priority: value } : todo))
      );
    },
    [setTodos]
  );

  const removeTodo = useCallback(
    (id) => {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    },
    [setTodos]
  );

  const handleDismiss = useCallback(
    (todo) => {
      if (todo.status === "active") {
        moveToBacklog(todo.id);
        return;
      }
      removeTodo(todo.id);
    },
    [moveToBacklog, removeTodo]
  );

  const removeArchivedTodo = useCallback(
    (id) => {
      setArchivedTodos((prev) => prev.filter((todo) => todo.id !== id));
    },
    [setArchivedTodos]
  );

  const todoActions = useMemo(
    () => ({
      toggleTodo,
      moveToActive,
      updateTodoStatus,
      updateTodoPriority,
      handleDismiss
    }),
    [toggleTodo, moveToActive, updateTodoStatus, updateTodoPriority, handleDismiss]
  );

  const handleToggleArchive = useCallback(() => {
    setIsArchiveOpen((prev) => !prev);
  }, []);

  return (
    <main className="app-shell">
      <AppHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        themeMode={theme}
        onThemeModeChange={setTheme}
      />

      <TodoComposer
        title={title}
        description={description}
        dueDate={dueDate}
        priorityOptions={PRIORITY_OPTIONS}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onDueDateChange={handleDueDateChange}
        onSubmit={handleSubmit}
        filter={filter}
        onFilterChange={setFilter}
        viewMode={viewMode}
        columns={CARD_COLUMNS}
        priorityFocus={priorityFocus}
        onPriorityFocus={handlePriorityFocus}
        error={composerError}
      />

      <section
        className={`todo-list${viewMode === "card" ? " card-view" : ""}`}
        aria-live="polite"
      >
        {viewMode === "card" ? (
          todos.length === 0 ? (
            <p className="empty-state">no todos yet. add one above.</p>
          ) : (
            <TodoBoard
              columns={boardColumns}
              actions={todoActions}
              dragAndDrop={boardDragAndDrop}
            />
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
          <TodoList
            todos={filteredTodos}
            actions={todoActions}
            dragAndDrop={listDragAndDrop}
          />
        )}
      </section>

      <AppFooter
        stats={stats}
        onArchiveCompleted={archiveCompleted}
        onToggleArchive={handleToggleArchive}
        isArchiveOpen={isArchiveOpen}
        archivedCount={archivedTodos.length}
        archiveToggleRef={archiveToggleRef}
      />

      <ArchiveDrawer
        todos={sortedArchivedTodos}
        isOpen={isArchiveOpen}
        drawerRef={archiveDrawerRef}
        onRemove={removeArchivedTodo}
      />
    </main>
  );
}

export default App;
