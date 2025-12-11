-- Allow dua campaigns and store dua selection
ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_type_check;

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_type_check CHECK (type IN ('general', 'surah', 'dua'));

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS dua_key TEXT,
  ADD COLUMN IF NOT EXISTS current_dua_index INTEGER DEFAULT 1;

-- Initialize current_dua_index for existing campaigns
UPDATE campaigns
SET current_dua_index = 1
WHERE current_dua_index IS NULL;

COMMENT ON COLUMN campaigns.dua_key IS 'Identifier for the selected dua (e.g., salawat)';
COMMENT ON COLUMN campaigns.current_dua_index IS 'Tracks current dua position for dua campaigns';
