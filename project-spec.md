# Seed Bank Management System — Project Specification

## Overview
A full-stack web application for managing seed bank operations including
inventory tracking, seed distribution, storage monitoring, viability checks,
and conservation reporting. The system coordinates between farmers, seed
collectors, and agricultural organizations.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Node.js + Express.js (REST API)     |
| Database   | MySQL (see schema.sql)              |
| Frontend   | React (Vite)                        |
| Auth       | JWT (jsonwebtoken) + bcrypt         |
| HTTP Client| Axios                               |
| Styling    | Tailwind CSS                        |
| Charts     | Recharts                            |
| Tables     | TanStack Table (react-table v8)     |
| Forms      | React Hook Form + Zod validation    |
| Toasts     | react-hot-toast                     |

---

## Database
The MySQL schema has 8 normalized tables (3NF):
- `seed_variety` — types of seeds with genetic traits and viability period
- `contributor` — farmers or organizations that donate seeds
- `storage_facility` — physical facilities with condition tracking
- `seed_batch` — individual batches of collected seeds (core inventory unit)
- `recipient` — entities that receive distributed seeds
- `distribution` — records of seed allocation and handoffs
- `viability_check` — periodic lab test results per batch
- `storage_log` — temperature and humidity readings per facility

Key automation:
- Trigger sets `expiry_date` automatically from `viability_days` on batch insert
- Trigger prevents over-distribution (checks `remaining_kg`)
- Trigger decrements `remaining_kg` after each distribution
- Trigger quarantines batch on failed viability check
- Scheduled event auto-expires batches daily
- Views pre-compute inventory, dashboard stats, distribution history

---

## Core Features

### Dashboard
- Summary stat cards: active batches, total remaining stock (kg),
  distributions this month, batches expiring in 30 days (amber alert),
  failed viability checks in 90 days (red alert), anomalies this week
- Recent batches table (last 5 active)
- Recent distributions table (last 5)
- Expiring soon alert list

### Seed Varieties
- List all varieties with crop type and viability period
- Add / Edit / Delete variety
- View per-variety inventory summary (from vw_inventory view)

### Seed Batches
- List all batches with status filter (active / expired / distributed / quarantine)
- Add new batch (select variety, contributor, facility; auto-computes expiry)
- View batch detail: info, remaining stock, distribution history, viability checks
- Change batch status manually (quarantine, etc.)
- Status badges color-coded (see UI spec)

### Distributions
- Log a new distribution (select batch, recipient, quantity, purpose)
- View full distribution history with filters (by variety, recipient, date range)
- Prevent submission if quantity > remaining_kg (frontend + backend validation)

### Viability Checks
- Log a check result per batch (germination rate, moisture, result, action taken)
- View check history per batch
- Failed checks automatically quarantine the batch

### Storage Facilities
- List all facilities with utilization percentage and current conditions
- View facility detail: stored batches, recent storage logs, anomaly flags
- Log a new storage condition reading

### Recipients
- List all recipients
- Add / Edit recipient

### Reports
- Inventory by crop type (bar chart)
- Distribution trends by month (line chart)
- Top recipients by quantity received (bar chart)
- Variety conservation status table (how many active batches per variety)

---

## API
All endpoints are prefixed with `/api`. See `api-routes.md` for full list.
Authentication via JWT Bearer token. Protected routes require
`Authorization: Bearer <token>` header.

---

## Auth
- POST `/api/auth/login` — returns JWT
- POST `/api/auth/register` — admin creates new users
- All `/api/*` routes (except login) are protected middleware

---

## Business Rules
1. A batch's `expiry_date` is always `collection_date + viability_days` (set by trigger).
2. Distribution quantity cannot exceed `remaining_kg` of the batch.
3. A failed viability check automatically sets `batch_status = 'quarantine'`.
4. A batch is auto-marked `distributed` when `remaining_kg` reaches 0.
5. Storage anomaly is flagged when temperature deviates > 5°C or humidity > 10%
   from the average optimal range of batches stored in that facility.
6. Expired batches are marked daily by a MySQL scheduled event.

---

## Environment Variables (backend .env)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=seed_bank
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```
