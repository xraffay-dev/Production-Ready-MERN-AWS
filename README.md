<p align="center">
  <img src="https://img.shields.io/badge/Terraform-1.14-844FBA?style=for-the-badge&logo=terraform&logoColor=white" alt="Terraform" />
  <img src="https://img.shields.io/badge/AWS-Cloud-FF9900?style=for-the-badge&logo=amazonwebservices&logoColor=white" alt="AWS" />
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/DocumentDB-5.0-4053D6?style=for-the-badge&logo=amazondocumentdb&logoColor=white" alt="DocumentDB" />
</p>

# 🚀 Production-Ready MERN Stack on AWS

> **A fully automated, production-grade AWS infrastructure for deploying MERN stack applications — built entirely with Terraform IaC, GitHub Actions CI/CD, and AWS-native services.**

This project demonstrates how to architect, provision, and deploy a complete MERN (MongoDB/DocumentDB, Express, React, Node.js) application on AWS using **Infrastructure as Code** principles. Every piece of cloud infrastructure — from VPC networking to auto-scaling compute — is codified, version-controlled, and reproducible.

> [!NOTE]
> The `frontend/` and `backend/` directories contain a sample application used purely for demonstration purposes. The core focus of this repository is the **infrastructure and deployment pipeline** defined in `infrastructure/`, `modules/`, and `.github/workflows/`.

---

## 📐 Architecture Overview

![AWS Architecture Diagram](./docs/Architecture%20Diagram%20BG-White.svg)

### Traffic Flow

1. **Users** → CloudFront (HTTPS) → serves static React SPA from S3
2. **API calls** (`/api/*`) → CloudFront → ALB (HTTP :80) → EC2 (Docker, port 8000)
3. **EC2 instances** → DocumentDB (port 27017, TLS) via private subnets
4. **No NAT Gateway** — AWS service access handled entirely via VPC Endpoints

---

## 🏗️ Infrastructure Modules

The Terraform codebase follows a **modular architecture** with clean separation of concerns. Each module is independently configurable and reusable.

```
infrastructure/                  # Root Terraform configuration
├── main.tf                      # Module orchestration & SSM parameters
├── backend.tf                   # S3 remote state configuration
├── variables.tf                 # Root-level input variables
├── output.tf                    # Deployment outputs (ASG, CloudFront, etc.)
├── versions.tf                  # Provider & Terraform version constraints
└── terraform.tfvars.example     # Example variable values

modules/
├── vpc/                         # VPC with DNS support for private endpoints
├── networking/                  # Subnets, IGW, Route Tables, VPC Endpoints
├── security/                    # Security Groups (EC2, VPC Endpoints, DocumentDB)
├── iam/                         # IAM Roles, Policies, Instance Profiles
├── compute/                     # Launch Template, ALB, ASG, Scaling Policies
├── database/                    # DocumentDB Cluster, Parameter Groups, TLS Certs
└── storage/                     # S3 + CloudFront (frontend deployment & CDN)
```

### Module Details

| Module           | Resources Created                                                | Purpose                                                     |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| **`vpc`**        | VPC with DNS support & hostnames                                 | Foundation network with private DNS for VPC Endpoints       |
| **`networking`** | 4 Subnets, IGW, Route Tables, 6 VPC Endpoints                    | Multi-AZ networking with zero-NAT architecture              |
| **`security`**   | 3 Security Groups (EC2, VPC Endpoints, DocumentDB)               | Least-privilege network segmentation                        |
| **`iam`**        | IAM Role, Instance Profile, 3 Policies (ECR, SSM, S3)            | EC2 permissions for ECR pull, SSM read, cert download       |
| **`compute`**    | Launch Template, ALB, Target Group, ASG, Scaling Policy          | Dockerized backend with CPU-based auto-scaling              |
| **`database`**   | DocumentDB Cluster, 2 Instances, Parameter Group, S3 cert bucket | MongoDB-compatible DB with TLS, backups, encryption at rest |
| **`storage`**    | S3 Bucket, CloudFront Distribution, OAC, Cache Invalidation      | Static frontend hosting with CDN and API path rewriting     |

---

## 🔒 Security Architecture

This infrastructure implements defense-in-depth across every layer:

