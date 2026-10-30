#!/usr/bin/env bash
# =============================================================================
# deploy.sh — AWS Free-Tier Infrastructure Provisioning for Seed Bank MVP
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DEPLOY="${PROJECT_ROOT}/.env.deploy"

echo "======================================================================"
echo "  Seed Bank AWS Infrastructure Deployment (Free Tier Eligible)        "
echo "======================================================================"

# -----------------------------------------------------------------------------
# 1. Environment & Prerequisites Verification
# -----------------------------------------------------------------------------
command -v aws >/dev/null 2>&1 || { echo "[ERROR] aws CLI is not installed. Aborting." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "[ERROR] jq is not installed. Aborting." >&2; exit 1; }
command -v openssl >/dev/null 2>&1 || { echo "[ERROR] openssl is not installed. Aborting." >&2; exit 1; }

REGION="${AWS_DEFAULT_REGION:-$(aws configure get region || echo "us-east-1")}"
[ -z "${REGION}" ] && REGION="us-east-1"
echo "[*] Using AWS Region: ${REGION}"

ACCOUNT_ID="$(aws sts get-caller-identity --query "Account" --output text)"
echo "[*] AWS Account ID: ${ACCOUNT_ID}"

# Detect current deployer public IP for SSH allowlisting
MY_IP="$(curl -s https://checkip.amazonaws.com || curl -s https://ifconfig.me || echo "")"
if [ -z "${MY_IP}" ]; then
  echo "[!] Warning: Could not detect public IP. Falling back to 0.0.0.0/0 for SSH."
  SSH_CIDR="0.0.0.0/0"
else
  SSH_CIDR="${MY_IP}/32"
fi
echo "[*] Deployer IP for SSH: ${SSH_CIDR}"

# -----------------------------------------------------------------------------
# 2. VPC & Subnet Discovery (Default VPC)
# -----------------------------------------------------------------------------
echo "[*] Discovering default VPC and subnets..."
VPC_ID="$(aws ec2 describe-vpcs --region "${REGION}" --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text)"
if [ "${VPC_ID}" == "None" ] || [ -z "${VPC_ID}" ]; then
  echo "[!] Default VPC not found. Querying first available VPC..."
  VPC_ID="$(aws ec2 describe-vpcs --region "${REGION}" --query "Vpcs[0].VpcId" --output text)"
fi
echo "[+] Using VPC: ${VPC_ID}"

# Discover subnets across distinct Availability Zones for RDS DB Subnet Group
SUBNET_IDS=($(aws ec2 describe-subnets --region "${REGION}" --filters "Name=vpc-id,Values=${VPC_ID}" --query "Subnets[*].[SubnetId,AvailabilityZone]" --output text | sort -k2 -u | awk '{print $1}'))
if [ "${#SUBNET_IDS[@]}" -lt 2 ]; then
  echo "[ERROR] RDS requires subnets in at least 2 distinct Availability Zones in VPC ${VPC_ID}." >&2
  exit 1
fi
echo "[+] Discovered subnets for RDS: ${SUBNET_IDS[*]}"

# -----------------------------------------------------------------------------
# 3. Security Groups (EC2 & RDS)
# -----------------------------------------------------------------------------
EC2_SG_NAME="seedbank-ec2-sg"
RDS_SG_NAME="seedbank-rds-sg"

echo "[*] Configuring EC2 Security Group (${EC2_SG_NAME})..."
EC2_SG_ID="$(aws ec2 describe-security-groups --region "${REGION}" --filters "Name=group-name,Values=${EC2_SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "None")"
if [ "${EC2_SG_ID}" == "None" ] || [ -z "${EC2_SG_ID}" ]; then
  EC2_SG_ID="$(aws ec2 create-security-group --region "${REGION}" --group-name "${EC2_SG_NAME}" --description "Security group for Seed Bank EC2 backend" --vpc-id "${VPC_ID}" --query "GroupId" --output text)"
  echo "[+] Created EC2 Security Group: ${EC2_SG_ID}"
  
  # Allow SSH from deployer IP only
  aws ec2 authorize-security-group-ingress --region "${REGION}" --group-id "${EC2_SG_ID}" --protocol tcp --port 22 --cidr "${SSH_CIDR}"
  # Allow Node API port 3001 from everywhere
  aws ec2 authorize-security-group-ingress --region "${REGION}" --group-id "${EC2_SG_ID}" --protocol tcp --port 3001 --cidr "0.0.0.0/0"
  echo "[+] Configured ingress rules on EC2 Security Group"
