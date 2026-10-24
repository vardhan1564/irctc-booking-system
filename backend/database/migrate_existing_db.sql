-- =====================================================================
--  Run ONCE on your EXISTING "irctc" database (from the old JSP app)
--  before starting the Spring Boot backend. Safe: no data is deleted.
-- =====================================================================
USE irctc;

-- 1) BCrypt hashes are 60 chars. Old columns may be shorter.
ALTER TABLE users  MODIFY password VARCHAR(255) NOT NULL;
ALTER TABLE admins MODIFY password VARCHAR(255) NOT NULL;

-- 2) Booking class is now stored (old app kept it only in the session).
--    If this errors with "Duplicate column", it already exists: ignore it.
ALTER TABLE bookings ADD COLUMN class_code VARCHAR(5) DEFAULT 'SL';

-- 3) Helpful indexes for the new queries (ignore "Duplicate key name" errors).
CREATE INDEX idx_bookings_status_created ON bookings (status, created_at);
CREATE INDEX idx_bookings_train_date     ON bookings (train_id, journey_date);

-- Existing plain-text passwords keep working: each user's password is converted
-- to a BCrypt hash automatically the next time they log in.
