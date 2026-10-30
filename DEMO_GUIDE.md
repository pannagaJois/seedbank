# Seed Bank — Demo Guide (Mac)

This guide walks you through setting up and running the Seed Bank demo on a Mac (MacBook Air M3, macOS). Every command is copy-pasteable. Work from the repository root (the folder that contains `schema.sql`, `backend/` and `frontend/`).

If anything fails, copy the command output and paste it back here and I'll help troubleshoot.

---

## 1) Prerequisites check

- Node.js (recommended >= 18.x)

  Check your Node.js version:

      node -v

  If you don't have Node.js or your version is older than 18, install one of the recommended installers:

  - Install via Homebrew (recommended for macOS): https://nodejs.org/en/download/package-manager/#macos
  - Or use nvm (multi-version manager): https://github.com/nvm-sh/nvm

  Example Homebrew install:

      brew install node

- npm (bundled with Node.js)

  Check npm:

      npm -v

- MySQL (server)

  Check if `mysql` CLI is available:

      mysql --version

  If MySQL is missing, install it via Homebrew:

      brew update
      brew install mysql

  Start MySQL (below) will use `brew services`.

---

## 2) Database setup

Open a terminal and start MySQL via Homebrew services (this runs MySQL as a background daemon):

      brew services start mysql
      # wait a few seconds for the server to be ready

Create the `seed_bank` database and run the provided schema. From the repository root run:

      # Create the database (you may be prompted for your MySQL root password)
      mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS seed_bank;"

      # Run the schema.sql file to create tables, triggers, events and views
      # (this file is at repository root: schema.sql)
      mysql -u root -p seed_bank < schema.sql

If you don't want to use `root` you can connect with any MySQL user that has privileges to create databases and tables.

Verify the schema created tables (sample query):

      mysql -u root -p -e "USE seed_bank; SHOW TABLES;"

Sample query to check the dashboard view `vw_dashboard_summary`:

      mysql -u root -p -e "USE seed_bank; SELECT * FROM vw_dashboard_summary LIMIT 1;"

If `vw_dashboard_summary` returns a single row (values may be zeros), the database schema and views are present.

> Note: The repository schema does not include a `users` table for authentication. Create a minimal `users` table so the backend can register/login users (used in the demo):

      -- Run this with the mysql client or copy/paste into a MySQL GUI
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(150),
        role ENUM('admin','user') DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

Run it with:

      mysql -u root -p seed_bank < - <<'SQL'
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(150),
        role ENUM('admin','user') DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      SQL

---

## 3) Backend setup

Open a new terminal and run the backend steps:

      cd "$(pwd)/backend"
      # Install dependencies
      npm install express mysql2 jsonwebtoken bcryptjs dotenv cors morgan

      # (Optionally) install nodemon for development
      npm install --save-dev nodemon

Create a `.env` file in `backend/` (copy from `.env.example` if present) with these variables filled in for your local MySQL user:

      PORT=5000
      DB_HOST=localhost
      DB_USER=root
      DB_PASS=your_mysql_root_password_here
      DB_NAME=seed_bank
      JWT_SECRET=super_secret_demo_key
      JWT_EXPIRES_IN=7d
      NODE_ENV=development

Start the backend server (simple run):

      # from backend/ folder
      node server.js

      # or if you installed nodemon for auto-reload during development
      npx nodemon server.js

You should see logging like "Server listening on port 5000" in the terminal.

### Verify backend with API calls

1) Register a demo user (create an account):

      curl -s -X POST http://localhost:5000/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{"name":"Demo Admin","email":"admin@example.com","password":"Password123","role":"admin"}' | jq

2) Login to get a token:

      TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@example.com","password":"Password123"}' | jq -r '.data.token')
      echo $TOKEN

3) Call the protected dashboard summary endpoint with the token:

      curl -s http://localhost:5000/api/dashboard/summary -H "Authorization: Bearer $TOKEN" | jq

If you see JSON with `success: true` and a `data` object, the backend is running and connected to the database.

---

## 4) Frontend setup

Open another terminal and run the frontend steps (from repository root):

      cd "$(pwd)/frontend"

      # Install required packages
      npm install react react-dom react-router-dom axios tailwindcss lucide-react recharts react-hook-form zod react-hot-toast @tanstack/react-table

      # Initialize Tailwind (if you need to recreate tailwind files)
      npx tailwindcss init -p

      # Start the Vite dev server
      npm run dev