else
  echo "[+] Using existing EC2 Security Group: ${EC2_SG_ID}"
fi

echo "[*] Configuring RDS Security Group (${RDS_SG_NAME})..."
RDS_SG_ID="$(aws ec2 describe-security-groups --region "${REGION}" --filters "Name=group-name,Values=${RDS_SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "None")"
if [ "${RDS_SG_ID}" == "None" ] || [ -z "${RDS_SG_ID}" ]; then
  RDS_SG_ID="$(aws ec2 create-security-group --region "${REGION}" --group-name "${RDS_SG_NAME}" --description "Security group for Seed Bank RDS MySQL" --vpc-id "${VPC_ID}" --query "GroupId" --output text)"
  echo "[+] Created RDS Security Group: ${RDS_SG_ID}"
  
  # Allow MySQL (3306) ONLY from EC2 Security Group
  aws ec2 authorize-security-group-ingress --region "${REGION}" --group-id "${RDS_SG_ID}" --protocol tcp --port 3306 --source-group "${EC2_SG_ID}"
  echo "[+] Configured ingress rule: port 3306 allowed only from ${EC2_SG_ID}"
else
  echo "[+] Using existing RDS Security Group: ${RDS_SG_ID}"
fi

# -----------------------------------------------------------------------------
# 4. Generate Secrets
# -----------------------------------------------------------------------------
# Load existing secrets if present, otherwise generate new random secrets
if [ -f "${ENV_DEPLOY}" ]; then
  echo "[*] Loading existing secrets from ${ENV_DEPLOY}..."
  DB_PASSWORD="$(grep "^DB_PASSWORD=" "${ENV_DEPLOY}" | cut -d'=' -f2- || echo "")"
  JWT_SECRET="$(grep "^JWT_SECRET=" "${ENV_DEPLOY}" | cut -d'=' -f2- || echo "")"
fi

if [ -z "${DB_PASSWORD:-}" ]; then
  DB_PASSWORD="DbPass$(openssl rand -hex 8)!"
fi
if [ -z "${JWT_SECRET:-}" ]; then
  JWT_SECRET="$(openssl rand -hex 24)"
fi
DB_USER="seedadmin"
DB_NAME="seed_bank"

# -----------------------------------------------------------------------------
# 5. RDS MySQL Setup (Custom Parameter Group + Subnet Group + Instance)
# -----------------------------------------------------------------------------
PARAM_GROUP_NAME="seedbank-mysql8-params"
echo "[*] Checking RDS Parameter Group (${PARAM_GROUP_NAME})..."
if ! aws rds describe-db-parameter-groups --region "${REGION}" --db-parameter-group-name "${PARAM_GROUP_NAME}" >/dev/null 2>&1; then
  echo "[+] Creating custom DB parameter group for MySQL 8.0..."
  aws rds create-db-parameter-group \
    --region "${REGION}" \
    --db-parameter-group-name "${PARAM_GROUP_NAME}" \
    --db-parameter-group-family "mysql8.0" \
    --description "Seed Bank MySQL 8.0 parameters: event_scheduler and triggers"
  
  # Modify parameters: event_scheduler=ON, log_bin_trust_function_creators=1
  aws rds modify-db-parameter-group \
    --region "${REGION}" \
    --db-parameter-group-name "${PARAM_GROUP_NAME}" \
    --parameters \
      "ParameterName=event_scheduler,ParameterValue=ON,ApplyMethod=immediate" \
      "ParameterName=log_bin_trust_function_creators,ParameterValue=1,ApplyMethod=immediate"
  echo "[+] Custom parameter group created and configured."
else
  echo "[+] Using existing parameter group: ${PARAM_GROUP_NAME}"
fi

