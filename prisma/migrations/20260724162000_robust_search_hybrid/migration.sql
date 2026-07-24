CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- The stock unaccent function is STABLE, so expose a pinned wrapper for
-- expression indexes. This is safe as long as the unaccent dictionary is static.
CREATE OR REPLACE FUNCTION public.search_unaccent(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog, extensions, public
AS $$
  SELECT unaccent('unaccent', value);
$$;

CREATE OR REPLACE FUNCTION posts_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', public.search_unaccent(COALESCE(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('simple', public.search_unaccent(COALESCE(NEW.excerpt, ''))), 'B') ||
    setweight(to_tsvector('simple', public.search_unaccent(COALESCE(NEW."contentText", ''))), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.posts_search_vector_update()
  SET search_path = pg_catalog, extensions, public;

UPDATE posts
SET search_vector =
  setweight(to_tsvector('simple', public.search_unaccent(COALESCE(title, ''))), 'A') ||
  setweight(to_tsvector('simple', public.search_unaccent(COALESCE(excerpt, ''))), 'B') ||
  setweight(to_tsvector('simple', public.search_unaccent(COALESCE("contentText", ''))), 'C');

CREATE INDEX IF NOT EXISTS posts_title_trgm_idx
  ON posts USING GIN (lower(public.search_unaccent(title)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS posts_excerpt_trgm_idx
  ON posts USING GIN (lower(public.search_unaccent(COALESCE(excerpt, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS posts_content_text_trgm_idx
  ON posts USING GIN (lower(public.search_unaccent(COALESCE("contentText", ''))) gin_trgm_ops);
