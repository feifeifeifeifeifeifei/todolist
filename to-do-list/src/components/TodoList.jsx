import { useState } from 'react'
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
  onSetColor,
  onReorder,
}) {
  const [draggedId, setDraggedId] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  const handleDragStart = (id) => setDraggedId(id)

  const handleDragOver = (id, position) => {
    if (id === draggedId) {
      setDropTarget(null)
      return
    }
    setDropTarget((prev) => {
      if (prev && prev.id === id && prev.position === position) return prev
      return { id, position }
    })
  }

  const handleDrop = () => {
    if (draggedId != null && dropTarget != null) {
      onReorder(draggedId, dropTarget.id, dropTarget.position)
    }
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDropTarget(null)
  }

  return (
    <ul
      className="todo-list"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        handleDrop()
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setDropTarget(null)
        }
      }}
    >
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
          onSetColor={onSetColor}
          isDragging={draggedId === todo.id}
          dropIndicator={
            dropTarget?.id === todo.id ? dropTarget.position : null
          }
          onItemDragStart={handleDragStart}
          onItemDragOver={handleDragOver}
          onItemDragEnd={handleDragEnd}
        />
      ))}
    </ul>
  )
}