DB_SUBNET_GROUP="seedbank-dbsubnet-group"
echo "[*] Checking RDS DB Subnet Group (${DB_SUBNET_GROUP})..."
if ! aws rds describe-db-subnet-groups --region "${REGION}" --db-subnet-group-name "${DB_SUBNET_GROUP}" >/dev/null 2>&1; then
  echo "[+] Creating DB Subnet Group across subnets: ${SUBNET_IDS[*]}"
  aws rds create-db-subnet-group \
    --region "${REGION}" \
    --db-subnet-group-name "${DB_SUBNET_GROUP}" \
    --db-subnet-group-description "Subnet group for Seed Bank RDS" \
    --subnet-ids "${SUBNET_IDS[@]}"
  echo "[+] DB Subnet Group created."
else
  echo "[+] Using existing DB Subnet Group: ${DB_SUBNET_GROUP}"
fi

DB_INSTANCE_ID="seedbank-db"
echo "[*] Checking RDS DB Instance (${DB_INSTANCE_ID})..."
DB_STATUS="$(aws rds describe-db-instances --region "${REGION}" --db-instance-identifier "${DB_INSTANCE_ID}" --query "DBInstances[0].DBInstanceStatus" --output text 2>/dev/null || echo "not-found")"

if [ "${DB_STATUS}" == "not-found" ]; then
  MYSQL_ENGINE_VER="$(aws rds describe-db-engine-versions --region "${REGION}" --engine mysql \
    --query "reverse(sort_by(DBEngineVersions[?starts_with(EngineVersion, '8.0')], &EngineVersion))[0].EngineVersion" --output text 2>/dev/null || echo "8.0")"
  [ -z "${MYSQL_ENGINE_VER}" ] && MYSQL_ENGINE_VER="8.0"
  echo "[+] Provisioning RDS MySQL instance (${MYSQL_ENGINE_VER}, Free Tier db.t3.micro, 20GB gp2, Single-AZ)..."
  aws rds create-db-instance \
    --region "${REGION}" \
    --db-instance-identifier "${DB_INSTANCE_ID}" \
    --db-instance-class "db.t3.micro" \
    --engine "mysql" \
    --engine-version "${MYSQL_ENGINE_VER}" \
    --allocated-storage 20 \
    --storage-type "gp2" \
    --master-username "${DB_USER}" \
    --master-user-password "${DB_PASSWORD}" \
    --db-name "${DB_NAME}" \
    --vpc-security-group-ids "${RDS_SG_ID}" \
    --db-subnet-group-name "${DB_SUBNET_GROUP}" \
    --db-parameter-group-name "${PARAM_GROUP_NAME}" \
    --backup-retention-period 1 \
    --no-multi-az \
    --no-publicly-accessible \
    --auto-minor-version-upgrade
  echo "[+] RDS creation initiated. This takes ~5-8 minutes."
else
  echo "[+] RDS DB instance exists (status: ${DB_STATUS})"
fi

# -----------------------------------------------------------------------------
# 6. EC2 Setup (SSH Key + Ubuntu 24.04 AMI + Instance)
# -----------------------------------------------------------------------------
KEY_NAME="seedbank-key"
KEY_FILE="${PROJECT_ROOT}/${KEY_NAME}.pem"

if ! aws ec2 describe-key-pairs --region "${REGION}" --key-names "${KEY_NAME}" >/dev/null 2>&1; then
  echo "[+] Creating EC2 Key Pair: ${KEY_NAME}..."
  aws ec2 create-key-pair --region "${REGION}" --key-name "${KEY_NAME}" --query "KeyMaterial" --output text > "${KEY_FILE}"
  chmod 400 "${KEY_FILE}"
  echo "[+] Key pair saved to: ${KEY_FILE}"
else
  echo "[+] Using existing key pair: ${KEY_NAME}"
fi

