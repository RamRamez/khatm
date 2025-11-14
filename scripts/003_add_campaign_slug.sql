-- Add slug column to campaigns table (nullable first)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS slug TEXT;

-- For existing campaigns, generate slug from campaign name
-- This will preserve Persian characters and make URLs readable
UPDATE campaigns 
SET slug = LOWER(
  TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(name, '\s+', '-', 'g'),
      '[^آ-یa-zA-Z0-9\-]',
      '',
      'g'
    ),
    '-'
  )
)
WHERE slug IS NULL;

-- Handle duplicates by appending a counter
DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  FOR rec IN 
    SELECT id, slug, 
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
    FROM campaigns 
    WHERE slug IS NOT NULL
  LOOP
    IF rec.rn > 1 THEN
      base_slug := rec.slug;
      counter := rec.rn;
      new_slug := base_slug || '-' || counter;
      
      UPDATE campaigns 
      SET slug = new_slug 
      WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE campaigns ALTER COLUMN slug SET NOT NULL;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_slug_unique UNIQUE (slug);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);

