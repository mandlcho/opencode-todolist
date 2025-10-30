import PropTypes from "prop-types";
import TodoListItem from "./TodoListItem";

function TodoList({ todos, actions, dragAndDrop = null }) {
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
  })
};

export default TodoList;