# Resolve latest Ubuntu 24.04 LTS (Noble) AMI
echo "[*] Resolving Ubuntu 24.04 LTS AMI..."
UBUNTU_AMI="$(aws ssm get-parameter --region "${REGION}" --name "/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id" --query "Parameter.Value" --output text 2>/dev/null || echo "")"
if [ -z "${UBUNTU_AMI}" ]; then
  UBUNTU_AMI="$(aws ec2 describe-images --region "${REGION}" --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" "Name=state,Values=available" \
    --query "reverse(sort_by(Images, &CreationDate))[0].ImageId" --output text)"
fi
echo "[+] Ubuntu 24.04 AMI: ${UBUNTU_AMI}"

# Prepare User-Data script for Node 20 + pm2 + mysql client
USER_DATA_FILE="$(mktemp)"
cat <<'EOF' > "${USER_DATA_FILE}"
#!/usr/bin/env bash
set -e
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y curl ca-certificates gnupg git default-mysql-client || apt-get install -y mysql-client mariadb-client

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pm2 globally
npm install -g pm2

# Enable pm2 systemd startup for ubuntu user
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

echo "EC2 bootstrap complete" > /tmp/bootstrap-complete.txt
EOF

EC2_INSTANCE_NAME="seedbank-ec2-backend"
echo "[*] Checking EC2 Instance (${EC2_INSTANCE_NAME})..."
EC2_INSTANCE_ID="$(aws ec2 describe-instances --region "${REGION}" \
  --filters "Name=tag:Name,Values=${EC2_INSTANCE_NAME}" "Name=instance-state-name,Values=running,pending" \
  --query "Reservations[0].Instances[0].InstanceId" --output text 2>/dev/null || echo "None")"

if [ "${EC2_INSTANCE_ID}" == "None" ] || [ -z "${EC2_INSTANCE_ID}" ]; then
  echo "[+] Launching t2.micro EC2 instance (Ubuntu 24.04, Free Tier)..."
  # Select first subnet with auto-assign public IP or default subnet
  EC2_SUBNET="${SUBNET_IDS[0]}"
  
  EC2_INSTANCE_ID="$(aws ec2 run-instances \
    --region "${REGION}" \
    --image-id "${UBUNTU_AMI}" \
    --instance-type "t2.micro" \
    --key-name "${KEY_NAME}" \
    --security-group-ids "${EC2_SG_ID}" \
    --subnet-id "${EC2_SUBNET}" \
    --associate-public-ip-address \
    --block-device-mappings "[{\"DeviceName\":\"/dev/sda1\",\"Ebs\":{\"VolumeSize\":20,\"VolumeType\":\"gp3\",\"DeleteOnTermination\":true}}]" \
    --user-data "file://${USER_DATA_FILE}" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${EC2_INSTANCE_NAME}}]" \
    --query "Instances[0].InstanceId" --output text)"
  echo "[+] Launched EC2 instance: ${EC2_INSTANCE_ID}"
else
  echo "[+] Using existing EC2 instance: ${EC2_INSTANCE_ID}"
fi
rm -f "${USER_DATA_FILE}"

# -----------------------------------------------------------------------------
# 7. S3 Static Website Bucket
# -----------------------------------------------------------------------------
BUCKET_NAME="seedbank-frontend-${ACCOUNT_ID}-${REGION}"
echo "[*] Configuring S3 Static Website Bucket (${BUCKET_NAME})..."

if ! aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
  echo "[+] Creating S3 bucket: ${BUCKET_NAME}..."
  if [ "${REGION}" == "us-east-1" ]; then
    aws s3api create-bucket --bucket "${BUCKET_NAME}" --region "${REGION}"
  else
    aws s3api create-bucket --bucket "${BUCKET_NAME}" --region "${REGION}" \
      --create-bucket-configuration LocationConstraint="${REGION}"
  fi
  echo "[+] Bucket created."
else
  echo "[+] Bucket already exists."
fi

# Disable Block Public Access for static website hosting
echo "[+] Disabling Public Access Block on bucket for website hosting..."
aws s3api put-public-access-block \
  --bucket "${BUCKET_NAME}" \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Configure static website hosting (index and error both set to index.html for React Router deep linking)
aws s3api put-bucket-website \
  --bucket "${BUCKET_NAME}" \
  --website-configuration "IndexDocument={Suffix=index.html},ErrorDocument={Key=index.html}"

