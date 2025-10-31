import { useState } from "react";
import PropTypes from "prop-types";
import { TODO_PRIORITIES, DEFAULT_PRIORITY } from "../hooks/useTodos";
import {
  formatTimestamp,
  formatDate,
  getNextPriority
} from "../utils/todoFormatting";
import { CATEGORY_DRAG_TYPE } from "../utils/dragTypes";

const hasCategoryPayload = (event) => {
  if (!event || !event.dataTransfer) {
    return false;
  }
  const types = event.dataTransfer.types;
  if (!types) {
    return false;
  }
  if (typeof types.includes === "function") {
    return types.includes(CATEGORY_DRAG_TYPE);
  }
  return Array.from(types).includes(CATEGORY_DRAG_TYPE);
};

function TodoCard({
  todo,
  actions,
  dragState = null,
  categoryLookup = null,
  animationRef = null,
  calendarFocusDate = "",
  onAssignCategory = null,
  onRemoveCategory = null
}) {
  const [isCategoryDropTarget, setIsCategoryDropTarget] = useState(false);
  const createdLabel = formatTimestamp(todo.createdAt);
  const activatedLabel = todo.activatedAt
    ? formatTimestamp(todo.activatedAt)
    : null;
  const completedLabel = todo.completedAt
    ? formatTimestamp(todo.completedAt)
    : null;
  const dueLabel = todo.dueDate ? formatDate(todo.dueDate) : null;
  const hasDescription =
    typeof todo.description === "string" && todo.description.trim().length > 0;

  const currentPriority = TODO_PRIORITIES.includes(todo.priority)
    ? todo.priority
    : DEFAULT_PRIORITY;
  const nextPriority = getNextPriority(currentPriority);
  const showStart = todo.status === "backlog";
  const showComplete = todo.status === "active";
  const hasActions = showStart || showComplete;
  const dueDisplay = dueLabel ?? "not set";
  const doneDisplay = completedLabel ?? "not complete";
  const dueIso = typeof todo.dueDate === "string" ? todo.dueDate.slice(0, 10) : "";
  const hasCalendarFocus = typeof calendarFocusDate === "string" && calendarFocusDate.length > 0;
  const matchesCalendarFocus = hasCalendarFocus && dueIso === calendarFocusDate;
  const isCalendarMuted = hasCalendarFocus && !matchesCalendarFocus;
  const todoCategories = Array.isArray(todo.categories)
    ? todo.categories
        .map((categoryId) =>
          categoryLookup && typeof categoryLookup.get === "function"
            ? categoryLookup.get(categoryId)
            : null
        )
        .filter(Boolean)
    : [];

  const className = `todo${todo.completed ? " completed" : ""} todo-card${
    dragState?.isDragging ? " dragging" : ""
  }${
    dragState?.isDropTarget && dragState.dropPosition
      ? ` card-drop-target card-drop-${dragState.dropPosition}`
      : dragState?.isDropTarget
      ? " card-drop-target"
      : ""
  }${hasDescription ? " has-description" : " no-description"}${
    matchesCalendarFocus ? " calendar-focus" : ""
  }${isCalendarMuted ? " calendar-muted" : ""}${
    isCategoryDropTarget ? " category-drop-target" : ""
  }`;

  const handleCategoryContextMenu = (event, category) => {
    if (!category || typeof onRemoveCategory !== "function") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const label = category.label ?? "this label";
    const shouldRemove = window.confirm(
      `remove label "${label}" from "${todo.title}"?`
    );
    if (!shouldRemove) {
      return;
    }
    onRemoveCategory(todo.id, category.id);
  };

  const baseDragProps = dragState?.dragProps ?? {};
  const baseOnDragEnter = baseDragProps.onDragEnter;
  const baseOnDragOver = baseDragProps.onDragOver;
  const baseOnDragLeave = baseDragProps.onDragLeave;
  const baseOnDrop = baseDragProps.onDrop;

  const handleDragEnter = (event) => {
    if (hasCategoryPayload(event)) {
      event.preventDefault();
      event.stopPropagation();
      setIsCategoryDropTarget(true);
      event.dataTransfer.dropEffect = "copy";
      return;
    }
    baseOnDragEnter?.(event);
  };

  const handleDragOver = (event) => {
    if (hasCategoryPayload(event)) {
      event.preventDefault();
      event.stopPropagation();
      if (!isCategoryDropTarget) {
        setIsCategoryDropTarget(true);
      }
      event.dataTransfer.dropEffect = "copy";
      return;
    }
    baseOnDragOver?.(event);
  };

  const handleDragLeave = (event) => {
    if (hasCategoryPayload(event)) {
      event.preventDefault();
      event.stopPropagation();
      setIsCategoryDropTarget(false);
      return;
    }
    baseOnDragLeave?.(event);
  };

  const handleDrop = (event) => {
    if (hasCategoryPayload(event)) {
      event.preventDefault();
      event.stopPropagation();
      setIsCategoryDropTarget(false);
      const categoryId = event.dataTransfer.getData(CATEGORY_DRAG_TYPE);
      if (categoryId && typeof onAssignCategory === "function") {
        onAssignCategory(todo.id, categoryId);
      }
      return;
    }
    setIsCategoryDropTarget(false);
    baseOnDrop?.(event);
  };

  const mergedDragProps = {
    ...baseDragProps,
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop
  };

  return (
    <li
      className={className}
      ref={animationRef}
      {...mergedDragProps}
    >
      <div className="todo-card-header">
        <label className="todo-label">
          <input
            type="checkbox"
            checked={todo.status === "completed"}
            onChange={(event) => actions.toggleTodo(todo.id, event.target.checked)}
          />
          <span>{todo.title}</span>
        </label>
        <div className="todo-controls">
          <button
            type="button"
            className={`todo-priority-badge priority-${currentPriority}`}
            onClick={() => actions.updateTodoPriority(todo.id, nextPriority)}
            title={`priority: ${currentPriority}. click to set ${nextPriority}.`}
            aria-label={`priority ${currentPriority}. next: ${nextPriority}`}
          >
            {currentPriority}
          </button>
          <button
            type="button"
            className="todo-dismiss"
            onClick={() => actions.handleDismiss(todo)}
            aria-label={
              todo.status === "active"
                ? `return ${todo.title} to backlog`
                : `delete ${todo.title}`
            }
          >
            ×
          </button>
        </div>
      </div>
      <p
        className={`todo-description${hasDescription ? "" : " empty"}`}
        aria-hidden={hasDescription ? undefined : true}
      >
        {hasDescription ? todo.description : null}
      </p>
      <div className="todo-footer card-footer">
        <div className="todo-meta">
          {todoCategories.length > 0 ? (
            <div className="todo-category-tags todo-category-tags-inline">
              {todoCategories.map((category) => (
                <span
                  key={category.id}
                  className="category-tag"
                  style={{ "--tag-color": category.color }}
                  onContextMenu={(event) => handleCategoryContextMenu(event, category)}
                  title="right click to remove label"
                >
                  {category.label}
                </span>
              ))}
            </div>
          ) : null}
          <span>created: {createdLabel || "unknown"}</span>
          <span>activated: {activatedLabel ? activatedLabel : "not yet"}</span>
          <span>due: {dueDisplay}</span>
          <span>done: {doneDisplay}</span>
        </div>
        <div
          className={`todo-actions card-actions${hasActions ? "" : " empty"}`}
          aria-hidden={hasActions ? undefined : true}
        >
          {showStart && (
            <button
              type="button"
              onClick={() => actions.moveToActive(todo.id)}
              aria-label={`start ${todo.title}`}
            >
              start
            </button>
          )}
          {showComplete && (
            <button
              type="button"
              onClick={() => actions.updateTodoStatus(todo.id, "completed")}
              aria-label={`mark ${todo.title} as done`}
            >
              done
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

TodoCard.propTypes = {
  todo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    priority: PropTypes.string,
    completed: PropTypes.bool,
    createdAt: PropTypes.string,
    activatedAt: PropTypes.string,
    completedAt: PropTypes.string,
    dueDate: PropTypes.string,
    categories: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  actions: PropTypes.shape({
    toggleTodo: PropTypes.func.isRequired,
    moveToActive: PropTypes.func.isRequired,
    updateTodoStatus: PropTypes.func.isRequired,
    updateTodoPriority: PropTypes.func.isRequired,
    handleDismiss: PropTypes.func.isRequired
  }).isRequired,
  dragState: PropTypes.shape({
    dragProps: PropTypes.object,
    isDragging: PropTypes.bool,
    isDropTarget: PropTypes.bool,
    dropPosition: PropTypes.oneOf(["before", "after", null])
  }),
  categoryLookup: PropTypes.instanceOf(Map),
  animationRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]),
  calendarFocusDate: PropTypes.string,
  onAssignCategory: PropTypes.func,
  onRemoveCategory: PropTypes.func
};

export default TodoCard;
