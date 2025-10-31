import PropTypes from "prop-types";
import { TODO_PRIORITIES, DEFAULT_PRIORITY } from "../hooks/useTodos";
import { formatTimestamp, formatDate, getNextPriority } from "../utils/todoFormatting";

function TodoListItem({
  todo,
  onToggle,
  onMoveToActive,
  onUpdateStatus,
  onUpdatePriority,
  onDismiss,
  dragState = null,
  categoryLookup = null
}) {
  const createdLabel = formatTimestamp(todo.createdAt);
  const activatedLabel = todo.activatedAt
    ? formatTimestamp(todo.activatedAt)
    : null;
  const completedLabel = todo.completedAt
    ? formatTimestamp(todo.completedAt)
    : null;
  const dueLabel = todo.dueDate ? formatDate(todo.dueDate) : null;

  const currentPriority = TODO_PRIORITIES.includes(todo.priority)
    ? todo.priority
    : DEFAULT_PRIORITY;

  const nextPriority = getNextPriority(currentPriority);
  const todoCategories = Array.isArray(todo.categories)
    ? todo.categories
        .map((categoryId) =>
          categoryLookup && typeof categoryLookup.get === "function"
            ? categoryLookup.get(categoryId)
            : null
        )
        .filter(Boolean)
    : [];

  const className = `todo${todo.completed ? " completed" : ""}${
    dragState?.isDragging ? " dragging" : ""
  }${
    dragState?.dropPosition ? ` drop-target drop-${dragState.dropPosition}` : ""
  }`;

  const footerActions =
    todo.status === "backlog" || todo.status === "active" ? (
      <div className="todo-actions">
        {todo.status === "backlog" && (
          <button
            type="button"
            onClick={() => onMoveToActive(todo.id)}
            aria-label={`start ${todo.title}`}
          >
            start
          </button>
        )}
        {todo.status === "active" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(todo.id, "completed")}
            aria-label={`mark ${todo.title} as done`}
          >
            done
          </button>
        )}
      </div>
    ) : (
      <div className="todo-actions" />
    );

  return (
    <li className={className} {...(dragState?.dragProps ?? {})}>
      <div className="todo-header">
        <label className="todo-label">
          <input
            type="checkbox"
            checked={todo.status === "completed"}
            onChange={(event) => onToggle(todo.id, event.target.checked)}
          />
          <span>{todo.title}</span>
        </label>
        <div className="todo-controls">
          <button
            type="button"
            className={`todo-priority-badge priority-${currentPriority}`}
            onClick={() => onUpdatePriority(todo.id, nextPriority)}
            title={`priority: ${currentPriority}. click to set ${nextPriority}.`}
            aria-label={`priority ${currentPriority}. next: ${nextPriority}`}
          >
            {currentPriority}
          </button>
          <button
            type="button"
            className="todo-dismiss"
            onClick={() => onDismiss(todo)}
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
      {todo.description && <p className="todo-description">{todo.description}</p>}
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
      <div className="todo-footer">
        <div className="todo-meta">
          <span>created: {createdLabel || "unknown"}</span>
          <span>activated: {activatedLabel ? activatedLabel : "not yet"}</span>
          {dueLabel && <span>due: {dueLabel}</span>}
          {completedLabel && <span>done: {completedLabel}</span>}
        </div>
        {footerActions}
      </div>
    </li>
  );
}

TodoListItem.propTypes = {
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
  onToggle: PropTypes.func.isRequired,
  onMoveToActive: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  onUpdatePriority: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  dragState: PropTypes.shape({
    dragProps: PropTypes.object,
    isDragging: PropTypes.bool,
    dropPosition: PropTypes.oneOf(["before", "after", null])
  }),
  categoryLookup: PropTypes.instanceOf(Map)
};

export default TodoListItem;
