import PropTypes from "prop-types";
import { useMemo } from "react";
import TodoCard from "./TodoCard";
import { useFlipAnimation } from "../hooks/useFlipAnimation";

function TodoBoard({
  columns,
  actions,
  dragAndDrop = null,
  categoryLookup = null,
  calendarFocusDate = "",
  onAssignCategory = null
}) {
  const cardOrderSignature = useMemo(() => {
    return columns
      .map(({ key, todos }) =>
        todos
          .map((todo) => `${key}:${todo.id}`)
          .join("|")
      )
      .join("||");
  }, [columns]);

  const registerCard = useFlipAnimation({
    isEnabled: Boolean(dragAndDrop),
    dependencyList: [cardOrderSignature]
  });

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
                      categoryLookup={categoryLookup}
                      animationRef={registerCard(todo.id)}
                      calendarFocusDate={calendarFocusDate}
                      onAssignCategory={onAssignCategory}
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
  }),
  categoryLookup: PropTypes.instanceOf(Map),
  calendarFocusDate: PropTypes.string,
  onAssignCategory: PropTypes.func
};

export default TodoBoard;
