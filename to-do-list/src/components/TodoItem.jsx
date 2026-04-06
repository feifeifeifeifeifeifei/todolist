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
  onSetColor,
  isDragging,
  dropIndicator,
  onItemDragStart,
  onItemDragOver,
  onItemDragEnd,
}) {
  const [isComposing, setIsComposing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const liRef = useRef(null)
  const fromHandle = useRef(false)

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

  const itemColor = todo.color || null

  const checkStyle = itemColor
    ? { '--todo-custom-color': itemColor }
    : undefined

  const liClass = [
    'todo-item',
    isDragging && 'is-dragging',
    dropIndicator === 'before' && 'drop-before',
    dropIndicator === 'after' && 'drop-after',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li
      ref={liRef}
      className={liClass}
      onDragStart={(e) => {
        if (!fromHandle.current) {
          e.preventDefault()
          return
        }
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(todo.id))
        requestAnimationFrame(() => onItemDragStart(todo.id))
      }}
      onDragEnd={() => {
        fromHandle.current = false
        liRef.current?.removeAttribute('draggable')
        onItemDragEnd()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
        const rect = e.currentTarget.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        onItemDragOver(todo.id, e.clientY < midY ? 'before' : 'after')
      }}
    >
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
            className={`todo-check-btn${todo.completed ? ' is-checked' : ''}${itemColor ? ' has-custom-color' : ''}`}
            style={checkStyle}
            aria-pressed={todo.completed}
            aria-label={todo.completed ? 'Mark as not done' : 'Mark as done'}
            onClick={() => onToggle(todo.id)}
            onMouseDown={(e) => {
              if (e.button !== 0) return
              fromHandle.current = true
              liRef.current?.setAttribute('draggable', 'true')
            }}
          />

          <span
            className={todo.completed ? 'completed' : ''}
            style={itemColor && !todo.completed ? { color: itemColor } : undefined}
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

                <div className="todo-more-divider" />

                <div className="todo-color-section">
                  <span className="todo-color-label">Color</span>
                  <div className="todo-color-row">
                    <button
                      type="button"
                      className={`todo-color-circle todo-color-circle--none${!itemColor ? ' is-active' : ''}`}
                      aria-label="Default color"
                      title="Default"
                      onClick={() => {
                        onSetColor(todo.id, null)
                        closeMenu()
                      }}
                    />
                    {todoColors.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        className={`todo-color-circle${itemColor === hex ? ' is-active' : ''}`}
                        style={{ '--dot': hex }}
                        aria-label={hex}
                        title={hex}
                        onClick={() => {
                          onSetColor(todo.id, hex)
                          closeMenu()
                        }}
                      />
                    ))}
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
