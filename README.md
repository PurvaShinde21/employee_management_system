# Employee Management System - Cloud DevOps Portfolio

A production-grade, 3-tier web application built to demonstrate modern Cloud Architecture, DevOps automation, and Infrastructure as Code (IaC) best practices on AWS.

##  Live Demo
*Link to Live Application (Replace with your ALB URL)*

##  Architecture & Technologies
This project implements a highly available, scalable architecture using the following stack:

*   **Frontend**: React.js (Vite)
*   **Backend**: Python Flask (REST API)
*   **Containerization**: Docker & Amazon ECR
*   **Infrastructure as Code (IaC)**: Terraform
*   **CI/CD Pipeline**: GitHub Actions
*   **Cloud Provider**: AWS (VPC, EC2, ALB, Auto Scaling, RDS, IAM)
*   **Security**: OIDC (OpenID Connect) for secretless authentication, Private Subnets for database isolation.

## ⚙️DevOps & Cloud Highlights
1.  **Zero-Downtime Deployments**: The CI/CD pipeline is configured to automatically build Docker images, push them to Amazon ECR, and trigger an AWS Auto Scaling Group Instance Refresh to seamlessly roll out updates without dropping traffic.
2.  **Secretless Authentication (OIDC)**: Instead of storing long-lived AWS Access Keys in GitHub, this project uses an OpenID Connect (OIDC) trust relationship between GitHub Actions and AWS IAM to dynamically request temporary, least-privilege access tokens.
3.  **Modular Infrastructure**: The AWS infrastructure is fully codified using Terraform modules (VPC, ALB, EC2 ASG, RDS, Security Groups) to promote reusability and clean state management.
4.  **Path-Based Routing**: A single AWS Application Load Balancer intelligently routes internet traffic to the React frontend (`/`) and the Flask API (`/api/*`) using target groups.

##  Repository Structure
*   `/frontend` - React.js application and Dockerfile.
*   `/backend` - Python Flask API and Dockerfile.
*   `/terraform` - Infrastructure as Code definitions.
*   `/.github/workflows` - CI/CD pipeline definitions.

##  Local Development
To run this application locally using Docker Compose:
```bash
docker-compose up --build
```
*   Frontend will be available at `http://localhost:3000`
*   Backend API will be available at `http://localhost:5000/api/employees`

##  Cloud Deployment
To deploy the infrastructure to AWS:
```bash
cd terraform
terraform init
terraform apply -var="db_username=admin" -var="db_password=supersecretpassword"
```

##  License
This project is for educational and portfolio purposes.
