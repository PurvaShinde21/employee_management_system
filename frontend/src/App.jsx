import { useState, useEffect } from 'react'
import './index.css'

function App() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch data from our Flask backend container via localhost
    fetch('http://localhost:5000/api/employees')
      .then(res => res.json())
      .then(data => {
        setEmployees(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching employees:", err)
        setLoading(false)
      })
  }, [])

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
            <button className="btn-primary">Add Employee</button>
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
                      <button className="btn-icon">Edit</button>
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
    </div>
  )
}

export default App
