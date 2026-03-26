export default function TodoClearActions({
  completedCount,
  clearedCount,
  onClearCompleted,
  onUndoClear,
}) {
  return (
    <div className="clear-completed-and-undo">
      {completedCount > 0 && (
        <button
          type="button"
          className="btn btn-muted"
          onClick={onClearCompleted}
        >
          Clear completed
        </button>
      )}
      {clearedCount > 0 && (
        <button type="button" className="btn btn-ghost" onClick={onUndoClear}>
          Undo clear
        </button>
      )}
    </div>
  )
}
