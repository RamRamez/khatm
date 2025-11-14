-- Add is_public column to campaigns table
-- Public campaigns will be shown on homepage, private campaigns will not

ALTER TABLE campaigns
ADD COLUMN is_public BOOLEAN DEFAULT true NOT NULL;

-- Update existing campaigns to be public by default
UPDATE campaigns SET is_public = true;

-- Add comment to the column
COMMENT ON COLUMN campaigns.is_public IS 'Whether the campaign is visible on the public homepage';

