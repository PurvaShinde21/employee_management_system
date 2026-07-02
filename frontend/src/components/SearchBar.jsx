export default function SearchBar({
  search,
  department,
  status,
  departments,
  onSearchChange,
  onDepartmentChange,
  onStatusChange,
  onClear,
}) {
  const hasFilters = search || department || status

  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          id="employee-search"
          type="text"
          placeholder="Search by name, role, or email…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      <select
        id="filter-department"
        className="filter-select"
        value={department}
        onChange={e => onDepartmentChange(e.target.value)}
      >
        <option value="">All Departments</option>
        {departments.map(d => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        id="filter-status"
        className="filter-select"
        value={status}
        onChange={e => onStatusChange(e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="On Leave">On Leave</option>
        <option value="Terminated">Terminated</option>
      </select>

      {hasFilters && (
        <button className="btn-clear" onClick={onClear}>
          ✕ Clear
        </button>
      )}
    </div>
  )
}
