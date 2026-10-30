#!/usr/bin/env bash
# =============================================================================
# ec2-setup.sh — Configures Backend, Imports DB Schema, and Starts PM2 on EC2
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DEPLOY="${PROJECT_ROOT}/.env.deploy"

if [ ! -f "${ENV_DEPLOY}" ]; then
  echo "[ERROR] ${ENV_DEPLOY} not found. Please run ./deploy/deploy.sh first." >&2
  exit 1
fi

# Source deployment variables
# shellcheck source=/dev/null
source "${ENV_DEPLOY}"

echo "======================================================================"
echo "  Setting up Backend on EC2 (${EC2_PUBLIC_IP})                        "
echo "======================================================================"

# -----------------------------------------------------------------------------
# 1. Ensure RDS Instance is Available and Endpoint is Resolved
# -----------------------------------------------------------------------------
if [ "${RDS_ENDPOINT}" == "creating" ] || [ -z "${RDS_ENDPOINT}" ]; then
  echo "[*] Waiting for RDS DB Instance (${RDS_INSTANCE_ID}) to become available..."
  aws rds wait db-instance-available --region "${AWS_REGION}" --db-instance-identifier "${RDS_INSTANCE_ID}"
  RDS_ENDPOINT="$(aws rds describe-db-instances --region "${AWS_REGION}" --db-instance-identifier "${RDS_INSTANCE_ID}" --query "DBInstances[0].Endpoint.Address" --output text)"
  echo "[+] RDS DB is ready at: ${RDS_ENDPOINT}"
  
  # Update .env.deploy with resolved RDS endpoint
  sed -i "s|^RDS_ENDPOINT=.*|RDS_ENDPOINT=${RDS_ENDPOINT}|" "${ENV_DEPLOY}"
fi

# -----------------------------------------------------------------------------
# 2. Wait for EC2 SSH Connectivity & Bootstrap
# -----------------------------------------------------------------------------
echo "[*] Waiting for SSH to become ready on ${EC2_PUBLIC_IP}..."
SSH_OPTS=(-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -i "${KEY_FILE}")

MAX_RETRIES=30
RETRY_COUNT=0
until ssh "${SSH_OPTS[@]}" ubuntu@"${EC2_PUBLIC_IP}" "echo 'SSH is ready'" >/dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "${RETRY_COUNT}" -ge "${MAX_RETRIES}" ]; then
    echo "[ERROR] Timed out waiting for SSH connection to EC2." >&2
    exit 1
  fi
  sleep 10
done
echo "[+] SSH connection established."

echo "[*] Waiting for EC2 user-data bootstrap (Node.js & PM2 installation) to finish..."
ssh "${SSH_OPTS[@]}" ubuntu@"${EC2_PUBLIC_IP}" '
  while [ ! -f /tmp/bootstrap-complete.txt ]; do
    sleep 5
  done
  echo "Bootstrap verified."
'
echo "[+] EC2 bootstrap complete."

# -----------------------------------------------------------------------------
# 3. Transfer Backend Files to EC2
# -----------------------------------------------------------------------------
echo "[*] Packaging and transferring backend files to EC2..."
ssh "${SSH_OPTS[@]}" ubuntu@"${EC2_PUBLIC_IP}" "mkdir -p /home/ubuntu/seed-bank/backend"

# Archive backend (excluding node_modules and .env) and transfer
tar -czf /tmp/backend-bundle.tar.gz -C "${PROJECT_ROOT}" \
  --exclude="backend/node_modules" \
  --exclude="backend/.env" \
  backend

scp "${SSH_OPTS[@]}" /tmp/backend-bundle.tar.gz ubuntu@"${EC2_PUBLIC_IP}":/tmp/backend-bundle.tar.gz
rm -f /tmp/backend-bundle.tar.gz

ssh "${SSH_OPTS[@]}" ubuntu@"${EC2_PUBLIC_IP}" '
  tar -xzf /tmp/backend-bundle.tar.gz -C /home/ubuntu/seed-bank/
  rm -f /tmp/backend-bundle.tar.gz
'
echo "[+] Backend files transferred."

# -----------------------------------------------------------------------------
# 4. Configure Backend .env, Install Dependencies, & Import Schema into RDS
# -----------------------------------------------------------------------------
echo "[*] Configuring backend environment and importing database schema..."

ssh "${SSH_OPTS[@]}" ubuntu@"${EC2_PUBLIC_IP}" bash -s <<REMOTE_SCRIPT
set -euo pipefail
cd /home/ubuntu/seed-bank/backend

# Create production .env
cat <<EOF > .env
PORT=3001
DB_HOST=${RDS_ENDPOINT}
DB_USER=${DB_USER}
DB_PASS=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
FRONTEND_URL=${S3_WEBSITE_URL}
NODE_ENV=production
EOF

echo "[+] Backend .env created."

# Install npm dependencies
echo "[*] Installing backend npm packages..."
npm install --production

# Wait for RDS MySQL port 3306 to be reachable from EC2
echo "[*] Testing RDS MySQL connectivity from EC2..."
RETRIES=0
until mysqladmin ping -h "${RDS_ENDPOINT}" -u "${DB_USER}" -p"${DB_PASSWORD}" --silent 2>/dev/null; do
  RETRIES=\$((RETRIES + 1))
  if [ "\${RETRIES}" -ge 30 ]; then
    echo "[ERROR] Timed out waiting for RDS MySQL to accept connections." >&2
    exit 1
  fi
  echo "  Waiting for RDS port 3306... (\$RETRIES/30)"
  sleep 10
done
echo "[+] RDS MySQL is accepting connections."

# Import schema
echo "[*] Importing schema.sql (tables, triggers, events, views, and seed data)..."
mysql -h "${RDS_ENDPOINT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < db/schema.sql
echo "[+] Schema successfully imported into RDS."

# Start or restart backend with PM2
echo "[*] Starting Express API with PM2 on port 3001..."
pm2 delete seed-bank-api 2>/dev/null || true
pm2 start server.js --name "seed-bank-api"
pm2 save

# Wait for API to respond
sleep 3
echo "[*] Verifying API health check..."
curl -s http://localhost:3001/api/health | jq .

# Register default admin user if not already present
echo "[*] Seeding default administrator account..."
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Administrator","email":"admin@example.com","password":"Password123","role":"admin"}' || true
echo ""
echo "[+] Backend setup completed successfully!"
REMOTE_SCRIPT

# -----------------------------------------------------------------------------
# 5. Remote Verification from Deployer
# -----------------------------------------------------------------------------
echo ""
echo "[*] Verifying public API endpoint: http://${EC2_PUBLIC_DNS}:3001/api/health..."
sleep 2
HEALTH_RES="$(curl -s --connect-timeout 10 "http://${EC2_PUBLIC_DNS}:3001/api/health" || echo "")"
if [ -n "${HEALTH_RES}" ]; then
  echo "[+] Health check response: ${HEALTH_RES}"
else
  echo "[!] Note: Public check timed out (check security group or IP allowlist). Local check on EC2 passed."
fi

echo ""
echo "======================================================================"
echo "  Backend Setup Completed!                                            "
echo "  API Base URL: http://${EC2_PUBLIC_DNS}:3001/api                     "
echo "======================================================================"
