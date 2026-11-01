-- Apply with the schema owner before deploying Person portrait support.
BEGIN;
ALTER TABLE content.people ADD COLUMN image jsonb;
ALTER TABLE content.people ADD CONSTRAINT people_image_object CHECK (image IS NULL OR jsonb_typeof(image) = 'object');
GRANT SELECT (image) ON content.people TO historical_explorer_reader;
COMMIT;
