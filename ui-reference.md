# UI Reference — Seed Bank Management System

---

## Design Philosophy
Modern agricultural management dashboard. Clean, functional, and data-dense
without feeling cluttered. Earthy greens with clear data hierarchy.
Every screen should make it immediately obvious what needs attention
(expiring batches, failed checks, storage anomalies).

---

## Color Palette

```css
/* Primary */
--color-primary:        #2D6A4F;  /* dark green — sidebar, primary buttons */
--color-primary-light:  #52B788;  /* medium green — hover, accents */
--color-primary-pale:   #D8F3DC;  /* very light green — selected nav item bg */

/* Status colors */
--color-success:        #40916C;  /* active status */
--color-warning:        #F4A261;  /* expiring soon, quarantine */
--color-danger:         #E76F51;  /* expired, failed check */
--color-info:           #4895EF;  /* distributed status */

/* Neutrals */
--color-bg:             #F8F9FA;  /* page background */
--color-surface:        #FFFFFF;  /* cards, panels */
--color-border:         #E9ECEF;  /* dividers, table borders */
--color-text-primary:   #212529;  /* headings */
--color-text-secondary: #6C757D;  /* labels, muted text */
--color-sidebar-bg:     #1B4332;  /* sidebar background */
--color-sidebar-text:   #D8F3DC;  /* sidebar nav text */
```

---

## Typography

```css
font-family: 'Inter', sans-serif;

/* Sizes */
--text-xs:   12px;
--text-sm:   13px;
--text-base: 14px;
--text-lg:   16px;
--text-xl:   20px;
--text-2xl:  24px;
--text-3xl:  30px;
```

---

## Layout

### Overall structure
```
+------------------+------------------------------------------+
|                  |  TopBar (56px fixed)                     |
|  Sidebar         +------------------------------------------+
|  (240px fixed)   |                                          |
|                  |  Main Content Area                       |
|                  |  padding: 24px                           |
|                  |                                          |
+------------------+------------------------------------------+
```

### Sidebar
- Width: 240px, fixed left, full height
- Background: `#1B4332` (dark forest green)
- Logo / app name at top (32px padding, white text)
- Nav links with icon + label
- Active link: `#D8F3DC` background, `#1B4332` text, left border `#52B788` (3px)
- Hover: slight white overlay (5% opacity)
- Logged-in user info at bottom

**Sidebar nav items (in order):**
1. Dashboard (grid icon)
2. Seed Varieties (leaf icon)
3. Batches (box icon)
4. Distributions (truck icon)
5. Viability Checks (flask icon)
6. Storage Facilities (building icon)
7. Recipients (users icon)
8. Reports (chart icon)

### TopBar
- Height: 56px, white, border-bottom `#E9ECEF`
- Left: current page title (18px, semibold)
- Right: notification bell + user avatar + dropdown (profile / logout)

### Content area
- Background: `#F8F9FA`
- Padding: 24px
- Max width: none (full remaining width)

---

## Components

### StatCard (Dashboard)
```
+---------------------------------------+
|  [icon]        label text             |
|                                       |
|  large number value                   |
|  small trend or sub-label             |
+---------------------------------------+
```
- White background, border-radius 12px, subtle shadow
- Icon in a colored circle (40px)
- Value: 30px bold
- Trend: small text in green (positive) or red (negative)
- **Alert variant** (amber border + bg tint) for "Expiring in 30 days" when > 0
- **Danger variant** (red border + bg tint) for "Failed checks" when > 0

**The 6 dashboard stat cards:**
| Label | Icon color | Alert condition |
|---|---|---|
| Active Batches | green | — |
| Total Stock (kg) | teal | — |
| Distributions This Month | blue | — |
| Expiring in 30 Days | amber | > 0 → amber alert |
| Failed Checks (90d) | red | > 0 → red alert |
| Anomalies This Week | orange | > 0 → amber alert |

### StatusBadge
Pill-shaped inline badge with color fill:

| Status | Background | Text color |
|---|---|---|
| active | `#D8F3DC` | `#1B4332` |
| expired | `#FFE5E5` | `#9B2335` |
| distributed | `#DBF0FF` | `#14558F` |
| quarantine | `#FFF3CD` | `#7D5A00` |
| pass | `#D8F3DC` | `#1B4332` |
| fail | `#FFE5E5` | `#9B2335` |
| borderline | `#FFF3CD` | `#7D5A00` |

### DataTable
- White background, rounded corners, border
- Column headers: 13px, semibold, uppercase, `#6C757D`
- Row height: 52px
- Alternating row bg: white / `#F8F9FA`
- Hover row: `#F0FFF4`
- Each row ends with an "Actions" column (View / Edit / Delete icon buttons)
- Sort indicator arrows on sortable columns
- Pagination bar at bottom: Previous / page numbers / Next
- Search bar above table (debounced, 300ms)
- Filter dropdowns beside search when applicable (e.g. status filter for batches)

