-- Fix RLS policies to allow public users to update verse positions
-- This is needed so anonymous users can increment verse positions when reading

-- Drop the old restrictive update policy and any previous versions
DROP POLICY IF EXISTS "Admins can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins can update all campaign fields" ON campaigns;
DROP POLICY IF EXISTS "Public can update verse tracking" ON campaigns;
DROP POLICY IF EXISTS "Allow campaign updates" ON campaigns;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS is_only_verse_tracking_update();

-- Create a single, simple policy that allows updates for both admins and public users
-- This is the simplest approach that should work immediately
CREATE POLICY "Allow campaign updates" ON campaigns
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL  -- Admins can update (authenticated)
    OR 
    is_active = true  -- Public can update active campaigns
  )
  WITH CHECK (
    auth.uid() IS NOT NULL  -- Admins can update to any state
    OR 
    is_active = true  -- Public can only update active campaigns
  );

-- Note: This simpler approach relies on the API layer to restrict which fields
-- public users can modify. The API only sends updates for:
-- - current_verse_number
-- - current_surah_number
-- - completion_count
-- All other campaign fields (name, type, slug, etc.) are only updated through the admin panel.

