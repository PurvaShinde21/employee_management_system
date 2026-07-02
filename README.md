# Employee Management System — Cloud DevOps Portfolio

A production-grade, 3-tier web application built to demonstrate modern Cloud Architecture, DevOps automation, and Infrastructure as Code (IaC) best practices on AWS.

## 🔗 Live Demo
> Deploy locally with Docker Compose or to AWS with Terraform (see below).

---

## 🏗️ Architecture

```
                          ┌─────────────────────────────────────────┐
                          │              AWS Cloud (us-east-1)       │
                          │                                          │
  Internet ──► ALB ──────►│  EC2 ASG (Private Subnet)               │
              (Port 80)   │  ┌──────────────────────────────────┐   │
                          │  │  EC2 Instance                    │   │
                          │  │  ┌──────────────┐  ┌──────────┐ │   │
                          │  │  │ nginx:80     │  │Flask:5000│ │   │
                          │  │  │ (React SPA)  │  │(REST API)│ │   │
                          │  │  └──────────────┘  └──────────┘ │   │
                          │  │         ▲ /api/* routed by nginx  │   │
                          │  └──────────────────────────────────┘   │
                          │                  │                       │
                          │                  ▼                       │
                          │  ┌──────────────────────────────────┐   │
                          │  │  RDS MySQL 8 (Private DB Subnet) │   │
                          │  └──────────────────────────────────┘   │
                          │                                          │
                          │  ECR ◄── GitHub Actions (OIDC) ◄── git push
                          └─────────────────────────────────────────┘
```

### Technologies

| Category | Technology |
|---|---|
| **Frontend** | React (Vite) + Nginx |
| **Backend** | Python Flask + Gunicorn |
| **Database** | MySQL 8 (Docker / AWS RDS) |
| **Containerization** | Docker, Docker Compose, Amazon ECR |
| **Infrastructure as Code** | Terraform (modular — VPC, ALB, ASG, RDS, SGs) |
| **CI/CD** | GitHub Actions with OIDC (secretless AWS auth) |
| **Monitoring** | Prometheus + Grafana (auto-provisioned dashboards) |
| **Security** | Private subnets, SG chaining, non-root containers, security headers |

---

## 🔒 DevOps & Security Highlights

1. **Zero-Downtime Deployments** — CI/CD triggers an ASG Instance Refresh, rolling out new Docker images without dropping traffic.
2. **Secretless Auth (OIDC)** — GitHub Actions assumes an IAM role via OpenID Connect trust; no long-lived AWS keys are stored anywhere.
3. **Modular IaC** — All AWS infrastructure is in Terraform modules (VPC, ALB, EC2 ASG, RDS, Security Groups).
4. **Path-Based Routing** — A single ALB routes `/` → React frontend and `/api/*` → Flask API.
5. **Input Validation** — Server-side validation with enum checks, email format validation, and sanitised error messages (no internal exceptions leaked to clients).
6. **Non-root Containers** — The Flask backend runs as a non-root `appuser` inside Docker.
7. **Security Headers** — nginx serves `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` headers.
8. **Auto-provisioned Monitoring** — Grafana loads a pre-built dashboard (request rate, p95 latency, error rate, backend health) on first boot.

---

## 📁 Repository Structure

```
.
├── frontend/               # React (Vite) + Nginx Dockerfile
│   ├── src/
│   ├── nginx.conf          # Reverse proxy + security headers
│   └── Dockerfile          # Multi-stage build
├── backend/                # Python Flask REST API
│   ├── app/main.py         # CRUD routes + Prometheus metrics
│   ├── tests/              # pytest test suite (in-memory SQLite)
│   └── Dockerfile          # Non-root gunicorn container
├── terraform/              # Modular AWS IaC
│   ├── modules/
│   │   ├── vpc/            # VPC, subnets, NAT Gateway
│   │   ├── alb/            # Application Load Balancer + listeners
│   │   ├── ec2_asg/        # Launch Template + Auto Scaling Group
│   │   ├── rds/            # MySQL RDS (private subnet)
│   │   └── security_groups/# Least-privilege SG chaining
│   └── secrets.tfvars.example  # Credential template (never commit secrets.tfvars)
├── monitoring/
│   ├── prometheus.yml      # Scrape config
│   ├── dashboards/         # Pre-built Grafana dashboard JSON
│   └── grafana-provisioning/   # Auto-loads dashboard + datasource
├── .github/workflows/
│   └── ci-cd.yml           # Build → Test → ECR push → ASG refresh
└── docker-compose.yml      # Full local stack (reads from .env)
```

---

## 🚀 Local Development

### Prerequisites
- Docker & Docker Compose
- Copy `.env.example` → `.env` and set your passwords

```bash
cp .env.example .env
# Edit .env with your preferred passwords
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api/employees |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (login: admin / your GF_ADMIN_PASSWORD) |

### Run Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

---

## ☁️ AWS Deployment

### 1. Set up credentials file (never commit this)

```bash
cp terraform/secrets.tfvars.example terraform/secrets.tfvars
# Edit secrets.tfvars with your DB credentials
```

### 2. Deploy

```bash
cd terraform
terraform init
terraform apply -var-file="secrets.tfvars"
```

### 3. Tear down (to stop AWS costs)

```bash
terraform destroy -var-file="secrets.tfvars"
```

---

## 🎬 Demo Strategy (AWS Cost Constraint)

Since AWS resources cost money to run continuously, the recommended showcase approach is:

1. **Record a single video** — `terraform apply` → CI/CD pipeline → live app → Grafana → `terraform destroy`
2. **Local Docker Compose** runs the full stack for free — Prometheus + Grafana included
3. **Static frontend** can be deployed to GitHub Pages / Vercel (zero cost) for a persistent live demo

---

## 📄 License

This project is for educational and portfolio purposes.
