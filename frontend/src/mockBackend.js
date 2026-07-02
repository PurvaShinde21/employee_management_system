/**
 * Mock Backend for Demo Mode (GitHub Pages)
 * Intercepts fetch calls to /api/* and returns mock data so the app can run without a real backend.
 */
const DEPARTMENTS = ['Engineering', 'Product', 'HR', 'Marketing', 'Finance', 'Operations', 'Sales', 'IT'];
const ROLES = ['Software Engineer', 'Senior Software Engineer', 'DevOps Engineer', 'Cloud Architect', 'Product Manager', 'HR Manager', 'Marketing Lead', 'Financial Analyst', 'Data Scientist', 'UI/UX Designer'];

let employees = [
  { id: 1, name: 'John Doe', email: 'john.doe@cloudcorp.com', phone: '+1-555-0101', role: 'Cloud Architect', department: 'Engineering', hire_date: '2022-03-15', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@cloudcorp.com', phone: '+1-555-0102', role: 'Product Manager', department: 'Product', hire_date: '2021-07-01', status: 'Active' },
  { id: 3, name: 'Alice Johnson', email: 'alice.j@cloudcorp.com', phone: '+1-555-0103', role: 'DevOps Engineer', department: 'Engineering', hire_date: '2023-01-20', status: 'Active' },
  { id: 4, name: 'Bob Williams', email: 'bob.w@cloudcorp.com', phone: '+1-555-0104', role: 'HR Manager', department: 'HR', hire_date: '2020-05-10', status: 'Active' },
  { id: 5, name: 'Carol Davis', email: 'carol.d@cloudcorp.com', phone: '+1-555-0105', role: 'Marketing Lead', department: 'Marketing', hire_date: '2022-09-05', status: 'On Leave' }
];

const originalFetch = window.fetch;

window.fetch = async (url, options = {}) => {
  // Only intercept /api calls
  if (!url.toString().startsWith('/api')) {
    return originalFetch(url, options);
  }

  const method = options.method || 'GET';
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;
  
  const jsonResponse = (data, status = 200) => 
    Promise.resolve(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }));

  // Simulate realistic network latency (300-600ms)
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

  if (method === 'GET' && path === '/api/departments') return jsonResponse(DEPARTMENTS);
  if (method === 'GET' && path === '/api/roles') return jsonResponse(ROLES);
  if (method === 'GET' && path === '/api/stats') {
    return jsonResponse({
      total: employees.length,
      active: employees.filter(e => e.status === 'Active').length,
      on_leave: employees.filter(e => e.status === 'On Leave').length,
      terminated: employees.filter(e => e.status === 'Terminated').length,
      by_department: DEPARTMENTS.reduce((acc, dept) => {
        const count = employees.filter(e => e.department === dept).length;
        if (count > 0) acc[dept] = count;
        return acc;
      }, {}),
      new_this_month: 0
    });
  }

  if (method === 'GET' && path === '/api/employees') {
    let filtered = [...employees];
    const search = urlObj.searchParams.get('search');
    const dept = urlObj.searchParams.get('department');
    const status = urlObj.searchParams.get('status');
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(e => e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s));
    }
    if (dept) filtered = filtered.filter(e => e.department === dept);
    if (status) filtered = filtered.filter(e => e.status === status);
    
    return jsonResponse(filtered);
  }

  if (method === 'POST' && path === '/api/employees') {
    const body = JSON.parse(options.body);
    const newEmp = { ...body, id: Math.max(...employees.map(e => e.id), 0) + 1 };
    employees.push(newEmp);
    return jsonResponse(newEmp, 201);
  }

  const idMatch = path.match(/\/api\/employees\/(\d+)/);
  if (idMatch) {
    const id = parseInt(idMatch[1]);
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) return jsonResponse({ error: 'Not found' }, 404);

    if (method === 'PUT') {
      const body = JSON.parse(options.body);
      employees[index] = { ...employees[index], ...body };
      return jsonResponse(employees[index]);
    }
    if (method === 'DELETE') {
      employees.splice(index, 1);
      return jsonResponse({ message: 'Deleted' });
    }
  }

  return jsonResponse({ error: 'Not found' }, 404);
};