| Layer                   | Implementation                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Network Isolation**   | EC2 and DocumentDB run in **private subnets** with no public IPs or internet access                                     |
| **Zero NAT Gateway**    | All AWS API calls (ECR, SSM, S3) use **VPC Interface & Gateway Endpoints**, eliminating NAT costs and internet exposure |
| **TLS Everywhere**      | DocumentDB enforces TLS with `global-bundle.pem`; CloudFront redirects to HTTPS                                         |
| **Encryption at Rest**  | DocumentDB storage encrypted via AWS KMS; S3 objects use AES-256 SSE                                                    |
| **Secrets Management**  | Database credentials stored in **SSM Parameter Store** (`SecureString`); no secrets in code or env files                |
| **Least-Privilege IAM** | EC2 role scoped to specific ECR repos, SSM paths (`/ec2/config/*`), and a single S3 bucket                              |
| **S3 Hardening**        | Public access blocked on all buckets; CloudFront uses **Origin Access Control (OAC)** for S3                            |
| **Security Groups**     | DocumentDB accepts traffic only from VPC CIDR on port 27017; VPC Endpoint SGs scoped to VPC CIDR on 443                 |
| **Docker Security**     | Container runs as **non-root user** with health checks                                                                  |
| **OIDC Authentication** | GitHub Actions authenticates to AWS via **OIDC federation** — no long-lived access keys                                 |

---

## ⚙️ CI/CD Pipeline

Two independent **GitHub Actions** workflows handle deployment, triggered manually via `workflow_dispatch`:

### Backend Pipeline (`backend-ci-cd.yml`)

```
Checkout → Docker Build → OIDC Auth → ECR Login → Tag & Push → Terraform Output → ASG Instance Refresh
```

1. Builds the Docker image from `backend/Dockerfile`
2. Authenticates to AWS via OIDC (role assumption)
3. Pushes the image to **Amazon ECR**
4. Reads the ASG name from **Terraform remote state**
5. Triggers an **ASG Instance Refresh** for zero-downtime rolling deployment

### Frontend Pipeline (`frontend-ci-cd.yml`)

```
Checkout → npm install → Build (Vite) → OIDC Auth → S3 Sync → CloudFront Invalidation
```

1. Builds the React/TypeScript frontend with Vite
2. Syncs the production build to **S3** (with `--delete` for cleanup)
3. Reads the CloudFront Distribution ID from **Terraform remote state**
4. Invalidates the **CloudFront cache** for immediate propagation

> [!IMPORTANT]
> Both pipelines use `sparse-checkout` to pull only the required directories, minimizing checkout time and data transfer.

---

## 🖥️ EC2 Boot Sequence

Instances launched by the ASG are fully self-configuring via the [`user-data.sh`](modules/compute/user-data.sh) script:

```
┌─────────────────────────────────────────┐
│          EC2 Instance Boot              │
├─────────────────────────────────────────┤
│ 1. Fetch config from SSM Parameter Store│
│    ├── DOCDB_URI (SecureString)         │
│    ├── FRONTEND_URL                     │
│    ├── PORT                             │
│    └── DOCDB_CERT_BUCKET               │
│                                         │
│ 2. Download TLS cert from S3            │
│    └── s3://<bucket>/certs/             │
│        global-bundle.pem               │
│                                         │
│ 3. Authenticate Docker to ECR           │
│                                         │
│ 4. Pull latest backend image            │
│                                         │
│ 5. Run container with:                  │
│    ├── MONGO_URI = DocumentDB URI       │
│    ├── FRONTEND_URL = CloudFront URL    │
│    ├── PORT = Application port          │
│    └── TLS cert volume mount            │
└─────────────────────────────────────────┘
```

All configuration is dynamically resolved at boot — **zero hardcoded secrets** in the launch template or AMI.

---

## 🛠️ Prerequisites

Before deploying, ensure you have the following:

