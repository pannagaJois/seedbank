-- =============================================================================
-- Seed Bank Management System - Database Schema
-- Compatible with MySQL 8.0 on AWS RDS
-- Notes: No DEFINER clauses to ensure clean import on managed RDS.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS storage_log;
DROP TABLE IF EXISTS viability_check;
DROP TABLE IF EXISTS distribution;
DROP TABLE IF EXISTS recipient;
DROP TABLE IF EXISTS seed_batch;
DROP TABLE IF EXISTS storage_facility;
DROP TABLE IF EXISTS contributor;
DROP TABLE IF EXISTS seed_variety;
DROP TABLE IF EXISTS users;
DROP VIEW IF EXISTS vw_dashboard_summary;
DROP VIEW IF EXISTS vw_inventory;
DROP VIEW IF EXISTS vw_distribution_history;
DROP VIEW IF EXISTS vw_facility_health;
DROP EVENT IF EXISTS evt_expire_batches;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. Users Table (Authentication)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(150),
  role ENUM('admin', 'user') DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Seed Variety Table
-- -----------------------------------------------------------------------------
CREATE TABLE seed_variety (
  variety_id INT AUTO_INCREMENT PRIMARY KEY,
  common_name VARCHAR(100) NOT NULL,
  scientific_name VARCHAR(150),
  crop_type VARCHAR(50) NOT NULL,
  origin_region VARCHAR(100),
  genetic_traits TEXT,
  viability_days INT NOT NULL DEFAULT 365,
  optimal_temp_c DECIMAL(5,2) DEFAULT 15.00,
  optimal_humidity_pct DECIMAL(5,2) DEFAULT 45.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Contributor Table
-- -----------------------------------------------------------------------------
CREATE TABLE contributor (
  contributor_id INT AUTO_INCREMENT PRIMARY KEY,
  contributor_name VARCHAR(150) NOT NULL,
  contributor_type VARCHAR(50) DEFAULT 'farmer',
  contact_phone VARCHAR(50),
  contact_email VARCHAR(150),
  address TEXT,
  region VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Storage Facility Table
-- -----------------------------------------------------------------------------
CREATE TABLE storage_facility (
  facility_id INT AUTO_INCREMENT PRIMARY KEY,
  facility_name VARCHAR(100) NOT NULL,
  location VARCHAR(150),
  capacity_kg DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  facility_type VARCHAR(50) DEFAULT 'cold_storage',
  current_temp_c DECIMAL(5,2),
  current_humidity_pct DECIMAL(5,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Seed Batch Table (Core Inventory Unit)
-- -----------------------------------------------------------------------------
CREATE TABLE seed_batch (
  batch_id INT AUTO_INCREMENT PRIMARY KEY,
  variety_id INT NOT NULL,
  contributor_id INT,
  facility_id INT,
  collection_date DATE NOT NULL,
  quantity_kg DECIMAL(10,3) NOT NULL,
  remaining_kg DECIMAL(10,3) NOT NULL,
  expiry_date DATE,
  batch_status ENUM('active', 'expired', 'distributed', 'quarantine') DEFAULT 'active',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variety_id) REFERENCES seed_variety(variety_id) ON DELETE RESTRICT,
  FOREIGN KEY (contributor_id) REFERENCES contributor(contributor_id) ON DELETE SET NULL,
  FOREIGN KEY (facility_id) REFERENCES storage_facility(facility_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Recipient Table
-- -----------------------------------------------------------------------------
CREATE TABLE recipient (
  recipient_id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_name VARCHAR(150) NOT NULL,
  recipient_type VARCHAR(50) DEFAULT 'cooperative',
  contact_phone VARCHAR(50),
  contact_email VARCHAR(150),
  region VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Distribution Table
-- -----------------------------------------------------------------------------
CREATE TABLE distribution (
  distribution_id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  recipient_id INT NOT NULL,
  distributed_by INT,
  distribution_date DATE NOT NULL,
  quantity_kg DECIMAL(10,3) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'cultivation',
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES seed_batch(batch_id) ON DELETE RESTRICT,
  FOREIGN KEY (recipient_id) REFERENCES recipient(recipient_id) ON DELETE RESTRICT,
  FOREIGN KEY (distributed_by) REFERENCES contributor(contributor_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Viability Check Table
-- -----------------------------------------------------------------------------
CREATE TABLE viability_check (
  check_id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  check_date DATE NOT NULL,
  germination_rate_pct DECIMAL(5,2),
  moisture_content_pct DECIMAL(5,2),
  checked_by VARCHAR(100),
  result ENUM('pass', 'borderline', 'fail') NOT NULL,
  action_taken TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES seed_batch(batch_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Storage Log Table
-- -----------------------------------------------------------------------------
CREATE TABLE storage_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  facility_id INT NOT NULL,
  temperature_c DECIMAL(5,2) NOT NULL,
  humidity_pct DECIMAL(5,2) NOT NULL,
  recorded_by VARCHAR(100),
  anomaly_flag BOOLEAN DEFAULT FALSE,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (facility_id) REFERENCES storage_facility(facility_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DELIMITER $$

-- Trigger 1: Auto set expiry_date and remaining_kg on batch insert
CREATE TRIGGER trg_batch_before_insert
BEFORE INSERT ON seed_batch
FOR EACH ROW
BEGIN
  DECLARE v_days INT DEFAULT 365;

  -- Look up variety viability days
  SELECT COALESCE(viability_days, 365) INTO v_days
  FROM seed_variety
  WHERE variety_id = NEW.variety_id;

  -- Set expiry_date automatically if not explicitly provided
  IF NEW.expiry_date IS NULL THEN
    SET NEW.expiry_date = DATE_ADD(NEW.collection_date, INTERVAL v_days DAY);
  END IF;

  -- Set remaining_kg to quantity_kg initially
  IF NEW.remaining_kg IS NULL THEN
    SET NEW.remaining_kg = NEW.quantity_kg;
  END IF;
END$$

-- Trigger 2: Prevent over-distribution (quantity_kg must not exceed remaining_kg)
CREATE TRIGGER trg_distribution_before_insert
BEFORE INSERT ON distribution
FOR EACH ROW
BEGIN
  DECLARE cur_stock DECIMAL(10,3);

  SELECT remaining_kg INTO cur_stock
  FROM seed_batch
  WHERE batch_id = NEW.batch_id;

  IF cur_stock IS NULL OR NEW.quantity_kg > cur_stock THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Distribution quantity exceeds remaining stock in batch';
  END IF;
END$$

-- Trigger 3: Decrement remaining_kg and auto-mark distributed when remaining_kg reaches 0
CREATE TRIGGER trg_distribution_after_insert
AFTER INSERT ON distribution
FOR EACH ROW
BEGIN
  UPDATE seed_batch
  SET 
    remaining_kg = remaining_kg - NEW.quantity_kg,
    batch_status = IF((remaining_kg - NEW.quantity_kg) <= 0.0001, 'distributed', batch_status)
  WHERE batch_id = NEW.batch_id;
END$$

-- Trigger 4: Quarantine batch on failed viability check
CREATE TRIGGER trg_viability_quarantine
AFTER INSERT ON viability_check
FOR EACH ROW
BEGIN
  IF NEW.result = 'fail' THEN
    UPDATE seed_batch
    SET batch_status = 'quarantine'
    WHERE batch_id = NEW.batch_id;
  END IF;
END$$

DELIMITER ;

-- =============================================================================
-- SCHEDULED EVENT (Auto-expire batches daily)
-- =============================================================================
DELIMITER $$

CREATE EVENT IF NOT EXISTS evt_expire_batches
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  UPDATE seed_batch
  SET batch_status = 'expired'
  WHERE expiry_date <= CURDATE() AND batch_status = 'active';
END$$

DELIMITER ;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View 1: Dashboard Summary
CREATE OR REPLACE VIEW vw_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM seed_batch WHERE batch_status = 'active') AS active_batches,
  (SELECT COALESCE(SUM(remaining_kg), 0) FROM seed_batch WHERE batch_status = 'active') AS total_remaining_kg,
  (SELECT COUNT(*) FROM distribution WHERE YEAR(distribution_date) = YEAR(CURDATE()) AND MONTH(distribution_date) = MONTH(CURDATE())) AS distributions_this_month,
  (SELECT COUNT(*) FROM seed_batch WHERE batch_status = 'active' AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS expiring_in_30_days,
  (SELECT COUNT(*) FROM viability_check WHERE result = 'fail' AND check_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)) AS failed_checks_90_days,
  (SELECT COUNT(*) FROM storage_log WHERE anomaly_flag = TRUE AND recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS anomalies_this_week;

-- View 2: Inventory Summary by Variety
CREATE OR REPLACE VIEW vw_inventory AS
SELECT
  sv.variety_id,
  sv.common_name,
  sv.scientific_name,
  sv.crop_type,
  COUNT(sb.batch_id) AS total_batches,
  COUNT(CASE WHEN sb.batch_status = 'active' THEN 1 END) AS active_batches,
  COALESCE(SUM(CASE WHEN sb.batch_status = 'active' THEN sb.remaining_kg ELSE 0 END), 0) AS total_remaining_kg
FROM seed_variety sv
LEFT JOIN seed_batch sb ON sv.variety_id = sb.variety_id
GROUP BY sv.variety_id, sv.common_name, sv.scientific_name, sv.crop_type;

-- View 3: Distribution History
CREATE OR REPLACE VIEW vw_distribution_history AS
SELECT
  d.distribution_id,
  d.batch_id,
  d.recipient_id,
  d.distribution_date,
  d.quantity_kg,
  d.purpose,
  d.remarks,
  d.distributed_by,
  r.recipient_name,
  sv.common_name AS seed_variety,
  sv.variety_id
FROM distribution d
JOIN recipient r ON d.recipient_id = r.recipient_id
JOIN seed_batch sb ON d.batch_id = sb.batch_id
JOIN seed_variety sv ON sb.variety_id = sv.variety_id
ORDER BY d.distribution_date DESC;

-- View 4: Facility Health and Utilization
CREATE OR REPLACE VIEW vw_facility_health AS
SELECT
  sf.facility_id,
  sf.facility_name,
  sf.location,
  sf.capacity_kg,
  sf.facility_type,
  sf.current_temp_c,
  sf.current_humidity_pct,
  COALESCE(SUM(CASE WHEN sb.batch_status = 'active' THEN sb.remaining_kg ELSE 0 END), 0) AS used_kg,
  ROUND(
    COALESCE(SUM(CASE WHEN sb.batch_status = 'active' THEN sb.remaining_kg ELSE 0 END), 0) / NULLIF(sf.capacity_kg, 0) * 100,
    2
  ) AS utilization_pct
FROM storage_facility sf
LEFT JOIN seed_batch sb ON sf.facility_id = sb.facility_id
GROUP BY sf.facility_id, sf.facility_name, sf.location, sf.capacity_kg, sf.facility_type, sf.current_temp_c, sf.current_humidity_pct;

-- =============================================================================
-- SAMPLE SEED DATA
-- =============================================================================

INSERT INTO seed_variety (common_name, scientific_name, crop_type, origin_region, genetic_traits, viability_days, optimal_temp_c, optimal_humidity_pct) VALUES
('Red Sorghum', 'Sorghum bicolor', 'cereal', 'Karnataka, India', 'drought-resistant, heirloom', 365, 15.00, 45.00),
('Navara Rice', 'Oryza sativa', 'cereal', 'Kerala, India', 'medicinal, flood-tolerant', 540, 14.00, 40.00),
('Finger Millet (Ragi)', 'Eleusine coracana', 'millets', 'Karnataka, India', 'high calcium, pest-hardy', 730, 16.00, 50.00),
('Horse Gram', 'Macrotyloma uniflorum', 'pulses', 'Tamil Nadu, India', 'nitrogen-fixing, arid-adapted', 365, 18.00, 45.00),
('Black Gram', 'Vigna mungo', 'pulses', 'Andhra Pradesh, India', 'protein-rich, fast-maturing', 365, 15.00, 45.00);

INSERT INTO contributor (contributor_name, contributor_type, contact_phone, contact_email, address, region) VALUES
('Ravi Kumar', 'farmer', '+91-9876543210', 'ravi@example.com', 'Mandya District', 'Karnataka'),
('Sahaja Samrudha Seed Savers', 'ngo', '+91-8023456789', 'seeds@sahajasamrudha.org', 'Bengaluru South', 'Karnataka'),
('Malnad Farmer Collective', 'cooperative', '+91-8282245678', 'contact@malnadseeds.org', 'Shivamogga', 'Karnataka');

INSERT INTO storage_facility (facility_name, location, capacity_kg, facility_type, current_temp_c, current_humidity_pct) VALUES
('Cold Store A (Central Vault)', 'Mysuru, Karnataka', 5000.00, 'cold_storage', 14.50, 42.00),
('Dry Seed Silo 1', 'Mandya, Karnataka', 2500.00, 'ambient_dry', 21.00, 38.00),
('Cryo Reserve Room', 'Bengaluru, Karnataka', 1000.00, 'deep_freeze', -18.00, 25.00);

-- Trigger calculates expiry_date and remaining_kg automatically
INSERT INTO seed_batch (variety_id, contributor_id, facility_id, collection_date, quantity_kg, notes) VALUES
(1, 1, 1, '2026-03-15', 250.000, 'First harvest post-monsoon from Mandya'),
(2, 2, 1, '2026-04-01', 180.000, 'Rare medicinal black-husk strain'),
(3, 1, 2, '2026-02-10', 400.000, 'Heirloom ragi seed preservation lot'),
(4, 3, 2, '2026-01-20', 120.000, 'Collected from arid slopes of Chitradurga'),
(5, 2, 1, '2026-04-10', 95.000, 'Certified organic collection');

INSERT INTO recipient (recipient_name, recipient_type, contact_phone, contact_email, region) VALUES
('Cauvery Farmers Cooperative', 'cooperative', '+91-8765432109', 'cauvery@coop.org', 'Mandya, Karnataka'),
('Krishi Vigyan Kendra (KVK)', 'research_institute', '+91-8212456789', 'kvk.mysuru@icar.gov.in', 'Mysuru, Karnataka'),
('Organic Growers Association', 'ngo', '+91-9123456780', 'support@oga-south.org', 'Hassan, Karnataka');

-- Log an initial distribution (trigger decrements batch 1 remaining_kg)
INSERT INTO distribution (batch_id, recipient_id, distributed_by, distribution_date, quantity_kg, purpose, remarks) VALUES
(1, 1, 1, '2026-04-20', 35.000, 'cultivation', 'Seed multiplication trial in Mandya cluster'),
(3, 2, 1, '2026-04-22', 50.000, 'research', 'Viability and germination trial');

-- Log viability checks (one pass, one borderline)
INSERT INTO viability_check (batch_id, check_date, germination_rate_pct, moisture_content_pct, checked_by, result, action_taken) VALUES
(1, '2026-04-18', 94.50, 11.20, 'Dr. Anitha Rao', 'pass', 'Batch verified ready for distribution'),
(2, '2026-04-19', 82.00, 13.00, 'Dr. Anitha Rao', 'borderline', 'Transferred to desiccated chamber; re-test in 60 days');

-- Log storage environmental readings
INSERT INTO storage_log (facility_id, temperature_c, humidity_pct, recorded_by, anomaly_flag) VALUES
(1, 14.50, 42.00, 'Sensor-Node-01', FALSE),
(2, 21.00, 38.00, 'Sensor-Node-02', FALSE),
(3, -18.20, 25.10, 'Sensor-Node-03', FALSE);
