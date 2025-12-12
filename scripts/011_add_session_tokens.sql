-- Store device/browser-derived session tokens to survive webview storage loss
CREATE TABLE IF NOT EXISTS session_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_tokens_fingerprint ON session_tokens(fingerprint_hash);

ALTER TABLE session_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public to read and create/update their token rows
DROP POLICY IF EXISTS "Allow session token select" ON session_tokens;
CREATE POLICY "Allow session token select" ON session_tokens
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow session token insert" ON session_tokens;
CREATE POLICY "Allow session token insert" ON session_tokens
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow session token update" ON session_tokens;
CREATE POLICY "Allow session token update" ON session_tokens
  FOR UPDATE USING (true);

