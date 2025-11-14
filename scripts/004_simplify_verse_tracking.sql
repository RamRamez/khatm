-- Add current position tracking and completion count to campaigns table
-- This replaces the need to store every verse reading

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS current_surah_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_verse_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0;

-- Initialize position for existing campaigns
-- For general campaigns, start at Surah 1, Verse 1
-- For surah-specific campaigns, the current_surah_number should match the campaign's surah_number
UPDATE campaigns 
SET current_surah_number = CASE 
  WHEN type = 'general' THEN 1
  WHEN type = 'surah' THEN surah_number
  ELSE 1
END,
current_verse_number = 1
WHERE current_surah_number IS NULL OR current_verse_number IS NULL;

-- Also ensure surah-based campaigns have the correct surah number set
UPDATE campaigns
SET current_surah_number = surah_number
WHERE type = 'surah' AND current_surah_number != surah_number;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);

-- Optional: Drop verse_readings table since we no longer need it
-- Uncomment the following lines if you want to remove the old table
-- DROP INDEX IF EXISTS idx_verse_readings_campaign;
-- DROP TABLE IF EXISTS verse_readings;

COMMENT ON COLUMN campaigns.current_surah_number IS 'Tracks the current surah position in the sequential reading';
COMMENT ON COLUMN campaigns.current_verse_number IS 'Tracks the current verse position in the sequential reading';
COMMENT ON COLUMN campaigns.completion_count IS 'Number of times this campaign has been completed (all verses read)';

