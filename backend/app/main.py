import os
import re
import time
import logging
from datetime import datetime, date
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from prometheus_flask_exporter import PrometheusMetrics

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
metrics = PrometheusMetrics(app)
metrics.info('app_info', 'Employee Management Application info', version='2.0.0')

# ---------------------------------------------------------------------------
# CORS — restrict to known origins.
# Set ALLOWED_ORIGINS env var for production (comma-separated URLs).
# Defaults to localhost for local dev.
# ---------------------------------------------------------------------------
_raw_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173')
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(',') if o.strip()]
CORS(app, origins=ALLOWED_ORIGINS)

# ---------------------------------------------------------------------------
# Database configuration — reads from env vars (set by docker-compose / ECS)
# Falls back to SQLite for bare-metal local dev (no Docker)
# ---------------------------------------------------------------------------
DB_HOST = os.environ.get('DB_HOST', '')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASS = os.environ.get('DB_PASS', '')
DB_NAME = os.environ.get('DB_NAME', 'employees')

if DB_HOST:
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f'mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}'
    )
else:
    # SQLite fallback for local dev without Docker
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f'sqlite:///{os.path.join(basedir, "employees.db")}'
    )

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DEPARTMENTS = ['Engineering', 'Product', 'HR', 'Marketing', 'Finance', 'Operations', 'Sales', 'Customer Support', 'Legal', 'IT']
ROLES       = ['Software Engineer', 'Senior Software Engineer', 'DevOps Engineer', 'Cloud Architect', 'Product Manager', 'HR Manager', 'Marketing Lead', 'Financial Analyst', 'Data Scientist', 'UI/UX Designer']
STATUSES    = ['Active', 'On Leave', 'Terminated']

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class Employee(db.Model):
    __tablename__ = 'employees'

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(150), unique=True, nullable=False)
    phone      = db.Column(db.String(30),  nullable=True)
    role       = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    hire_date  = db.Column(db.Date,        nullable=True)
    status     = db.Column(db.String(20),  nullable=False, default='Active')

    def to_dict(self):
        return {
            'id':         self.id,
            'name':       self.name,
            'email':      self.email,
            'phone':      self.phone or '',
            'role':       self.role,
            'department': self.department,
            'hire_date':  self.hire_date.isoformat() if self.hire_date else '',
            'status':     self.status,
        }

# ---------------------------------------------------------------------------
# Input validation helpers
# ---------------------------------------------------------------------------
def validate_employee_data(data, is_update=False):
    """
    Validate employee payload. Returns a list of error strings.
    `is_update=True` means fields are optional (only validates what is provided).
    """
    errors = []

    name = data.get('name', '').strip() if is_update else data.get('name', '')
    email = data.get('email', '').strip() if is_update else data.get('email', '')
    role = data.get('role', '').strip() if is_update else data.get('role', '')
    department = data.get('department', '').strip() if is_update else data.get('department', '')
    status = data.get('status', '')

    if not is_update:
        # Required fields for creation
        if not name or not name.strip():
            errors.append("'name' is required and cannot be empty.")
        if not email or not email.strip():
            errors.append("'email' is required and cannot be empty.")
        if not role:
            errors.append("'role' is required.")
        if not department:
            errors.append("'department' is required.")
    else:
        # For updates, only validate fields that ARE provided
        if 'name' in data and not data['name'].strip():
            errors.append("'name' cannot be empty.")
        if 'email' in data and not data['email'].strip():
            errors.append("'email' cannot be empty.")

    # Validate email format if provided
    if email and not EMAIL_RE.match(email.strip()):
        errors.append("'email' must be a valid email address.")

    # Validate length constraints
    if name and len(name.strip()) > 100:
        errors.append("'name' must be 100 characters or fewer.")
    if email and len(email.strip()) > 150:
        errors.append("'email' must be 150 characters or fewer.")

    # Validate enum values
    if role and role not in ROLES:
        errors.append(f"'role' must be one of: {', '.join(ROLES)}.")
    if department and department not in DEPARTMENTS:
        errors.append(f"'department' must be one of: {', '.join(DEPARTMENTS)}.")
    if status and status not in STATUSES:
        errors.append(f"'status' must be one of: {', '.join(STATUSES)}.")

    # Validate hire_date format if provided
    if data.get('hire_date'):
        try:
            datetime.strptime(data['hire_date'], '%Y-%m-%d')
        except ValueError:
            errors.append("'hire_date' must be in YYYY-MM-DD format.")

    return errors

# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
def seed_data():
    if Employee.query.count() == 0:
        seeds = [
            Employee(name='John Doe',      email='john.doe@cloudcorp.com',   phone='+1-555-0101',
                     role='Cloud Architect',    department='Engineering', hire_date=date(2022, 3, 15),  status='Active'),
            Employee(name='Jane Smith',    email='jane.smith@cloudcorp.com', phone='+1-555-0102',
                     role='Product Manager',    department='Product',     hire_date=date(2021, 7, 1),   status='Active'),
            Employee(name='Alice Johnson', email='alice.j@cloudcorp.com',    phone='+1-555-0103',
                     role='DevOps Engineer',    department='Engineering', hire_date=date(2023, 1, 20),  status='Active'),
            Employee(name='Bob Williams',  email='bob.w@cloudcorp.com',      phone='+1-555-0104',
                     role='HR Manager',         department='HR',          hire_date=date(2020, 5, 10),  status='Active'),
            Employee(name='Carol Davis',   email='carol.d@cloudcorp.com',    phone='+1-555-0105',
                     role='Marketing Lead',     department='Marketing',   hire_date=date(2022, 9, 5),   status='On Leave'),
            Employee(name='David Lee',     email='david.l@cloudcorp.com',    phone='+1-555-0106',
                     role='Financial Analyst',  department='Finance',     hire_date=date(2019, 11, 22), status='Active'),
        ]
        db.session.bulk_save_objects(seeds)
        db.session.commit()
        logger.info("Seeded initial employee data.")

