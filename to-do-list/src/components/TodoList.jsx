import TodoItem from './TodoItem'

export default function TodoList({
  todos,
  editingId,
  editingText,
  onEditingTextChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onToggle,
  onDelete,
  todoColors,
  onSetTodoColor,
}) {
  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isEditing={editingId === todo.id}
          editingText={editingText}
          onEditingTextChange={onEditingTextChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onStartEdit={onStartEdit}
          onToggle={onToggle}
          onDelete={onDelete}
          todoColors={todoColors}
          onSetTodoColor={onSetTodoColor}
        />
      ))}
    </ul>
  )
}