| Tool                                                                           | Version     | Purpose                          |
| ------------------------------------------------------------------------------ | ----------- | -------------------------------- |
| [Terraform](https://developer.hashicorp.com/terraform/install)                 | `~> 1.14.0` | Infrastructure provisioning      |
| [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) | v2          | AWS API interactions             |
| [Docker](https://docs.docker.com/get-docker/)                                  | Latest      | Building backend images          |
| [Node.js](https://nodejs.org/)                                                 | 20+         | Building the frontend            |
| AWS Account                                                                    | —           | With appropriate IAM permissions |

### AWS Resources to Create Manually

1. **S3 Bucket** for Terraform remote state (`mern-on-aws-backend`)
2. **ECR Repository** for backend Docker images (`main/mern-on-aws-backend-image`)
3. **IAM OIDC Provider** for GitHub Actions authentication
4. **IAM Role** for GitHub Actions with ECR, S3, CloudFront, ASG, and Terraform state permissions
5. Download the **DocumentDB TLS certificate** ([`global-bundle.pem`](https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem))

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/Production-Ready-MERN-AWS.git
cd Production-Ready-MERN-AWS
```

### 2. Configure Variables

```bash
cp infrastructure/terraform.tfvars.example infrastructure/terraform.tfvars
```

Edit `infrastructure/terraform.tfvars` with your values:

```hcl
# DocumentDB credentials
docdb_master_username = "your-admin-username"
docdb_master_password = "your-secure-password"

# Path to the downloaded TLS certificate
docdb_tls_cert_path = "C:/path/to/global-bundle.pem"

# Backend application port (default: 8000)
port = 8000
```

### 3. Initialize & Deploy Infrastructure

```bash
cd infrastructure

# Initialize Terraform with remote backend
terraform init

# Review the execution plan
terraform plan

# Apply the infrastructure
terraform apply
```

### 4. Build & Push the Backend Image

```bash
# Build the Docker image
docker build -t myapp:latest backend/

# Authenticate to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com

# Tag and push
docker tag myapp:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/main/mern-on-aws-backend-image:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/main/mern-on-aws-backend-image:latest
```

### 5. Build & Deploy the Frontend

```bash
cd frontend
npm install
npm run build
# Frontend files are automatically uploaded to S3 and CloudFront cache
# is invalidated by Terraform on the next `terraform apply`
```

### 6. Configure GitHub Actions Secrets

| Secret           | Description                                   |
| ---------------- | --------------------------------------------- |
| `ROLE_ARN`       | ARN of the IAM role for GitHub Actions (OIDC) |
| `AWS_REGION`     | AWS region (e.g., `ap-south-1`)               |
| `ECR_URI`        | Full ECR repository URI                       |
| `S3_BUCKET_NAME` | S3 bucket name for frontend deployment        |

---

## 📤 Terraform Outputs

After deployment, Terraform provides the following outputs:

| Output                       | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `cloudfront_domain_name`     | CloudFront URL — your application's entry point                   |
| `alb_dns_name`               | ALB DNS name (internal, used by CloudFront)                       |
| `asg_id`                     | Auto Scaling Group ID                                             |
| `asg_name`                   | Auto Scaling Group name (used by CI/CD for instance refresh)      |
| `cloudfront_distribution_id` | CloudFront Distribution ID (used by CI/CD for cache invalidation) |
| `docdb_cluster_endpoint`     | DocumentDB cluster endpoint                                       |
| `docdb_connection_string`    | Full MongoDB-compatible connection URI _(sensitive)_              |

---

## 📁 Project Structure

```
Production-Ready-MERN-AWS/
│
├── infrastructure/              # 🏗️  Root Terraform configuration
│   ├── main.tf                  #     Module wiring, SSM params, env file generation
│   ├── backend.tf               #     S3 remote state backend
│   ├── variables.tf             #     Input variables (port, DB creds, cert path)
│   ├── output.tf                #     Deployment outputs
│   ├── versions.tf              #     Terraform ~> 1.14, AWS provider ~> 6.32
│   └── terraform.tfvars.example #     Example configuration
│
├── modules/
│   ├── vpc/                     # 🌐  VPC with DNS support
│   ├── networking/              # 🔌  Subnets, IGW, Route Tables, VPC Endpoints
│   ├── security/                # 🛡️   Security Groups (EC2, Endpoints, DocumentDB)
│   ├── iam/                     # 🔑  Roles, Policies, Instance Profiles
│   ├── compute/                 # ⚡  Launch Template, ALB, ASG, user-data.sh
│   ├── database/                # 🗄️   DocumentDB, Parameter Groups, TLS Certs
│   └── storage/                 # 📦  S3, CloudFront, OAC, Cache Invalidation
│
├── .github/workflows/
│   ├── backend-ci-cd.yml        # 🔄  Backend: Build → ECR → ASG Refresh
│   └── frontend-ci-cd.yml       # 🔄  Frontend: Build → S3 → CloudFront Invalidation
│
├── backend/                     # 📱  Sample Express.js API (demo application)
│   ├── Dockerfile               #     Multi-stage build, non-root user, health check
│   ├── app.js                   #     Express server with CORS, rate limiting
│   └── config/dbConfig.js       #     Mongoose connection (DocumentDB-compatible)
│
├── frontend/                    # 💻  Sample React + TypeScript SPA (demo application)
│   ├── src/                     #     Vite-powered React application
│   └── .env.example             #     Environment template
│
└── .gitignore                   #     Comprehensive Terraform + Node.js ignore rules
```

---

## 🔑 Key Design Decisions

### Why No NAT Gateway?

NAT Gateways cost ~$32/month per AZ plus data processing fees. Instead, this architecture uses **6 VPC Endpoints** to provide private connectivity to AWS services:

| Endpoint      | Type           | Purpose                               |
| ------------- | -------------- | ------------------------------------- |
| `ecr.api`     | Interface      | ECR authentication and image metadata |
| `ecr.dkr`     | Interface      | Docker image layer downloads          |
| `s3`          | Gateway (free) | ECR image storage + TLS cert download |
| `ssm`         | Interface      | SSM Parameter Store API calls         |
| `ssmmessages` | Interface      | SSM Session Manager control channel   |
| `ec2messages` | Interface      | SSM Run Command message delivery      |

### Why DocumentDB over MongoDB Atlas?

- **Network isolation**: Runs inside the VPC with no public exposure
- **AWS-native integration**: IAM, CloudWatch, encryption, backups — all managed
- **TLS enforced**: All connections encrypted in transit
- **Consistent latency**: Same-VPC communication vs. cross-internet to Atlas

### Why CloudFront in Front of ALB?

- **Single entry point**: One URL for both frontend (S3) and backend (ALB)
- **HTTPS termination**: CloudFront handles TLS; ALB runs HTTP internally
- **API path rewriting**: CloudFront Function strips `/api` prefix before forwarding
- **SPA routing**: Custom error responses (403/404 → `index.html`) for client-side routing
- **Global edge caching**: Static assets cached at edge locations worldwide

### Why SSM Parameter Store over Environment Variables?

- **No secrets in code**: Connection strings and credentials live in SSM, not in launch templates or `.env` files
- **Dynamic resolution**: EC2 instances fetch the latest config at boot
- **SecureString support**: Database URIs encrypted with AWS KMS
- **Audit trail**: CloudTrail logs every parameter access

---

## 🧩 Technology Stack

| Layer                  | Technology                      | Version           |
| ---------------------- | ------------------------------- | ----------------- |
| **IaC**                | Terraform                       | `~> 1.14.0`       |
| **Cloud Provider**     | AWS (`hashicorp/aws`)           | `~> 6.32`         |
| **Compute**            | EC2 (`c7i-flex.large`) + Docker | Amazon Linux 2023 |
| **Container Registry** | Amazon ECR                      | —                 |
| **Load Balancer**      | Application Load Balancer (ALB) | HTTP              |
| **Auto Scaling**       | ASG with CPU target tracking    | 50% threshold     |
| **Database**           | Amazon DocumentDB               | `5.0.0`           |
| **Frontend Hosting**   | S3 + CloudFront                 | OAC + HTTPS       |
| **Secrets**            | SSM Parameter Store             | SecureString      |
| **CI/CD**              | GitHub Actions                  | OIDC federation   |
| **State Management**   | S3 Backend                      | Native locking    |
| **Backend Runtime**    | Node.js + Express               | `22.14.0-alpine`  |
| **Frontend Framework** | React + TypeScript + Vite       | `18.2.0`          |

---

## 📊 Cost Optimization

This architecture is designed with cost-efficiency in mind:

| Decision                       | Savings                                         |
| ------------------------------ | ----------------------------------------------- |
| **No NAT Gateway**             | ~$64/month saved (2 AZs × $32/month)            |
| **S3 Gateway Endpoint**        | Free (vs. Interface Endpoint charges)           |
| **`c7i-flex.large` instances** | Cost-effective burstable compute                |
| **`db.t3.medium` DocumentDB**  | Right-sized for moderate workloads              |
| **CloudFront caching**         | Reduces origin requests and ALB load            |
| **ASG min=1, max=2**           | Scales down during low traffic                  |
| **Audit logs disabled**        | Reduces CloudWatch Logs costs (enable for prod) |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Built with Terraform, deployed on AWS, automated with GitHub Actions.</strong>
  <br />
  <sub>Infrastructure as Code • Zero-Trust Networking • Automated CI/CD</sub>
</p>
