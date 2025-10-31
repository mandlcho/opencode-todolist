import PropTypes from "prop-types";
import CalendarPicker from "./CalendarPicker";

function TodoComposer({
  title,
  description,
  dueDate,
  onTitleChange,
  onDescriptionChange,
  onDueDateChange,
  onSubmit,
  dueHighlights,
  filter,
  onFilterChange,
  viewMode,
  columns,
  priorityFocus,
  onPriorityFocus,
  priorityOptions,
  error = ""
}) {
  return (
    <section className="composer">
      <div className="composer-layout">
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="title"
            placeholder="add a task to backlog"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-label="task title"
            required
            autoComplete="off"
            className="composer-input"
          />
          <textarea
            name="description"
            placeholder="add a short description (optional)"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            aria-label="task description"
            rows={2}
            className="composer-textarea"
          />
          <button type="submit">add</button>
        </form>
        <div className="composer-calendar">
          <h3>due date</h3>
          <CalendarPicker
            value={dueDate}
            onChange={onDueDateChange}
            highlights={dueHighlights}
          />
        </div>
      </div>
      {error && <p className="composer-error">{error}</p>}
      <div className="filter-row">
        <div
          className={viewMode === "list" ? "filters" : "filters filters-hidden"}
          role="radiogroup"
          aria-label="filter todos"
          aria-hidden={viewMode !== "list"}
        >
          {columns.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={filter === key ? "active" : ""}
              onClick={() => onFilterChange(key)}
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
            {priorityOptions.map(({ value, label }) => {
              const isActive = priorityFocus === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`priority-focus-button priority-${value}${
                    isActive ? " active" : ""
                  }`}
                  onClick={() => onPriorityFocus(value)}
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
  );
}

TodoComposer.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  dueDate: PropTypes.string.isRequired,
  priorityOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  onTitleChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  onDueDateChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  dueHighlights: PropTypes.object.isRequired,
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  viewMode: PropTypes.oneOf(["list", "card"]).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  priorityFocus: PropTypes.string.isRequired,
  onPriorityFocus: PropTypes.func.isRequired,
  error: PropTypes.string
};

export default TodoComposer;
