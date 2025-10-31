import PropTypes from "prop-types";
import TodoListItem from "./TodoListItem";

function TodoList({
  todos,
  actions,
  dragAndDrop = null,
  categoryLookup = null,
  calendarFocusDate = "",
  onAssignCategory = null,
  onRemoveCategory = null
}) {
  if (todos.length === 0) {
    return null;
  }

  const containerProps = dragAndDrop?.containerProps ?? {};

  return (
    <ul {...containerProps}>
      {todos.map((todo) => {
        const dragState = dragAndDrop?.getItemProps
          ? dragAndDrop.getItemProps(todo.id)
          : null;
        return (
          <TodoListItem
            key={todo.id}
            todo={todo}
            onToggle={actions.toggleTodo}
            onMoveToActive={actions.moveToActive}
            onUpdateStatus={actions.updateTodoStatus}
            onUpdatePriority={actions.updateTodoPriority}
            onDismiss={actions.handleDismiss}
            dragState={dragState}
            categoryLookup={categoryLookup}
            calendarFocusDate={calendarFocusDate}
            onAssignCategory={onAssignCategory}
            onRemoveCategory={onRemoveCategory}
          />
        );
      })}
    </ul>
  );
}

TodoList.propTypes = {
  todos: PropTypes.arrayOf(PropTypes.object).isRequired,
  actions: PropTypes.shape({
    toggleTodo: PropTypes.func.isRequired,
    moveToActive: PropTypes.func.isRequired,
    updateTodoStatus: PropTypes.func.isRequired,
    updateTodoPriority: PropTypes.func.isRequired,
    handleDismiss: PropTypes.func.isRequired
  }).isRequired,
  dragAndDrop: PropTypes.shape({
    containerProps: PropTypes.object,
    getItemProps: PropTypes.func
  }),
  categoryLookup: PropTypes.instanceOf(Map),
  calendarFocusDate: PropTypes.string,
  onAssignCategory: PropTypes.func,
  onRemoveCategory: PropTypes.func
};

export default TodoList;
