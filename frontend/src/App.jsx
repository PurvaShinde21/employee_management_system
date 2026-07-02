import { useState, useEffect, useCallback } from 'react'
import './index.css'
import StatsBar     from './components/StatsBar'
import SearchBar    from './components/SearchBar'
import ConfirmModal from './components/ConfirmModal'

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ message, type }) => (
  <div className={`toast ${type}`}>
    {type === 'success' ? '✓' : '⚠'} {message}
  </div>
)

// ─── Department colour map ────────────────────────────────────────────────────
const DEPT_CLASS = {
  Engineering: 'dept-indigo',
  Product:     'dept-purple',
  HR:          'dept-pink',
  Marketing:   'dept-orange',
  Finance:     'dept-green',
  Operations:  'dept-teal',
}

const STATUS_CLASS = {
  Active:      'status-active',
  'On Leave':  'status-leave',
  Terminated:  'status-terminated',
}

// ─── Empty form ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name:       '',
  email:      '',
  phone:      '',
  role:       '',
  department: '',
  hire_date:  '',
  status:     'Active',
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  // Core data
  const [employees,    setEmployees]    = useState([])
  const [departments,  setDepartments]  = useState([])
  const [roles,        setRoles]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [statsRefresh, setStatsRefresh] = useState(0)

  // Search / filter
  const [search,       setSearch]       = useState('')
  const [filterDept,   setFilterDept]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Add / Edit modal
  const [isModalOpen,      setIsModalOpen]      = useState(false)
  const [currentEmployee,  setCurrentEmployee]  = useState(null)
  const [formData,         setFormData]         = useState(EMPTY_FORM)

  // Confirm delete modal
  const [confirm, setConfirm] = useState({ open: false, empId: null, empName: '' })

  // Toasts
  const [toasts, setToasts] = useState([])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const bumpStats = () => setStatsRefresh(k => k + 1)

  // ── Fetch departments and roles (once) ──────────────────────────────────
  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.json())
      .then(setDepartments)
      .catch(() => {})
    fetch('/api/roles')
      .then(r => r.json())
      .then(setRoles)
      .catch(() => {})
  }, [])

  // ── Fetch employees (on filter change) ───────────────────────────────────
  const fetchEmployees = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)       params.set('search',     search)
    if (filterDept)   params.set('department', filterDept)
    if (filterStatus) params.set('status',     filterStatus)

    fetch(`/api/employees?${params.toString()}`)
      .then(r => r.json())
      .then(data => { setEmployees(data); setLoading(false) })
      .catch(() => {
        setLoading(false)
        showToast('Failed to connect to backend', 'danger')
      })
  }, [search, filterDept, filterStatus])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const handleOpenModal = (emp = null) => {
    if (emp) {
      setCurrentEmployee(emp)
      setFormData({
        name:       emp.name,
        email:      emp.email,
        phone:      emp.phone,
        role:       emp.role,
        department: emp.department,
        hire_date:  emp.hire_date,
        status:     emp.status,
      })
    } else {
      setCurrentEmployee(null)
      setFormData(EMPTY_FORM)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentEmployee(null)
  }

  const handleInputChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ── Save (add / edit) ────────────────────────────────────────────────────
  const handleSave = async e => {
    e.preventDefault()
    const method = currentEmployee ? 'PUT' : 'POST'
    const url    = currentEmployee
      ? `/api/employees/${currentEmployee.id}`
      : '/api/employees'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      })
      if (res.ok) {
        handleCloseModal()
        fetchEmployees()
        bumpStats()
        showToast(currentEmployee ? 'Employee updated successfully' : 'Employee added successfully')
      } else {
        const err = await res.json()
        showToast(err.error || 'Error saving employee', 'danger')
      }
    } catch {
      showToast('Network error', 'danger')
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = emp => {
    setConfirm({ open: true, empId: emp.id, empName: emp.name })
  }

  const handleDeleteConfirm = async () => {
    const { empId } = confirm
    setConfirm({ open: false, empId: null, empName: '' })
    try {
      const res = await fetch(`/api/employees/${empId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchEmployees()
        bumpStats()
        showToast('Employee deleted', 'danger')
      }
    } catch {
      showToast('Network error', 'danger')
    }
  }

  const handleDeleteCancel = () => setConfirm({ open: false, empId: null, empName: '' })

  const clearFilters = () => {
    setSearch('')
    setFilterDept('')
    setFilterStatus('')
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="header">
        <h1>CloudCorp <span>Employee Management</span></h1>
        <div className="badge">AWS DevOps Demo</div>
      </header>

      <main className="main-content">

        {/* ── Stats Bar ── */}
        <StatsBar refreshKey={statsRefresh} />

        {/* ── Table Card ── */}
        <div className="table-card">
          <div className="table-header">
            <h2>Employee Directory</h2>
            <button id="add-employee-btn" className="btn-primary" onClick={() => handleOpenModal()}>
              + Add Employee
            </button>
          </div>

          {/* Search / Filter */}
          <div className="table-controls">
            <SearchBar
              search={search}
              department={filterDept}
              status={filterStatus}
              departments={departments}
              onSearchChange={setSearch}
              onDepartmentChange={setFilterDept}
              onStatusChange={setFilterStatus}
              onClear={clearFilters}
            />
          </div>

          {/* Table body */}
          {loading ? (
            <div className="loader-container">
              <div className="spinner" />
            </div>
          ) : employees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>No employees found</h3>
              <p>
                {search || filterDept || filterStatus
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by adding your first employee.'}
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Hire Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td className="id-cell">#{emp.id}</td>
                      <td>
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-email">{emp.email}</div>
                      </td>
                      <td><span className="role-tag">{emp.role}</span></td>
                      <td>
                        <span className={`dept-badge ${DEPT_CLASS[emp.department] || 'dept-indigo'}`}>
                          {emp.department}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${STATUS_CLASS[emp.status] || ''}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="date-cell">
                        {emp.hire_date
                          ? new Date(emp.hire_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <button className="btn-icon" onClick={() => handleOpenModal(emp)}>Edit</button>
                        <button className="btn-icon btn-danger" onClick={() => handleDeleteClick(emp)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Row count */}
          {!loading && employees.length > 0 && (
            <div className="table-footer">
              {employees.length} employee{employees.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{currentEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>

            <form onSubmit={handleSave}>
              {/* Row 1 */}
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input required type="text" name="name" placeholder="Jane Doe"
                    value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input required type="email" name="email" placeholder="jane@cloudcorp.com"
                    value={formData.email} onChange={handleInputChange} />
                </div>
              </div>

              {/* Row 2 */}
              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" placeholder="+1-555-0100"
                    value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Job Role *</label>
                  <select required name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="">Select role…</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <select required name="department" value={formData.department} onChange={handleInputChange}>
                    <option value="">Select department…</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              {/* Row 4 */}
              <div className="form-group">
                <label>Hire Date</label>
                <input type="date" name="hire_date"
                  value={formData.hire_date} onChange={handleInputChange} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {currentEmployee ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirm.open && (
        <ConfirmModal
          message={`Are you sure you want to delete ${confirm.empName}? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {/* ── Toasts ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </div>
  )
}

export default App
