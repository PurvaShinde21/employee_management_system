import { useState, useEffect } from 'react'
import './index.css'

function App() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState(null)
  const [formData, setFormData] = useState({ name: '', role: '', department: '' })

  const fetchEmployees = () => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        setEmployees(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching employees:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setCurrentEmployee(employee)
      setFormData({ name: employee.name, role: employee.role, department: employee.department })
    } else {
      setCurrentEmployee(null)
      setFormData({ name: '', role: '', department: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentEmployee(null)
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const method = currentEmployee ? 'PUT' : 'POST'
    const url = currentEmployee 
      ? `/api/employees/${currentEmployee.id}` 
      : '/api/employees'

    try {
      await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      handleCloseModal()
      fetchEmployees() // Refresh list
    } catch (err) {
      console.error("Error saving employee:", err)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      fetchEmployees() // Refresh list
    } catch (err) {
      console.error("Error deleting employee:", err)
    }
  }

  return (
    <div className="dashboard">
      <header className="header">
        <h1>CloudCorp <span>Employee Management</span></h1>
        <div className="badge">AWS DevOps Demo</div>
      </header>

      <main className="main-content">
        <div className="table-card">
          <div className="table-header">
            <h2>Employee Directory</h2>
            <button className="btn-primary" onClick={() => handleOpenModal()}>Add Employee</button>
          </div>
          
          {loading ? (
            <div className="loader">Loading...</div>
          ) : (
            <table className="employee-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td><strong>{emp.name}</strong></td>
                    <td><span className="role-tag">{emp.role}</span></td>
                    <td>{emp.department}</td>
                    <td>
                      <button className="btn-icon" onClick={() => handleOpenModal(emp)}>Edit</button>
                      <button className="btn-icon btn-danger" onClick={() => handleDelete(emp.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Form Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{currentEmployee ? "Edit Employee" : "Add Employee"}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input required type="text" name="role" value={formData.role} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input required type="text" name="department" value={formData.department} onChange={handleInputChange} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
