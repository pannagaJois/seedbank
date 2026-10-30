# Seed Bank AWS Free Tier Deployment Guide & Runbook

This guide provides step-by-step instructions for deploying the **Seed Bank** application (React/Vite frontend, Node/Express backend, and MySQL 8.0 database) on **AWS Free Tier**.

---

## 1. AWS Free Tier Limits & Resource Justification

Every service and instance class used in this architecture is strictly within the **AWS Free Tier** limits.

| AWS Resource | Chosen Specification | AWS Free Tier Monthly Limit | Why It Is Free Tier Eligible |
| :--- | :--- | :--- | :--- |
| **EC2 Instance** | `t2.micro` (or `t3.micro`), 1 vCPU, 1 GiB RAM | **750 hours/month** of Linux `t2.micro` / `t3.micro` | Single instance running 24/7 consumes 720-744 hours/month (<= 750 hours). |
| **EC2 Storage** | 20 GB `gp3` root volume | **30 GB/month** EBS General Purpose (gp2/gp3) | 20 GB is well within the 30 GB EBS Free Tier threshold. |
| **RDS MySQL** | `db.t3.micro`, Single-AZ, MySQL 8.0 | **750 hours/month** of `db.t3.micro` / `db.t4g.micro` | Single-AZ instance runs continuously for free under Free Tier. |
| **RDS Storage** | 20 GB `gp2` storage | **20 GB/month** General Purpose (SSD) database storage | Exactly matches the 20 GB RDS Free Tier storage allocation. |
| **RDS Backups** | 1-day retention | **20 GB/month** backup storage | Equal to active database storage, free under 20 GB allocation. |
| **S3 Storage & Hosting** | Standard S3 Bucket with Static Website Hosting | **5 GB storage**, 20,000 GETs, 2,000 PUTs | Static React build is ~2 MB; negligible request count for demo. |
| **Security Groups** | 2 security groups (`seedbank-ec2-sg`, `seedbank-rds-sg`) | Always **Free ($0)** | Virtual stateful firewalls incur no charge. |
| **Parameter Group** | Custom MySQL 8.0 parameter group | Always **Free ($0)** | Configuration templates carry no charge. |
| **Billing Alarm** | 1 CloudWatch alarm on `EstimatedCharges` ($1.00) | **10 free metric alarms** | 1 alarm uses 10% of the free allocation. |

> [!IMPORTANT]
> **Zero Cost Architecture**: No Application Load Balancers (ALB), NAT Gateways, Elastic Container Service (ECS), Kubernetes, Multi-AZ RDS, or unattached Elastic IPs are used.

---

## 2. Prerequisites

Before running the deployment scripts, ensure your machine has:
1. **AWS CLI v2** installed and configured:
   ```bash
   aws configure
   ```
   Provide:
   - AWS Access Key ID & Secret Access Key (from an IAM User with EC2, RDS, and S3 permissions)
   - Default region name: `us-east-1`
   - Default output format: `json`
2. **Utilities**: `jq`, `openssl`, `curl`, and `tar` installed:
   ```bash
   sudo apt-get install -y jq openssl curl   # Ubuntu/Debian
   # OR brew install jq openssl              # macOS
   ```
3. **Node.js**: v18+ or v20+ with `npm` (for building the React frontend locally).

---

## 3. Order of Execution

All scripts are located in the `deploy/` directory and must be run from the repository root.

### Step 1: Provision Infrastructure
Run the idempotent provisioning script:
```bash
./deploy/deploy.sh
```
What this does:
- Discovers your Default VPC and subnets.
- Detects your current public IP to restrict SSH access (`port 22`) to your machine only.
- Creates `seedbank-ec2-sg` (SSH from your IP, port 3001 open for API) and `seedbank-rds-sg` (port 3306 open **only** to `seedbank-ec2-sg`).
- Generates a secure `seedadmin` DB password and a 48-character `JWT_SECRET` (stored in git-ignored `.env.deploy`).
- Creates a custom MySQL parameter group with `event_scheduler=ON` and `log_bin_trust_function_creators=1`.
- Launches a Single-AZ RDS MySQL instance (`db.t3.micro`, 20 GB).
- Launches an Ubuntu 24.04 EC2 instance (`t2.micro`, 20 GB) with user-data bootstrapping Node.js 20 and PM2.
- Creates an S3 bucket configured for static website hosting with deep-link error routing (`index.html`).
- Generates `seedbank-key.pem` for secure SSH access.
- Outputs `.env.deploy` containing all endpoint metadata.

---

### Step 2: Setup Backend & Import Database Schema
Run the EC2 configuration script:
```bash
./deploy/ec2-setup.sh
```
What this does:
- Waits for the RDS database instance to become `available` and resolves its private endpoint.
- Connects to EC2 via SSH and transfers the backend application and `backend/db/schema.sql`.
- Generates the backend `.env` file with the RDS connection string, JWT secret, and CORS setting.
- Waits for RDS MySQL port 3306 to accept connections.
- Imports `backend/db/schema.sql` (8 tables, triggers, views, events, and initial seed data).
- Seeds the initial administrator account:
  - **Email**: `admin@example.com`
  - **Password**: `Password123`
- Starts the Express API using PM2 on port 3001 and enables autostart on reboot.
- Tests the `/api/health` endpoint.

---

### Step 3: Build & Deploy Frontend to S3
Run the frontend build and sync script:
```bash
./deploy/frontend-deploy.sh
```
What this does:
- Reads the public EC2 API URL from `.env.deploy`.
- Runs `npm install` and builds the React app with `VITE_API_BASE=http://<EC2-PUBLIC-DNS>:3001/api`.
- Syncs the production build (`frontend/dist/`) to the S3 bucket.
- Configures S3 static website hosting routing so React Router deep links work seamlessly.
- Prints the live S3 website URL.

---

## 4. Verification Checklist

1. **API Health Check**:
   ```bash
   curl -s http://<EC2-PUBLIC-DNS>:3001/api/health | jq .
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "seed-bank-api",
     "port": 3001,
     "timestamp": "..."
   }
   ```

2. **API Login Test**:
   ```bash
   curl -s -X POST http://<EC2-PUBLIC-DNS>:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"Password123"}' | jq .
   ```
   Expected response:
   ```json
   {
     "success": true,
     "data": {
       "token": "eyJhbGciOi..."
     },
     "message": "Logged in"
   }
   ```

3. **Dashboard Summary View Test**:
   ```bash
   TOKEN=$(curl -s -X POST http://<EC2-PUBLIC-DNS>:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"Password123"}' | jq -r '.data.token')

   curl -s http://<EC2-PUBLIC-DNS>:3001/api/dashboard \
     -H "Authorization: Bearer $TOKEN" | jq .
   ```

4. **Frontend Browser Verification**:
   - Open the S3 website URL in your browser: `http://<S3-BUCKET>.s3-website-us-east-1.amazonaws.com`
   - Log in using `admin@example.com` and `Password123`.
   - Verify that stat cards, seed varieties, storage facilities, batches, and reports render properly.

---

## 5. Teardown & Cost Prevention

After your presentation or grading demo, delete all AWS resources with a single command to guarantee no charges:
```bash
./deploy/teardown.sh
```
This cleanly removes:
- EC2 instance (terminates and waits)
- S3 bucket and all objects
- RDS database instance (without creating costly final snapshots)
- RDS DB Subnet Group and Parameter Group
- Security Groups (`seedbank-ec2-sg` and `seedbank-rds-sg`)
- Key pair and local `.pem` and `.env.deploy` files
