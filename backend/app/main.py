import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from prometheus_flask_exporter import PrometheusMetrics

app = Flask(__name__)
metrics = PrometheusMetrics(app)
metrics.info('app_info', 'Employee Management Application info', version='1.0.0')

CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/api/employees', methods=['GET'])
def get_employees():
    # Placeholder for database logic
    return jsonify([
        {"id": 1, "name": "John Doe", "department": "Engineering", "role": "Cloud Architect"},
        {"id": 2, "name": "Jane Smith", "department": "Product", "role": "Product Manager"}
    ]), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