Vite will print the local dev URL in the terminal — by default http://localhost:5173 (unless the project Vite config overrides the port). Open that URL in your browser.

If the dev server is hosted on a different port the terminal output will show the URL (for example http://localhost:3000). Use whichever URL Vite displays.

---

## 5) Demo flow — what to click to impress

Open the frontend URL in a browser (e.g. http://localhost:5173). Follow these steps:

1. Login screen

   - Use the credentials you registered earlier (admin@example.com / Password123) or register a new account via the register endpoint.

2. Dashboard overview

   - The top area shows 6 stat cards: Active Batches, Total Stock (kg), Distributions This Month, Expiring in 30 Days, Failed Checks (90d), Anomalies This Week.
   - Point out any non-zero cards (these trigger alert or danger styles).

3. Add a seed variety

   - Navigate to Seed Varieties → Add Variety.
   - Fill fields: Common Name, Scientific Name, Crop Type, Viability Days, Optimal Temp/Humidity.
   - Submit and watch it appear in the varieties list.

4. Add a storage facility

   - Go to Storage Facilities → Add Facility.
   - Fill facility name, location, capacity, temperature and humidity settings.

5. Add a contributor

   - Go to Contributors → Add Contributor.
   - Provide name, type, contact details.

6. Create a seed batch (expiry auto-calculation)

   - Go to Batches → Add Batch.
   - Select the variety you added, pick the contributor and facility, set `collection_date` and `quantity_kg`.
   - Submit. The database trigger sets `expiry_date` automatically using the variety's `viability_days`.
   - View the Batch Detail to see `expiry_date` and `remaining_kg` (initially equals `quantity_kg`).

7. Log a viability check

   - On the Batch Detail page, go to Viability Checks → Log Check.
   - Enter `germination_rate_pct` and `result` (`pass` / `fail` / `borderline`).
   - If you record a `fail`, the trigger will update `batch_status` to `quarantine` automatically; the UI will show a fail badge.

8. Log a distribution

   - Go to Distributions → Log Distribution.
   - Select the batch, recipient, date, and `quantity_kg` (must not exceed `remaining_kg`).
   - After successful submission the `remaining_kg` of that batch is decremented by the distribution trigger. If it reaches zero, the batch becomes `distributed`.

9. Reports

   - Visit Reports → Inventory by Crop / Distribution Trends / Top Recipients.
   - Charts render using the precomputed views and report endpoints.

10. Facility utilization card

   - Go to Storage Facilities page. Each facility card shows `Utilization` (used_kg / capacity_kg). Show the bar and color (green/amber/red) depending on thresholds.

Tips: use small quantities when creating demo distributions and checks so behavior is visible quickly.

---

## 6) Stopping everything cleanly

- Stop frontend dev server: focus the terminal where you ran `npm run dev` and press `Ctrl+C`.

  Or find the pid and kill it:

      lsof -i :5173
      # then kill <PID>
      kill <PID>

- Stop backend server: press `Ctrl+C` in the terminal running `node server.js` (or the nodemon terminal). Or kill by port:

      lsof -i :5000
      kill <PID>

- Stop MySQL (Homebrew service):

      brew services stop mysql

---

# Appendix — Quick command summary

      # Start MySQL service
      brew services start mysql

      # Create DB and run schema (from repo root)
      mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS seed_bank;"
      mysql -u root -p seed_bank < schema.sql

      # Create users table (if not created already)
      mysql -u root -p seed_bank < - <<'SQL'
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(150),
        role ENUM('admin','user') DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      SQL

      # Backend
      cd backend
      npm install express mysql2 jsonwebtoken bcryptjs dotenv cors morgan
      node server.js

      # Register and login (in another terminal)
      curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Demo","email":"admin@example.com","password":"Password123"}'
      TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"Password123"}' | jq -r '.data.token')
      curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/dashboard/summary

      # Frontend
      cd frontend
      npm install react react-dom react-router-dom axios tailwindcss lucide-react recharts react-hook-form zod react-hot-toast @tanstack/react-table
      npx tailwindcss init -p
      npm run dev

      # Stop services
      brew services stop mysql

---

If you want, I can now:

- Run `npm install` for backend and frontend here and start servers. (I'll need your confirmation before running commands.)
- Improve the UI styling for the Dashboard and Pages.
- Add seed/sample data SQL to pre-populate the demo with realistic records.

Which of the above would you like me to do next?
