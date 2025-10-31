import PropTypes from "prop-types";
import { TODO_PRIORITIES, DEFAULT_PRIORITY } from "../hooks/useTodos";
import {
  formatTimestamp,
  formatDate,
  getNextPriority
} from "../utils/todoFormatting";

function TodoCard({ todo, actions, dragState = null, categoryLookup = null }) {
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
  }${hasDescription ? " has-description" : " no-description"}`;

  return (
    <li className={className} {...(dragState?.dragProps ?? {})}>
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
      {todoCategories.length > 0 ? (
        <div className="todo-category-tags">
          {todoCategories.map((category) => (
            <span
              key={category.id}
              className="category-tag"
              style={{ "--tag-color": category.color }}
            >
              {category.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="todo-footer card-footer">
        <div className="todo-meta">
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
  categoryLookup: PropTypes.instanceOf(Map)
};

export default TodoCard;
