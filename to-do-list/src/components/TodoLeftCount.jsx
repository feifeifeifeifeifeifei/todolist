export default function TodoLeftCount({ leftCount }) {
  return (
    <p className="todo-stats">
      {leftCount} task{leftCount === 1 ? '' : 's'} left
    </p>
  )
}
