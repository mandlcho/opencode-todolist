import PropTypes from "prop-types";
import TodoCard from "./TodoCard";

function TodoBoard({ columns, actions, dragAndDrop = null }) {
  return (
    <div className="todo-board">
      {columns.map(({ key, label, todos }) => {
        const columnDnD = dragAndDrop?.getColumnProps
          ? dragAndDrop.getColumnProps(key)
          : { columnProps: {}, isDropTarget: false };

        return (
          <div
            key={key}
            className={`todo-column${
              columnDnD.isDropTarget ? " column-drop-target" : ""
            }`}
            {...(columnDnD.columnProps ?? {})}
          >
            <h2>{label}</h2>
            {todos.length === 0 ? (
              <p className="column-empty">nothing here yet</p>
            ) : (
              <ul>
                {todos.map((todo) => {
                  const cardDnD = dragAndDrop?.getCardProps
                    ? dragAndDrop.getCardProps(todo.id, key)
                    : null;
                  return (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      actions={actions}
                      dragState={cardDnD}
                    />
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

TodoBoard.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      todos: PropTypes.arrayOf(PropTypes.object).isRequired
    })
  ).isRequired,
  actions: PropTypes.shape({
    toggleTodo: PropTypes.func.isRequired,
    moveToActive: PropTypes.func.isRequired,
    updateTodoStatus: PropTypes.func.isRequired,
    updateTodoPriority: PropTypes.func.isRequired,
    handleDismiss: PropTypes.func.isRequired
  }).isRequired,
  dragAndDrop: PropTypes.shape({
    getColumnProps: PropTypes.func,
    getCardProps: PropTypes.func
  })
};

export default TodoBoard;
