-- Add IP address tracking to campaign activity logs
ALTER TABLE campaign_activity_logs
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Optional index for IP lookup
CREATE INDEX IF NOT EXISTS idx_campaign_activity_ip ON campaign_activity_logs(ip_address);

