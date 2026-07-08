-- Backfill: replace the old (long, Farsi-title-based) campaign slugs with short
-- random 5-char base36 codes, matching the format now generated on campaign
-- creation (see lib/slug.ts). Example new slug: k3f9g
--
-- Run this ONCE in the Supabase SQL editor (it runs as a privileged role, so it
-- bypasses row-level security and can update every campaign).
--
-- WARNING: this changes the slugs of ALL existing campaigns, so any links that
-- were already shared for them (social media, etc.) will stop working.
--
-- Note: new slugs created by the app use crypto.getRandomValues for
-- unguessability. This one-time backfill uses Postgres random(), which is fine
-- here — the values are written once and then static, and the 36^5 (~60M) space
-- keeps them unguessable/non-enumerable.

DO $$
DECLARE
  rec RECORD;
  alphabet CONSTANT text := '0123456789abcdefghijklmnopqrstuvwxyz';
  new_slug text;
  i int;
  attempts int;
BEGIN
  FOR rec IN SELECT id, name, slug AS old_slug FROM campaigns LOOP
    attempts := 0;

    LOOP
      -- Build a 5-character base36 code.
      new_slug := '';
      FOR i IN 1..5 LOOP
        new_slug := new_slug || substr(alphabet, floor(random() * 36)::int + 1, 1);
      END LOOP;

      -- Accept it once it's not already used by another campaign.
      EXIT WHEN NOT EXISTS (SELECT 1 FROM campaigns WHERE slug = new_slug);

      attempts := attempts + 1;
      IF attempts > 50 THEN
        RAISE EXCEPTION 'Could not generate a unique slug after % attempts', attempts;
      END IF;
    END LOOP;

    UPDATE campaigns SET slug = new_slug WHERE id = rec.id;
    RAISE NOTICE 'Campaign "%": % -> %', rec.name, rec.old_slug, new_slug;
  END LOOP;
END $$;
