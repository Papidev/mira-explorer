-- Additive prerequisite: apply with the schema owner before deploying URL support.
BEGIN;
ALTER TABLE content.pois ADD COLUMN slug text;
ALTER TABLE content.people ADD COLUMN slug text;
CREATE UNIQUE INDEX pois_city_slug ON content.pois(city, slug);
CREATE UNIQUE INDEX people_slug ON content.people(slug);

-- Names may change; assigned slugs and removed POIs' reservations survive.
CREATE FUNCTION content.assign_public_slug() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  base text;
  candidate text;
  suffix integer := 1;
  display_name text := NEW.name;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.slug IS NOT NULL THEN
    NEW.slug := OLD.slug;
    RETURN NEW;
  END IF;
  -- Serialize allocation within each namespace, including concurrent catalog writes.
  PERFORM pg_advisory_xact_lock(620004063, CASE WHEN TG_TABLE_NAME = 'pois' THEN 1 ELSE 2 END);
  IF TG_TABLE_NAME = 'pois' THEN
    SELECT COALESCE((SELECT NULLIF(btrim(page->>'title'), '')
      FROM jsonb_array_elements(NEW.wikipedia_pages) page
      WHERE page->>'language' IN ('en', 'it') AND NULLIF(btrim(page->>'title'), '') IS NOT NULL
        AND (NEW.wikidata_id IS NULL OR page->>'wikidataId' IS NULL
          OR page->>'wikidataId' = NEW.wikidata_id)
      ORDER BY CASE page->>'language' WHEN 'en' THEN 0 ELSE 1 END LIMIT 1), NEW.name)
      INTO display_name;
  END IF;
  base := trim(both '-' from regexp_replace(lower(regexp_replace(normalize(display_name, NFKD), U&'[\0300-\036f]', '', 'g')), '[^a-z0-9]+', '-', 'g'));
  IF base = '' THEN base := CASE WHEN TG_TABLE_NAME = 'pois' THEN 'place' ELSE 'person' END; END IF;
  candidate := base;
  LOOP
    IF TG_TABLE_NAME = 'pois' THEN
      EXIT WHEN NOT EXISTS (SELECT FROM content.pois WHERE city = NEW.city AND slug = candidate);
    ELSE
      EXIT WHEN NOT EXISTS (SELECT FROM content.people WHERE slug = candidate);
    END IF;
    suffix := suffix + 1;
    candidate := base || '-' || suffix;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END $$;
CREATE TRIGGER assign_public_slug BEFORE INSERT OR UPDATE ON content.pois
  FOR EACH ROW EXECUTE FUNCTION content.assign_public_slug();
CREATE TRIGGER assign_public_slug BEFORE INSERT OR UPDATE ON content.people
  FOR EACH ROW EXECUTE FUNCTION content.assign_public_slug();
-- Ordered backfill keeps the first assignment deterministic. No content is regenerated.
DO $$ DECLARE row_id uuid; BEGIN
  FOR row_id IN SELECT id FROM content.pois ORDER BY id LOOP
    UPDATE content.pois SET slug = NULL WHERE id = row_id;
  END LOOP;
END $$;
DO $$ DECLARE row_id text; BEGIN
  FOR row_id IN SELECT id FROM content.people ORDER BY id LOOP
    UPDATE content.people SET slug = NULL WHERE id = row_id;
  END LOOP;
END $$;
ALTER TABLE content.pois ALTER COLUMN slug SET NOT NULL;
ALTER TABLE content.people ALTER COLUMN slug SET NOT NULL;
ALTER TABLE content.pois ADD CONSTRAINT pois_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE content.people ADD CONSTRAINT people_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
GRANT SELECT (id, slug) ON content.people TO historical_explorer_reader;
COMMIT;