# Attach Public-Read Bucket Policy
cat <<EOF > /tmp/s3-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObjectForWebsite",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF
aws s3api put-bucket-policy --bucket "${BUCKET_NAME}" --policy file:///tmp/s3-policy.json
rm -f /tmp/s3-policy.json
echo "[+] S3 static website hosting configured."

if [ "${REGION}" == "us-east-1" ]; then
  S3_WEBSITE_URL="http://${BUCKET_NAME}.s3-website-us-east-1.amazonaws.com"
else
  S3_WEBSITE_URL="http://${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com"
fi

# -----------------------------------------------------------------------------
# 8. Wait for EC2 & RDS Details & Write .env.deploy
# -----------------------------------------------------------------------------
echo "[*] Waiting for EC2 instance public IP and DNS..."
aws ec2 wait instance-running --region "${REGION}" --instance-ids "${EC2_INSTANCE_ID}"
EC2_PUBLIC_IP="$(aws ec2 describe-instances --region "${REGION}" --instance-ids "${EC2_INSTANCE_ID}" --query "Reservations[0].Instances[0].PublicIpAddress" --output text)"
EC2_PUBLIC_DNS="$(aws ec2 describe-instances --region "${REGION}" --instance-ids "${EC2_INSTANCE_ID}" --query "Reservations[0].Instances[0].PublicDnsName" --output text)"
[ -z "${EC2_PUBLIC_DNS}" ] && EC2_PUBLIC_DNS="${EC2_PUBLIC_IP}"

echo "[*] Checking RDS endpoint status..."
RDS_ENDPOINT="$(aws rds describe-db-instances --region "${REGION}" --db-instance-identifier "${DB_INSTANCE_ID}" --query "DBInstances[0].Endpoint.Address" --output text 2>/dev/null || echo "creating")"

# Write deployment metadata
cat <<EOF > "${ENV_DEPLOY}"
# Seed Bank Deployment Environment (Auto-generated)
AWS_REGION=${REGION}
AWS_ACCOUNT_ID=${ACCOUNT_ID}
VPC_ID=${VPC_ID}
EC2_SG_ID=${EC2_SG_ID}
RDS_SG_ID=${RDS_SG_ID}
EC2_INSTANCE_ID=${EC2_INSTANCE_ID}
EC2_PUBLIC_IP=${EC2_PUBLIC_IP}
EC2_PUBLIC_DNS=${EC2_PUBLIC_DNS}
KEY_NAME=${KEY_NAME}
KEY_FILE=${KEY_FILE}
RDS_INSTANCE_ID=${DB_INSTANCE_ID}
RDS_ENDPOINT=${RDS_ENDPOINT}
RDS_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
S3_BUCKET=${BUCKET_NAME}
S3_WEBSITE_URL=${S3_WEBSITE_URL}
API_BASE_URL=http://${EC2_PUBLIC_DNS}:3001/api
EOF
chmod 600 "${ENV_DEPLOY}"
echo "[+] Saved deployment configuration to: ${ENV_DEPLOY}"

# -----------------------------------------------------------------------------
# 9. Summary & Next Steps
# -----------------------------------------------------------------------------
echo ""
echo "======================================================================"
echo "  Infrastructure Provisioning Complete!                               "
echo "======================================================================"
echo "  EC2 Instance ID : ${EC2_INSTANCE_ID}"
echo "  EC2 Public IP   : ${EC2_PUBLIC_IP}"
echo "  EC2 Public DNS  : ${EC2_PUBLIC_DNS}"
echo "  API Base URL    : http://${EC2_PUBLIC_DNS}:3001/api"
echo "  RDS Instance ID : ${DB_INSTANCE_ID}"
echo "  RDS Endpoint    : ${RDS_ENDPOINT} (port 3306)"
echo "  S3 Frontend URL : ${S3_WEBSITE_URL}"
echo "======================================================================"
echo ""
echo "Next steps:"
echo " 1. Run ./deploy/ec2-setup.sh       (configures backend & imports schema into RDS)"
echo " 2. Run ./deploy/frontend-deploy.sh  (builds React app and syncs to S3)"
echo ""