### Modal
- Centered overlay with backdrop (rgba 0,0,0,0.4)
- White card, border-radius 16px, max-width 560px
- Header: title (18px bold) + X close button
- Body: form content with 24px padding
- Footer: Cancel button (ghost) + Submit button (primary green)
- Closes on backdrop click or Escape key

### Forms (inside modals)
- Label above each input (13px, semibold, `#374151`)
- Input: 40px height, border `#D1D5DB`, border-radius 8px, focus ring green
- Select dropdowns styled to match inputs
- Required field marker: red asterisk after label
- Inline error text below field in red (13px) on validation fail
- Submit disables and shows spinner while loading

### Toast notifications
- Top-right corner
- Success: green left border + check icon
- Error: red left border + X icon
- Auto-dismiss after 3 seconds

---

## Page-by-page UI

### Dashboard
```
Row 1: 6 StatCards (2 columns on mobile, 3 on tablet, 6 on desktop)
Row 2: 
  Left (60%): "Recent Batches" DataTable (5 rows, no pagination)
  Right (40%): "Expiring Soon" list with days-left chip
Row 3: "Recent Distributions" DataTable (5 rows, no pagination)
```

### Seed Varieties
- Page title + "Add Variety" button (top right)
- DataTable columns: Common Name, Scientific Name, Crop Type, Origin, Viability (days), Optimal Temp, Actions
- Click row → navigate to VarietyDetail page
- Add/Edit opens modal with VarietyForm

### VarietyDetail
- Breadcrumb: Varieties > [Variety Name]
- Info card (top): all variety fields, editable via Edit button
- Below: `vw_inventory` data for this variety (total stock, active batches, avg germination)
- Batches table: all batches for this variety with status badges

### Batches
- Page title + "Add Batch" button
- Status filter tabs: All | Active | Expired | Distributed | Quarantine
- DataTable columns: Batch ID, Variety, Contributor, Facility, Collected, Expiry, Remaining (kg), Germination %, Status, Actions
- Expiry date shown in amber if within 30 days, red if past
- Click row → BatchDetail

### BatchDetail
- Info panel: batch metadata, status badge, remaining kg progress bar
- Tabs: Distributions | Viability Checks
- Distributions tab: table of all distributions from this batch
- Viability Checks tab: timeline of check results with result badges
- "Log Viability Check" button on checks tab
- "Change Status" dropdown button

### Distributions
- Page title + "Log Distribution" button
- Filters: variety search, recipient dropdown, purpose dropdown, date range picker
- DataTable columns: Date, Variety, Batch ID, Recipient, Quantity (kg), Purpose, Distributed By, Actions
- Log Distribution opens modal with DistributionForm (includes remaining stock hint below batch selector)

### Viability Checks
- Page title + "Log Check" button
- Filter by result (pass / fail / borderline) + batch search
- DataTable columns: Date, Batch, Variety, Germination %, Moisture %, Checked By, Result, Action Taken

### Storage Facilities
- Page title + "Add Facility" button
- Card grid (not table) — one card per facility:
  ```
  +-------------------------------+
  | [type icon]  Facility Name    |
  | Location                      |
  |                               |
  | Temp: 12.5°C  Humidity: 40%  |
  |                               |
  | Utilization: [====70%====]   |
  | X batches stored              |
  |              [View Details]   |
  +-------------------------------+
  ```
- Utilization bar: green < 70%, amber 70–90%, red > 90%

### FacilityDetail
- Info panel + "Log Condition" button
- Batches stored: DataTable of active batches in this facility
- Storage Logs: timeline/table of last 20 readings, anomaly rows highlighted amber

### Recipients
- Page title + "Add Recipient" button
- DataTable: Name, Type, Region, Phone, Email, Actions

### Reports
- Section 1: "Inventory by Crop Type" — vertical bar chart (Recharts BarChart)
- Section 2: "Distribution Trends" — line chart, last 12 months (Recharts LineChart)
- Section 3: "Top Recipients" — horizontal bar chart, top 10 by kg received
- Section 4: "Variety Conservation Status" — table with active batches + remaining kg + avg germination per variety

---

## Responsive Behavior
- Desktop (>1024px): Full sidebar + content layout as described
- Tablet (768–1024px): Sidebar collapses to icon-only (48px)
- Mobile (<768px): Sidebar hidden, hamburger opens overlay drawer

---

## Iconography
Use Lucide React icons throughout.
Key mappings:
- Dashboard → `LayoutDashboard`
- Varieties → `Leaf`
- Batches → `Package`
- Distributions → `Truck`
- Viability → `FlaskConical`
- Facilities → `Warehouse`
- Recipients → `Users`
- Reports → `BarChart3`
- Add / Create → `Plus`
- Edit → `Pencil`
- Delete → `Trash2`
- View → `Eye`
- Alert → `AlertTriangle`
- Success → `CheckCircle`
- Search → `Search`
- Filter → `SlidersHorizontal`
