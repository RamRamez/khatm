-- Track device type used in activity logs
ALTER TABLE campaign_activity_logs
ADD COLUMN IF NOT EXISTS device_type TEXT;

CREATE INDEX IF NOT EXISTS idx_campaign_activity_device ON campaign_activity_logs(device_type);

