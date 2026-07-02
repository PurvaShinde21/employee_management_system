"""
Unit / integration tests for the Employee Management Flask API.
Run from the /backend directory:  pytest tests/ -v
"""
import json


# ── Helpers ──────────────────────────────────────────────────────────────────

VALID_EMPLOYEE = {
    "name":       "Test Employee",
    "email":      "test.employee@cloudcorp.com",
    "phone":      "+1-555-9999",
    "role":       "DevOps Engineer",
    "department": "Engineering",
    "hire_date":  "2024-01-15",
    "status":     "Active",
}


def post_employee(client, payload=None):
    payload = payload or VALID_EMPLOYEE
    return client.post(
        '/api/employees',
        data=json.dumps(payload),
        content_type='application/json',
    )


# ── Health check ─────────────────────────────────────────────────────────────

def test_health_check(test_client):
    res = test_client.get('/health')
    assert res.status_code == 200
    assert res.get_json()['status'] == 'healthy'


# ── GET /api/departments & /api/roles ────────────────────────────────────────

def test_get_departments(test_client):
    res = test_client.get('/api/departments')
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert 'Engineering' in data


def test_get_roles(test_client):
    res = test_client.get('/api/roles')
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert 'DevOps Engineer' in data


# ── POST /api/employees ───────────────────────────────────────────────────────

def test_create_employee_success(test_client):
    res = post_employee(test_client)
    assert res.status_code == 201
    data = res.get_json()
    assert data['name']  == 'Test Employee'
    assert data['email'] == 'test.employee@cloudcorp.com'
    assert 'id' in data


def test_create_employee_missing_name(test_client):
    payload = {**VALID_EMPLOYEE, 'name': '', 'email': 'another@cloudcorp.com'}
    res = post_employee(test_client, payload)
    assert res.status_code == 422
    assert 'errors' in res.get_json()


def test_create_employee_invalid_email(test_client):
    payload = {**VALID_EMPLOYEE, 'email': 'not-an-email', 'name': 'Bad Email Test'}
    res = post_employee(test_client, payload)
    assert res.status_code == 422


def test_create_employee_invalid_role(test_client):
    payload = {**VALID_EMPLOYEE, 'role': 'Ninja', 'email': 'ninja@cloudcorp.com', 'name': 'Role Test'}
    res = post_employee(test_client, payload)
    assert res.status_code == 422


def test_create_employee_invalid_department(test_client):
    payload = {**VALID_EMPLOYEE, 'department': 'Magic', 'email': 'magic@cloudcorp.com', 'name': 'Dept Test'}
    res = post_employee(test_client, payload)
    assert res.status_code == 422


def test_create_employee_invalid_date(test_client):
    payload = {**VALID_EMPLOYEE, 'hire_date': '15-01-2024', 'email': 'date@cloudcorp.com', 'name': 'Date Test'}
    res = post_employee(test_client, payload)
    assert res.status_code == 422


def test_create_employee_duplicate_email(test_client):
    # First creation should succeed
    post_employee(test_client, {**VALID_EMPLOYEE, 'email': 'dupe@cloudcorp.com', 'name': 'Dupe One'})
    # Second with same email should fail
    res = post_employee(test_client, {**VALID_EMPLOYEE, 'email': 'dupe@cloudcorp.com', 'name': 'Dupe Two'})
    assert res.status_code == 400


# ── GET /api/employees ────────────────────────────────────────────────────────

def test_get_employees(test_client):
    res = test_client.get('/api/employees')
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_get_employees_filter_invalid_status(test_client):
    res = test_client.get('/api/employees?status=Unknown')
    assert res.status_code == 400


def test_get_employees_filter_invalid_department(test_client):
    res = test_client.get('/api/employees?department=FakeDept')
    assert res.status_code == 400


# ── PUT /api/employees/<id> ──────────────────────────────────────────────────

def test_update_employee(test_client):
    # Create first
    create_res = post_employee(test_client, {**VALID_EMPLOYEE, 'email': 'update@cloudcorp.com', 'name': 'Update Me'})
    emp_id = create_res.get_json()['id']

    # Update name
    res = test_client.put(
        f'/api/employees/{emp_id}',
        data=json.dumps({'name': 'Updated Name'}),
        content_type='application/json',
    )
    assert res.status_code == 200
    assert res.get_json()['name'] == 'Updated Name'


def test_update_employee_not_found(test_client):
    res = test_client.put(
        '/api/employees/99999',
        data=json.dumps({'name': 'Ghost'}),
        content_type='application/json',
    )
    assert res.status_code == 404


# ── DELETE /api/employees/<id> ───────────────────────────────────────────────

def test_delete_employee(test_client):
    create_res = post_employee(test_client, {**VALID_EMPLOYEE, 'email': 'delete@cloudcorp.com', 'name': 'Delete Me'})
    emp_id = create_res.get_json()['id']

    res = test_client.delete(f'/api/employees/{emp_id}')
    assert res.status_code == 200

    # Confirm it's gone
    all_employees = test_client.get('/api/employees').get_json()
    assert not any(e['id'] == emp_id for e in all_employees)


def test_delete_employee_not_found(test_client):
    res = test_client.delete('/api/employees/99999')
    assert res.status_code == 404


# ── GET /api/stats ────────────────────────────────────────────────────────────

def test_get_stats(test_client):
    res = test_client.get('/api/stats')
    assert res.status_code == 200
    data = res.get_json()
    assert 'total' in data
    assert 'active' in data
    assert 'by_department' in data
    assert 'new_this_month' in data
