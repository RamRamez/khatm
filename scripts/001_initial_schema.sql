-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admins table for authentication
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('general', 'surah')),
  surah_number INTEGER,
  surah_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verse_readings table to track which verses have been read
CREATE TABLE IF NOT EXISTS verse_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  verse_number INTEGER NOT NULL,
  surah_number INTEGER NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_verse_readings_campaign ON verse_readings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE verse_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins table
CREATE POLICY "Admins can view their own data" ON admins
  FOR SELECT USING (auth.uid() = id);

-- RLS Policies for campaigns table
CREATE POLICY "Anyone can view active campaigns" ON campaigns
  FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for verse_readings table
CREATE POLICY "Anyone can view verse readings" ON verse_readings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert verse readings" ON verse_readings
  FOR INSERT WITH CHECK (true);
