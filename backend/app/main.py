import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from prometheus_flask_exporter import PrometheusMetrics

app = Flask(__name__)
metrics = PrometheusMetrics(app)
metrics.info('app_info', 'Employee Management Application info', version='1.0.0')

CORS(app)

# In-memory database to hold state during local testing
employees_db = [
    {"id": 1, "name": "John Doe", "department": "Engineering", "role": "Cloud Architect"},
    {"id": 2, "name": "Jane Smith", "department": "Product", "role": "Product Manager"}
]
current_id = 3

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/api/employees', methods=['GET'])
def get_employees():
    return jsonify(employees_db), 200

@app.route('/api/employees', methods=['POST'])
def add_employee():
    global current_id
    data = request.json
    new_employee = {
        "id": current_id,
        "name": data.get("name"),
        "department": data.get("department"),
        "role": data.get("role")
    }
    employees_db.append(new_employee)
    current_id += 1
    return jsonify(new_employee), 201

@app.route('/api/employees/<int:emp_id>', methods=['PUT'])
def update_employee(emp_id):
    data = request.json
    for emp in employees_db:
        if emp["id"] == emp_id:
            emp["name"] = data.get("name", emp["name"])
            emp["department"] = data.get("department", emp["department"])
            emp["role"] = data.get("role", emp["role"])
            return jsonify(emp), 200
    return jsonify({"error": "Employee not found"}), 404

@app.route('/api/employees/<int:emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    global employees_db
    employees_db = [emp for emp in employees_db if emp["id"] != emp_id]
    return jsonify({"message": "Employee deleted"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
