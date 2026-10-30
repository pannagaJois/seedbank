# API Routes — Seed Bank Management System

Base URL: `http://localhost:5000/api`
All routes except `/auth/*` require `Authorization: Bearer <token>` header.

---

## Auth

| Method | Endpoint             | Description              | Body                              |
|--------|----------------------|--------------------------|-----------------------------------|
| POST   | `/auth/login`        | Login, returns JWT       | `{ email, password }`             |
| POST   | `/auth/register`     | Register new user        | `{ name, email, password, role }` |
| GET    | `/auth/me`           | Get current user info    | —                                 |

---

## Dashboard

| Method | Endpoint              | Description                                      |
|--------|-----------------------|--------------------------------------------------|
| GET    | `/dashboard/summary`  | Returns vw_dashboard_summary (single row object) |
| GET    | `/dashboard/recent-batches`    | Last 5 active batches added          |
| GET    | `/dashboard/recent-distributions` | Last 5 distributions              |
| GET    | `/dashboard/expiring-soon`     | Batches expiring in 30 days          |

---

## Seed Varieties

| Method | Endpoint              | Description                        | Body / Params                  |
|--------|-----------------------|------------------------------------|--------------------------------|
| GET    | `/varieties`          | List all varieties                 | `?crop_type=&search=`          |
| GET    | `/varieties/:id`      | Get single variety with inventory  | —                              |
| POST   | `/varieties`          | Create new variety                 | See fields below               |
| PUT    | `/varieties/:id`      | Update variety                     | Same as POST                   |
| DELETE | `/varieties/:id`      | Delete variety (if no batches)     | —                              |

**POST /varieties body:**
```json
{
  "common_name": "Red Sorghum",
  "scientific_name": "Sorghum bicolor",
  "crop_type": "cereal",
  "origin_region": "Karnataka, India",
  "genetic_traits": "drought-resistant, heirloom",
  "viability_days": 365,
  "optimal_temp_c": 15.0,
  "optimal_humidity_pct": 45.0
}
```

---

## Contributors

| Method | Endpoint              | Description             | Body / Params         |
|--------|-----------------------|-------------------------|-----------------------|
| GET    | `/contributors`       | List all contributors   | `?type=&region=`      |
| GET    | `/contributors/:id`   | Get contributor detail  | —                     |
| POST   | `/contributors`       | Add contributor         | See fields below      |
| PUT    | `/contributors/:id`   | Update contributor      | Same as POST          |
| DELETE | `/contributors/:id`   | Delete contributor      | —                     |

**POST /contributors body:**
```json
{
  "contributor_name": "Ravi Kumar",
  "contributor_type": "farmer",
  "contact_phone": "+91-9876543210",
  "contact_email": "ravi@example.com",
  "address": "Mandya, Karnataka",
  "region": "Karnataka"
}
```

---

## Storage Facilities

| Method | Endpoint                      | Description                           |
|--------|-------------------------------|---------------------------------------|
| GET    | `/facilities`                 | List all facilities (vw_facility_health) |
| GET    | `/facilities/:id`             | Facility detail with batches stored   |
| POST   | `/facilities`                 | Add new facility                      |
| PUT    | `/facilities/:id`             | Update facility info                  |
| GET    | `/facilities/:id/logs`        | Storage logs for a facility           |
| POST   | `/facilities/:id/logs`        | Log a new condition reading           |

**POST /facilities body:**
```json
{
  "facility_name": "Cold Store A",
  "location": "Mysuru, Karnataka",
  "capacity_kg": 5000.00,
  "current_temp_c": 12.5,
  "current_humidity_pct": 40.0,
  "facility_type": "cold_storage"
}
```

**POST /facilities/:id/logs body:**
```json
{
  "temperature_c": 13.2,
  "humidity_pct": 42.5,
  "recorded_by": "Staff Name"
}
```

---

## Seed Batches

