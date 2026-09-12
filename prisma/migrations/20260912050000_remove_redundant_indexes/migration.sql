-- Unique B-tree indexes already support these single-column lookups.
-- Refuse to remove an index if a database has diverged from the expected pair.
DO $$
DECLARE
  index_name text;
  redundant_oid regclass;
  unique_oid regclass;
BEGIN
  FOREACH index_name IN ARRAY ARRAY[
    'users_username', 'invites_token', 'posts_slug', 'categories_slug',
    'tags_slug', 'newsletter_subscribers_email', 'newsletter_subscribers_token',
    'analytics_daily_summaries_day'
  ] LOOP
    redundant_oid := to_regclass('public.' || index_name || '_idx');
    unique_oid := to_regclass('public.' || index_name || '_key');
    IF redundant_oid IS NULL THEN CONTINUE; END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM pg_index redundant
      JOIN pg_index retained ON retained.indexrelid = unique_oid
      JOIN pg_class redundant_class ON redundant_class.oid = redundant.indexrelid
      JOIN pg_class retained_class ON retained_class.oid = retained.indexrelid
      WHERE redundant.indexrelid = redundant_oid
        AND NOT redundant.indisunique
        AND retained.indisunique AND retained.indisvalid AND retained.indisready
        AND redundant.indrelid = retained.indrelid
        AND redundant.indnatts = retained.indnatts
        AND redundant.indnkeyatts = retained.indnkeyatts
        AND redundant.indkey = retained.indkey
        AND redundant.indclass = retained.indclass
        AND redundant.indcollation = retained.indcollation
        AND redundant.indoption = retained.indoption
        AND redundant_class.relam = retained_class.relam
        AND redundant.indexprs IS NULL AND retained.indexprs IS NULL
        AND redundant.indpred IS NULL AND retained.indpred IS NULL
    ) THEN
      RAISE EXCEPTION 'Unexpected index definition for %; refusing redundant-index cleanup', index_name;
    END IF;
    EXECUTE format('DROP INDEX public.%I', index_name || '_idx');
  END LOOP;
END $$;
