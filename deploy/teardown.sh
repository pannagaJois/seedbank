#!/usr/bin/env bash
# =============================================================================
# teardown.sh — Completely Deletes All AWS Resources Created for Seed Bank
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DEPLOY="${PROJECT_ROOT}/.env.deploy"

echo "======================================================================"
echo "  Seed Bank AWS Resources Teardown & Cleanup                          "
echo "======================================================================"

if [ -f "${ENV_DEPLOY}" ]; then
  # shellcheck source=/dev/null
  source "${ENV_DEPLOY}"
fi

REGION="${AWS_REGION:-$(aws configure get region || echo "us-east-1")}"
[ -z "${REGION}" ] && REGION="us-east-1"
echo "[*] Working in Region: ${REGION}"

# -----------------------------------------------------------------------------
# 1. Terminate EC2 Instance
# -----------------------------------------------------------------------------
EC2_ID="${EC2_INSTANCE_ID:-$(aws ec2 describe-instances --region "${REGION}" --filters "Name=tag:Name,Values=seedbank-ec2-backend" "Name=instance-state-name,Values=running,pending,stopped" --query "Reservations[0].Instances[0].InstanceId" --output text 2>/dev/null || echo "None")}"

if [ "${EC2_ID}" != "None" ] && [ -n "${EC2_ID}" ]; then
  echo "[*] Terminating EC2 instance: ${EC2_ID}..."
  aws ec2 terminate-instances --region "${REGION}" --instance-ids "${EC2_ID}" >/dev/null
  echo "[*] Waiting for EC2 instance termination..."
  aws ec2 wait instance-terminated --region "${REGION}" --instance-ids "${EC2_ID}"
  echo "[+] EC2 instance terminated."
else
  echo "[+] No active EC2 instance found."
fi

# -----------------------------------------------------------------------------
# 2. Delete S3 Bucket and Contents
# -----------------------------------------------------------------------------
ACCOUNT_ID="$(aws sts get-caller-identity --query "Account" --output text 2>/dev/null || echo "")"
BUCKET="${S3_BUCKET:-seedbank-frontend-${ACCOUNT_ID}-${REGION}}"

if aws s3api head-bucket --bucket "${BUCKET}" 2>/dev/null; then
  echo "[*] Deleting all objects in S3 bucket: ${BUCKET}..."
  aws s3 rm "s3://${BUCKET}" --recursive --region "${REGION}" >/dev/null 2>&1 || true
  
  echo "[*] Deleting S3 bucket: ${BUCKET}..."
  aws s3api delete-bucket --bucket "${BUCKET}" --region "${REGION}"
  echo "[+] S3 bucket deleted."
else
  echo "[+] S3 bucket not found or already deleted."
fi

# -----------------------------------------------------------------------------
# 3. Delete RDS DB Instance
# -----------------------------------------------------------------------------
DB_ID="${RDS_INSTANCE_ID:-seedbank-db}"
DB_STATUS="$(aws rds describe-db-instances --region "${REGION}" --db-instance-identifier "${DB_ID}" --query "DBInstances[0].DBInstanceStatus" --output text 2>/dev/null || echo "not-found")"

if [ "${DB_STATUS}" != "not-found" ] && [ -n "${DB_STATUS}" ]; then
  echo "[*] Deleting RDS DB instance: ${DB_ID} (skipping final snapshot)..."
  aws rds delete-db-instance --region "${REGION}" \
    --db-instance-identifier "${DB_ID}" \
    --skip-final-snapshot \
    --delete-automated-backups >/dev/null
  
  echo "[*] Waiting for RDS DB instance deletion to complete (this can take ~3-5 mins)..."
  aws rds wait db-instance-deleted --region "${REGION}" --db-instance-identifier "${DB_ID}"
  echo "[+] RDS DB instance deleted."
else
  echo "[+] RDS DB instance not found or already deleted."
fi

# -----------------------------------------------------------------------------
# 4. Delete RDS DB Subnet Group & Parameter Group
# -----------------------------------------------------------------------------
SUBNET_GRP="seedbank-dbsubnet-group"
if aws rds describe-db-subnet-groups --region "${REGION}" --db-subnet-group-name "${SUBNET_GRP}" >/dev/null 2>&1; then
  echo "[*] Deleting DB Subnet Group: ${SUBNET_GRP}..."
  aws rds delete-db-subnet-group --region "${REGION}" --db-subnet-group-name "${SUBNET_GRP}" >/dev/null || true
  echo "[+] DB Subnet Group deleted."
fi

PARAM_GRP="seedbank-mysql8-params"
if aws rds describe-db-parameter-groups --region "${REGION}" --db-parameter-group-name "${PARAM_GRP}" >/dev/null 2>&1; then
  echo "[*] Deleting DB Parameter Group: ${PARAM_GRP}..."
  aws rds delete-db-parameter-group --region "${REGION}" --db-parameter-group-name "${PARAM_GRP}" >/dev/null || true
  echo "[+] DB Parameter Group deleted."
fi

# -----------------------------------------------------------------------------
# 5. Delete Security Groups
# -----------------------------------------------------------------------------
echo "[*] Deleting Security Groups..."
sleep 5 # Allow ENIs to release

# RDS Security Group
RDS_SG="${RDS_SG_ID:-$(aws ec2 describe-security-groups --region "${REGION}" --filters "Name=group-name,Values=seedbank-rds-sg" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "None")}"
if [ "${RDS_SG}" != "None" ] && [ -n "${RDS_SG}" ]; then
  aws ec2 delete-security-group --region "${REGION}" --group-id "${RDS_SG}" >/dev/null 2>&1 || true
  echo "[+] Deleted RDS Security Group (${RDS_SG})."
fi

# EC2 Security Group
EC2_SG="${EC2_SG_ID:-$(aws ec2 describe-security-groups --region "${REGION}" --filters "Name=group-name,Values=seedbank-ec2-sg" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "None")}"
if [ "${EC2_SG}" != "None" ] && [ -n "${EC2_SG}" ]; then
  aws ec2 delete-security-group --region "${REGION}" --group-id "${EC2_SG}" >/dev/null 2>&1 || true
  echo "[+] Deleted EC2 Security Group (${EC2_SG})."
fi

# -----------------------------------------------------------------------------
# 6. Delete Key Pair and Local Files
# -----------------------------------------------------------------------------
KEY="seedbank-key"
if aws ec2 describe-key-pairs --region "${REGION}" --key-names "${KEY}" >/dev/null 2>&1; then
  echo "[*] Deleting EC2 Key Pair: ${KEY}..."
  aws ec2 delete-key-pair --region "${REGION}" --key-name "${KEY}" >/dev/null
  echo "[+] EC2 Key Pair deleted."
fi

if [ -f "${PROJECT_ROOT}/seedbank-key.pem" ]; then
  rm -f "${PROJECT_ROOT}/seedbank-key.pem"
  echo "[+] Removed local key file seedbank-key.pem"
fi

if [ -f "${ENV_DEPLOY}" ]; then
  rm -f "${ENV_DEPLOY}"
  echo "[+] Removed deployment metadata .env.deploy"
fi

echo ""
echo "======================================================================"
echo "  Teardown Complete! All AWS Resources Have Been Deleted.             "
echo "  Zero ongoing costs remain on your AWS account.                      "
echo "======================================================================"
