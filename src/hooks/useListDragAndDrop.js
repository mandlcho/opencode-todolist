import { useCallback, useEffect, useMemo, useState } from "react";

export function useListDragAndDrop({ isEnabled, todos, setTodos }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState("before");

  const reset = useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
    setDragOverPosition("before");
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      reset();
    }
  }, [isEnabled, reset]);

  const reorderListTodos = useCallback(
    (sourceId, targetId, position = "before") => {
      if (!sourceId || sourceId === targetId) {
        return;
      }

      const displayIds = todos.map((todo) => todo.id);
      const sourceIndex = displayIds.indexOf(sourceId);
      if (sourceIndex === -1) {
        return;
      }

      const workingIds = [...displayIds];
      const [moved] = workingIds.splice(sourceIndex, 1);

      let insertionIndex;
      if (!targetId) {
        insertionIndex = workingIds.length;
      } else {
        const targetIndex = workingIds.indexOf(targetId);
        if (targetIndex === -1) {
          return;
        }
        insertionIndex = position === "after" ? targetIndex + 1 : targetIndex;
      }

      workingIds.splice(insertionIndex, 0, moved);

      const hasChanged = workingIds.some((id, index) => id !== displayIds[index]);
      if (!hasChanged) {
        return;
      }

      const displayIdSet = new Set(displayIds);

      setTodos((prev) => {
        const idToTodo = new Map(prev.map((todo) => [todo.id, todo]));
        const queue = workingIds.map((id) => idToTodo.get(id));
        if (queue.some((todo) => !todo)) {
          return prev;
        }

        const queueCopy = [...queue];
        const next = [];

        prev.forEach((todo) => {
          if (!displayIdSet.has(todo.id)) {
            next.push(todo);
            return;
          }

          const nextTodo = queueCopy.shift();
          if (nextTodo) {
            next.push(nextTodo);
          }
        });

        return next;
      });
    },
    [todos, setTodos]
  );

  const handleDragStart = useCallback(
    (event, todoId) => {
      if (!isEnabled) {
        return;
      }
      event.dataTransfer.effectAllowed = "move";
      try {
        event.dataTransfer.setData("text/plain", todoId);
      } catch (error) {
        // ignore browsers that disallow setData during dragstart
      }
      setDraggingId(todoId);
      setDragOverId(todoId);
      setDragOverPosition("before");
    },
    [isEnabled]
  );

  const handleDragOver = useCallback(
    (event, todoId) => {
      if (!isEnabled || !draggingId) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (!todoId || todoId === draggingId) {
        return;
      }
      const bounds = event.currentTarget.getBoundingClientRect();
      const offsetY = event.clientY - bounds.top;
      const position = offsetY > bounds.height / 2 ? "after" : "before";

      setDragOverId((prev) => (prev === todoId ? prev : todoId));
      setDragOverPosition((prev) => (prev === position ? prev : position));
    },
    [isEnabled, draggingId]
  );

  const handleDrop = useCallback(
    (event, todoId) => {
      if (!isEnabled || !draggingId) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      reorderListTodos(draggingId, todoId, dragOverPosition);
      reset();
    },
    [isEnabled, draggingId, dragOverPosition, reorderListTodos, reset]
  );

  const handleContainerDragOver = useCallback(
    (event) => {
      if (!isEnabled || !draggingId) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (event.target === event.currentTarget) {
        setDragOverId(null);
        setDragOverPosition("after");
      }
    },
    [isEnabled, draggingId]
  );

  const handleContainerDrop = useCallback(
    (event) => {
      if (!isEnabled || !draggingId) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      if (event.target === event.currentTarget) {
        reorderListTodos(draggingId, null, "after");
      } else if (dragOverId && dragOverId !== draggingId) {
        reorderListTodos(draggingId, dragOverId, dragOverPosition);
      }

      reset();
    },
    [isEnabled, draggingId, dragOverId, dragOverPosition, reorderListTodos, reset]
  );

  const handleDragEnd = useCallback(() => {
    if (!draggingId) {
      return;
    }
    reset();
  }, [draggingId, reset]);

  const getItemProps = useCallback(
    (todoId) => {
      const isDragging = isEnabled && draggingId === todoId;
      const isDropTarget =
        isEnabled && dragOverId === todoId && draggingId !== todoId;
      const dropPosition = isDropTarget ? dragOverPosition : null;

      const dragProps = isEnabled
        ? {
            draggable: true,
            onDragStart: (event) => handleDragStart(event, todoId),
            onDragOver: (event) => handleDragOver(event, todoId),
            onDrop: (event) => handleDrop(event, todoId),
            onDragEnd: handleDragEnd,
            "aria-grabbed": isDragging || undefined,
            "data-drop-position": dropPosition || undefined
          }
        : { draggable: false };

      return { dragProps, isDragging, dropPosition };
    },
    [
      isEnabled,
      draggingId,
      dragOverId,
      dragOverPosition,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd
    ]
  );

  const containerProps = useMemo(() => {
    if (!isEnabled) {
      return {};
    }
    return {
      onDragOver: handleContainerDragOver,
      onDrop: handleContainerDrop
    };
  }, [isEnabled, handleContainerDragOver, handleContainerDrop]);

  return {
    getItemProps,
    containerProps,
    reset
  };
}
