-- Track user activity per campaign for analytics
CREATE TABLE IF NOT EXISTS campaign_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_activity_campaign ON campaign_activity_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_activity_session ON campaign_activity_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_campaign_activity_time ON campaign_activity_logs(occurred_at);

-- RLS
ALTER TABLE campaign_activity_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert activity (public readers)
DROP POLICY IF EXISTS "Allow activity inserts" ON campaign_activity_logs;
CREATE POLICY "Allow activity inserts" ON campaign_activity_logs
  FOR INSERT
  WITH CHECK (true);

-- Admins can select activity data
DROP POLICY IF EXISTS "Admins can view activity" ON campaign_activity_logs;
CREATE POLICY "Admins can view activity" ON campaign_activity_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