| Method | Endpoint                          | Description                              | Params                           |
|--------|-----------------------------------|------------------------------------------|----------------------------------|
| GET    | `/batches`                        | List batches                             | `?status=active&variety_id=&facility_id=&page=&limit=` |
| GET    | `/batches/:id`                    | Full batch detail                        | —                                |
| POST   | `/batches`                        | Create new batch                         | See fields below                 |
| PATCH  | `/batches/:id/status`             | Update batch status                      | `{ "status": "quarantine" }`     |
| DELETE | `/batches/:id`                    | Delete batch (only if no distributions)  | —                                |
| GET    | `/batches/:id/distributions`      | All distributions from this batch        | —                                |
| GET    | `/batches/:id/viability-checks`   | All viability checks for this batch      | —                                |

**POST /batches body:**
```json
{
  "variety_id": 1,
  "contributor_id": 2,
  "facility_id": 1,
  "collection_date": "2024-11-01",
  "quantity_kg": 250.500,
  "germination_rate_pct": 92.50,
  "notes": "Collected post-monsoon harvest"
}
```
> Note: `expiry_date` and `remaining_kg` are set automatically by DB trigger.

---

## Recipients

| Method | Endpoint            | Description           | Body / Params     |
|--------|---------------------|-----------------------|-------------------|
| GET    | `/recipients`       | List all recipients   | `?type=&region=`  |
| GET    | `/recipients/:id`   | Recipient detail      | —                 |
| POST   | `/recipients`       | Add recipient         | See fields below  |
| PUT    | `/recipients/:id`   | Update recipient      | Same as POST      |
| DELETE | `/recipients/:id`   | Delete recipient      | —                 |

**POST /recipients body:**
```json
{
  "recipient_name": "Cauvery Farmers Cooperative",
  "recipient_type": "cooperative",
  "contact_phone": "+91-8765432109",
  "contact_email": "cauvery@coop.org",
  "region": "Mandya, Karnataka"
}
```

---

## Distributions

| Method | Endpoint            | Description                          | Params / Body             |
|--------|---------------------|--------------------------------------|---------------------------|
| GET    | `/distributions`    | List all (vw_distribution_history)   | `?batch_id=&recipient_id=&purpose=&from=&to=&page=&limit=` |
| GET    | `/distributions/:id`| Single distribution detail           | —                         |
| POST   | `/distributions`    | Log new distribution                 | See fields below          |

**POST /distributions body:**
```json
{
  "batch_id": 3,
  "recipient_id": 2,
  "distributed_by": 1,
  "distribution_date": "2024-12-15",
  "quantity_kg": 50.000,
  "purpose": "cultivation",
  "remarks": "For rabi season planting"
}
```
> Backend validates: `quantity_kg <= remaining_kg` before insert.

---

## Viability Checks

| Method | Endpoint            | Description                    | Body / Params    |
|--------|---------------------|--------------------------------|------------------|
| GET    | `/viability-checks` | List checks                    | `?batch_id=&result=` |
| GET    | `/viability-checks/:id` | Single check detail        | —                |
| POST   | `/viability-checks` | Log new check                  | See fields below |

**POST /viability-checks body:**
```json
{
  "batch_id": 3,
  "check_date": "2024-12-01",
  "germination_rate_pct": 85.00,
  "moisture_content_pct": 12.50,
  "checked_by": "Dr. Anitha Rao",
  "result": "borderline",
  "action_taken": "Moved to cold storage, re-check in 30 days"
}
```

---

## Reports

| Method | Endpoint                        | Description                                     |
|--------|---------------------------------|-------------------------------------------------|
| GET    | `/reports/inventory-by-crop`    | Total remaining kg grouped by crop_type         |
| GET    | `/reports/distribution-trends`  | Monthly distribution totals (last 12 months)    |
| GET    | `/reports/top-recipients`       | Top 10 recipients by quantity received          |
| GET    | `/reports/variety-conservation` | Active batch count and stock per variety        |
| GET    | `/reports/expiring-batches`     | All batches expiring in next 60 days            |

---

## Error Response Format
All errors return:
```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

## Success Response Format
All successful responses return:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

## Pagination Format (list endpoints)
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```
