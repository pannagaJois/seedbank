#!/usr/bin/env bash
# Simple script to create an admin user via the backend register endpoint.
# Usage: run this after importing users_table.sql and starting the backend server.

EMAIL="admin@example.com"
PASSWORD="Password123"
NAME="Administrator"

curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"name\":\"${NAME}\"}" \
  | jq .

echo "If user already exists, you'll get a duplicate key error from MySQL."