# ---------------------------------------------------------------------------
# DB init with retry (MySQL may not be ready immediately in Docker)
# ---------------------------------------------------------------------------
def init_db():
    with app.app_context():
        for attempt in range(10):
            try:
                db.create_all()
                seed_data()
                logger.info("Database initialised.")
                break
            except Exception as exc:
                logger.warning(f"DB not ready (attempt {attempt + 1}/10): {exc}")
                time.sleep(4)

init_db()

# ---------------------------------------------------------------------------
# Routes — metadata
# ---------------------------------------------------------------------------
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/departments', methods=['GET'])
def get_departments():
    return jsonify(DEPARTMENTS), 200

@app.route('/api/roles', methods=['GET'])
def get_roles():
    return jsonify(ROLES), 200

@app.route('/api/stats', methods=['GET'])
def get_stats():
    total      = Employee.query.count()
    active     = Employee.query.filter_by(status='Active').count()
    on_leave   = Employee.query.filter_by(status='On Leave').count()
    terminated = Employee.query.filter_by(status='Terminated').count()

    by_department = {
        dept: Employee.query.filter_by(department=dept).count()
        for dept in DEPARTMENTS
        if Employee.query.filter_by(department=dept).count() > 0
    }

    today            = date.today()
    this_month_start = today.replace(day=1)
    new_this_month   = Employee.query.filter(
        Employee.hire_date >= this_month_start
    ).count()

    return jsonify({
        'total':          total,
        'active':         active,
        'on_leave':       on_leave,
        'terminated':     terminated,
        'by_department':  by_department,
        'new_this_month': new_this_month,
    }), 200

# ---------------------------------------------------------------------------
# Routes — CRUD
# ---------------------------------------------------------------------------
@app.route('/api/employees', methods=['GET'])
def get_employees():
    search     = request.args.get('search',     '').strip()
    department = request.args.get('department', '').strip()
    status     = request.args.get('status',     '').strip()

    # Validate filter values against allowed enums to prevent NoSQL-style injection
    if department and department not in DEPARTMENTS:
        return jsonify({'error': 'Invalid department filter.'}), 400
    if status and status not in STATUSES:
        return jsonify({'error': 'Invalid status filter.'}), 400

    query = Employee.query

    if search:
        like  = f'%{search}%'
        query = query.filter(
            db.or_(
                Employee.name.ilike(like),
                Employee.role.ilike(like),
                Employee.email.ilike(like),
            )
        )
    if department:
        query = query.filter_by(department=department)
    if status:
        query = query.filter_by(status=status)

    employees = query.order_by(Employee.id).all()
    return jsonify([e.to_dict() for e in employees]), 200


@app.route('/api/employees', methods=['POST'])
def add_employee():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be valid JSON.'}), 400

    errors = validate_employee_data(data, is_update=False)
    if errors:
        return jsonify({'errors': errors}), 422

    try:
        hire_date = (
            datetime.strptime(data['hire_date'], '%Y-%m-%d').date()
            if data.get('hire_date') else None
        )
        new_emp = Employee(
            name       = data['name'].strip(),
            email      = data['email'].strip().lower(),
            phone      = data.get('phone', '').strip(),
            role       = data['role'],
            department = data['department'],
            hire_date  = hire_date,
            status     = data.get('status', 'Active'),
        )
        db.session.add(new_emp)
        db.session.commit()
        return jsonify(new_emp.to_dict()), 201
    except Exception as exc:
        db.session.rollback()
        logger.error(f"Error creating employee: {exc}")
        return jsonify({'error': 'Failed to create employee. Please check your input and try again.'}), 400


@app.route('/api/employees/<int:emp_id>', methods=['PUT'])
def update_employee(emp_id):
    emp  = Employee.query.get_or_404(emp_id)
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be valid JSON.'}), 400

    errors = validate_employee_data(data, is_update=True)
    if errors:
        return jsonify({'errors': errors}), 422

    try:
        emp.name       = data.get('name',       emp.name).strip()
        emp.email      = data.get('email',      emp.email).strip().lower()
        emp.phone      = data.get('phone',      emp.phone or '').strip()
        emp.role       = data.get('role',       emp.role)
        emp.department = data.get('department', emp.department)
        emp.status     = data.get('status',     emp.status)
        if data.get('hire_date'):
            emp.hire_date = datetime.strptime(data['hire_date'], '%Y-%m-%d').date()
        db.session.commit()
        return jsonify(emp.to_dict()), 200
    except Exception as exc:
        db.session.rollback()
        logger.error(f"Error updating employee {emp_id}: {exc}")
        return jsonify({'error': 'Failed to update employee. Please check your input and try again.'}), 400


@app.route('/api/employees/<int:emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    try:
        db.session.delete(emp)
        db.session.commit()
        return jsonify({'message': 'Employee deleted successfully.'}), 200
    except Exception as exc:
        db.session.rollback()
        logger.error(f"Error deleting employee {emp_id}: {exc}")
        return jsonify({'error': 'Failed to delete employee.'}), 500


if __name__ == '__main__':
    # For local bare-metal dev only. In Docker, Gunicorn is used (see Dockerfile).
    app.run(host='0.0.0.0', port=5000, debug=False)
