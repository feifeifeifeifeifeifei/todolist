export default function TodoFilters({ filterType, onFilterChange }) {
  return (
    <div className="filters">
      <span>Filter tasks:</span>
      <div className="segmented">
        <button
          type="button"
          className={filterType === 'all' ? 'active' : ''}
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button
          type="button"
          className={filterType === 'active' ? 'active' : ''}
          onClick={() => onFilterChange('active')}
        >
          Active
        </button>
        <button
          type="button"
          className={filterType === 'completed' ? 'active' : ''}
          onClick={() => onFilterChange('completed')}
        >
          Completed
        </button>
      </div>
    </div>
  )
}
