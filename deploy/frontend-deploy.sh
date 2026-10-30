#!/usr/bin/env bash
# =============================================================================
# frontend-deploy.sh — Builds React App & Deploys to S3 Static Website Hosting
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_DEPLOY="${PROJECT_ROOT}/.env.deploy"

if [ ! -f "${ENV_DEPLOY}" ]; then
  echo "[ERROR] ${ENV_DEPLOY} not found. Please run ./deploy/deploy.sh first." >&2
  exit 1
fi

# shellcheck source=/dev/null
source "${ENV_DEPLOY}"

echo "======================================================================"
echo "  Deploying Frontend to AWS S3 Static Website Hosting                 "
echo "======================================================================"
echo "[*] S3 Bucket   : ${S3_BUCKET}"
echo "[*] API Base URL: ${API_BASE_URL}"
echo "[*] Website URL : ${S3_WEBSITE_URL}"

# -----------------------------------------------------------------------------
# 1. Build React / Vite Application
# -----------------------------------------------------------------------------
cd "${PROJECT_ROOT}/frontend"

if [ ! -d "node_modules" ]; then
  echo "[*] Installing frontend dependencies..."
  npm install
fi

echo "[*] Building frontend with VITE_API_BASE=${API_BASE_URL}..."
VITE_API_BASE="${API_BASE_URL}" npm run build

if [ ! -d "dist" ]; then
  echo "[ERROR] Frontend build failed; dist/ directory not found." >&2
  exit 1
fi
echo "[+] Build completed successfully."

# -----------------------------------------------------------------------------
# 2. Sync to S3
# -----------------------------------------------------------------------------
echo "[*] Syncing dist/ assets to s3://${S3_BUCKET}/..."
aws s3 sync dist/ "s3://${S3_BUCKET}/" --delete

# Ensure website configuration routes 404s to index.html for React Router
echo "[*] Ensuring S3 static website routing (index.html as ErrorDocument for SPA)..."
aws s3api put-bucket-website \
  --bucket "${S3_BUCKET}" \
  --website-configuration "IndexDocument={Suffix=index.html},ErrorDocument={Key=index.html}"

echo ""
echo "======================================================================"
echo "  Frontend Deployment Complete!                                       "
echo "  Live Website URL : ${S3_WEBSITE_URL}                                "
echo "  API Backend URL  : ${API_BASE_URL}                                  "
echo "======================================================================"
