export default function TodoInput({
  isOpen,
  onOpen,
  onClose,
  inputRef,
  value,
  onChange,
  isComposing,
  onCompositionStart,
  onCompositionEnd,
  onAdd,
}) {
  if (!isOpen) {
    return (
      <div className="todo-add-section">
        <button
          type="button"
          className="btn btn-primary todo-add-reveal"
          onClick={onOpen}
          aria-expanded="false"
          aria-controls="todo-add-input"
        >
          + Add Task
        </button>
      </div>
    )
  }

  return (
    <div className="todo-add-section">
      <div className="todo-input">
        <input
          id="todo-add-input"
          ref={inputRef}
          type="text"
          placeholder="Please enter a task."
          value={value}
          onChange={onChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isComposing) {
              onAdd()
            }
          }}
        />
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          Add
        </button>
        <button
          type="button"
          className="btn btn-ghost todo-add-close"
          onClick={onClose}
          aria-label="Close add task field"
        >
          ×
        </button>
      </div>
    </div>
  )
}
