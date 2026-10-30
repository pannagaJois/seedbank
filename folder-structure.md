# Project Folder Structure — Seed Bank Management System

```
seed-bank/
│
├── db/
│   └── schema.sql                    # Full MySQL schema, triggers, events, views
│
├── backend/
│   ├── .env                          # Environment variables (never commit)
│   ├── .env.example                  # Template for env vars
│   ├── package.json
│   ├── server.js                     # Entry point — Express app setup, middleware, routes
│   │
│   ├── db/
│   │   └── connection.js             # mysql2 connection pool setup
│   │
│   ├── middleware/
│   │   ├── auth.js                   # JWT verification middleware
│   │   └── errorHandler.js           # Global error handling middleware
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── varieties.js
│   │   ├── contributors.js
│   │   ├── facilities.js
│   │   ├── batches.js
│   │   ├── recipients.js
│   │   ├── distributions.js
│   │   ├── viabilityChecks.js
│   │   └── reports.js
│   │
│   └── controllers/
│       ├── authController.js
│       ├── dashboardController.js
│       ├── varietyController.js
│       ├── contributorController.js
│       ├── facilityController.js
│       ├── batchController.js
│       ├── recipientController.js
│       ├── distributionController.js
│       ├── viabilityCheckController.js
│       └── reportsController.js
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    │
    └── src/
        ├── main.jsx                  # React entry point
        ├── App.jsx                   # Router setup (React Router v6)
        │
        ├── api/                      # Axios API call functions (one file per resource)
        │   ├── axiosInstance.js      # Axios base config + JWT interceptor
        │   ├── auth.api.js
        │   ├── dashboard.api.js
        │   ├── varieties.api.js
        │   ├── contributors.api.js
        │   ├── facilities.api.js
        │   ├── batches.api.js
        │   ├── recipients.api.js
        │   ├── distributions.api.js
        │   ├── viabilityChecks.api.js
        │   └── reports.api.js
        │
        ├── context/
        │   └── AuthContext.jsx       # Auth state (user, token, login/logout)
        │
        ├── hooks/                    # Custom React hooks
        │   ├── useAuth.js
        │   ├── usePagination.js
        │   └── useDebounce.js
        │
        ├── components/               # Reusable UI components
        │   ├── layout/
        │   │   ├── Sidebar.jsx       # Fixed left nav with all route links
        │   │   ├── TopBar.jsx        # Page title + user dropdown
        │   │   └── Layout.jsx        # Wrapper: Sidebar + TopBar + <Outlet/>
        │   │
        │   ├── ui/
        │   │   ├── StatCard.jsx      # Dashboard summary card (icon, value, label, trend)
        │   │   ├── StatusBadge.jsx   # Color-coded status pill (active/expired/etc.)
        │   │   ├── DataTable.jsx     # Reusable table (TanStack Table) with sort + pagination
        │   │   ├── SearchBar.jsx     # Debounced search input
        │   │   ├── Modal.jsx         # Generic modal wrapper
        │   │   ├── ConfirmDialog.jsx # Delete confirmation dialog
        │   │   ├── Spinner.jsx       # Loading spinner
        │   │   ├── EmptyState.jsx    # Empty table/list placeholder
        │   │   └── AlertBanner.jsx   # Inline warning/error banner
        │   │
        │   ├── forms/
        │   │   ├── VarietyForm.jsx
        │   │   ├── BatchForm.jsx
        │   │   ├── DistributionForm.jsx
        │   │   ├── ViabilityCheckForm.jsx
        │   │   ├── FacilityForm.jsx
        │   │   ├── StorageLogForm.jsx
        │   │   ├── ContributorForm.jsx
        │   │   └── RecipientForm.jsx
        │   │
        │   └── charts/
        │       ├── InventoryByCropChart.jsx   # Bar chart (Recharts)
        │       ├── DistributionTrendChart.jsx # Line chart (Recharts)
        │       └── TopRecipientsChart.jsx     # Horizontal bar chart (Recharts)
        │
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Varieties.jsx           # List + add/edit modal
            ├── VarietyDetail.jsx       # Single variety: info + inventory
            ├── Batches.jsx             # List with status filter
            ├── BatchDetail.jsx         # Batch info + distributions + checks
            ├── Distributions.jsx       # Full history with filters
            ├── ViabilityChecks.jsx     # List + log new check
            ├── Facilities.jsx          # Facility cards with utilization
            ├── FacilityDetail.jsx      # Facility detail + storage logs
            ├── Recipients.jsx
            └── Reports.jsx             # Charts + conservation table
```

---

## Key Conventions

### Backend
- Routes are thin — just `router.get('/', controller.method)` wiring
- All business logic lives in controllers
- DB queries use async/await with the mysql2 promise pool
- Errors thrown from controllers are caught by `errorHandler.js` middleware
- Response format is always `{ success, data, message }` or `{ error, message, code }`

### Frontend
- All API calls go through `src/api/` — never call axios directly in a component
- `axiosInstance.js` attaches the JWT token from localStorage on every request
- Forms use React Hook Form + Zod schema validation
- Data fetching uses `useEffect` + `useState` (or React Query if preferred)
- Modals open via local state — no routing for add/edit forms
- Toast notifications via `react-hot-toast` on success/error

### Naming
- Files: PascalCase for components (`.jsx`), camelCase for utils/hooks/api (`.js`)
- DB columns: snake_case
- API response keys: snake_case (match DB column names)
- React props and state: camelCase
