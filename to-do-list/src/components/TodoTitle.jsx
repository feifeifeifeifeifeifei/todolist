export default function TodoTitle({ showShortcutHint, minimal }) {
  return (
    <>
      <h1>Todo List</h1>
      {!minimal ? (
        <p className="todo-subtitle">
          Stay on top of what matters.
          {showShortcutHint ? (
            <>
              <br />
              <span className="todo-shortcut-hint">Press N to add a task.</span>
            </>
          ) : null}
        </p>
      ) : null}
    </>
  )
}
