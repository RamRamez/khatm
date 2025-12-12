-- Track device OS and version in activity logs
ALTER TABLE campaign_activity_logs
ADD COLUMN IF NOT EXISTS device_os TEXT,
ADD COLUMN IF NOT EXISTS device_os_version TEXT;

CREATE INDEX IF NOT EXISTS idx_campaign_activity_os ON campaign_activity_logs(device_os);

