-- Optional: Clean up the old verse_readings table
-- This script removes the verse_readings table since we no longer need to track individual readings
-- Run this AFTER running 004_simplify_verse_tracking.sql and verifying everything works

-- Drop the index first
DROP INDEX IF EXISTS idx_verse_readings_campaign;

-- Drop the table
DROP TABLE IF EXISTS verse_readings;

-- Note: If you want to keep historical data before dropping, you can backup the table first:
-- CREATE TABLE verse_readings_backup AS SELECT * FROM verse_readings;

