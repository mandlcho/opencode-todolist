import PropTypes from "prop-types";
import { TODO_PRIORITIES, DEFAULT_PRIORITY } from "../hooks/useTodos";
import { formatTimestamp } from "../utils/todoFormatting";

function ArchiveDrawer({ todos, isOpen, drawerRef = null, onRemove }) {
  if (todos.length === 0) {
    return null;
  }

  return (
    <aside
      id="archive-drawer"
      ref={drawerRef}
      className={`archive-drawer${isOpen ? " open" : ""}`}
      role="region"
      aria-label="archived tasks"
      aria-hidden={!isOpen}
    >
      <div className="archive-header">
        <h2>archive</h2>
        <span>{todos.length}</span>
      </div>
      <ul>
        {todos.map((todo) => {
          const currentPriority = TODO_PRIORITIES.includes(todo.priority)
            ? todo.priority
            : DEFAULT_PRIORITY;
          const archivedLabel = formatTimestamp(todo.archivedAt);
          const completedLabel = todo.completedAt
            ? formatTimestamp(todo.completedAt)
            : null;
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
                    onClick={() => onRemove(todo.id)}
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
        })}
      </ul>
    </aside>
  );
}

ArchiveDrawer.propTypes = {
  todos: PropTypes.arrayOf(PropTypes.object).isRequired,
  isOpen: PropTypes.bool.isRequired,
  drawerRef: PropTypes.shape({
    current: PropTypes.any
  }),
  onRemove: PropTypes.func.isRequired
};

export default ArchiveDrawer;
