-- Add DELETE policy for campaigns table
-- This allows authenticated admins to delete campaigns

CREATE POLICY "Admins can delete campaigns" ON campaigns
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add comment for documentation
COMMENT ON POLICY "Admins can delete campaigns" ON campaigns 
IS 'Allows authenticated users to delete campaigns from the database';

