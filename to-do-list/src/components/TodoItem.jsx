import { useEffect, useRef, useState } from 'react'

export default function TodoItem({
  todo,
  isEditing,
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
  const [isComposing, setIsComposing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const liRef = useRef(null)

  const selectedColor =
    todoColors?.find((c) => c.id === todo.colorId) ?? todoColors?.[0]

  useEffect(() => {
    if (!isEditing) setIsComposing(false)
  }, [isEditing])

  useEffect(() => {
    if (!menuOpen) return

    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    const onPointerDown = (e) => {
      if (!liRef.current) return
      if (liRef.current.contains(e.target)) return
      setMenuOpen(false)
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointerDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <li ref={liRef} className="todo-item">
      {isEditing ? (
        <>
          <input
            type="text"
            value={editingText}
            onChange={onEditingTextChange}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isComposing) {
                onSaveEdit()
              }
            }}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onSaveEdit}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={`todo-check-btn${todo.completed ? ' is-checked' : ''}`}
            aria-pressed={todo.completed}
            aria-label={todo.completed ? 'Mark as not done' : 'Mark as done'}
            onClick={() => onToggle(todo.id)}
            style={{
              '--todo-color': selectedColor?.hex ?? undefined,
            }}
          />

          <span
            className={`todo-text${todo.completed ? ' completed' : ''}`}
            style={{ '--todo-color': selectedColor?.hex ?? undefined }}
          >
            {todo.text}
          </span>

          <div className="todo-more">
            <button
              type="button"
              className="todo-more-btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="More actions"
              onClick={() => setMenuOpen((v) => !v)}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="todo-more-menu" role="menu" aria-label="Todo actions">
                <button
                  type="button"
                  className="todo-more-item"
                  role="menuitem"
                  onClick={() => {
                    closeMenu()
                    onStartEdit(todo)
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="todo-more-item todo-more-item--danger"
                  role="menuitem"
                  onClick={() => {
                    closeMenu()
                    onDelete(todo.id)
                  }}
                >
                  Delete
                </button>

                <div className="todo-more-divider" role="separator" />

                <div className="todo-more-color-block" aria-label="Choose color">
                  <div className="todo-more-color-title">Color</div>
                  <div className="todo-more-color-grid">
                    {(todoColors ?? []).map((c) => {
                      const isActive = c.id === todo.colorId
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`todo-more-color-btn${
                            isActive ? ' is-active' : ''
                          }`}
                          onClick={() => {
                            closeMenu()
                            onSetTodoColor(todo.id, c.id)
                          }}
                          aria-pressed={isActive}
                          aria-label={`Set todo color to ${c.name}`}
                          title={c.name}
                          style={{ '--todo-color': c.hex }}
                        >
                          <span
                            className="todo-more-color-dot"
                            style={{ background: c.hex }}
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </li>
  )
}
