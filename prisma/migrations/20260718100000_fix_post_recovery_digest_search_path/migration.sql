-- Supabase installs pgcrypto in the extensions schema. Keep lookup pinned to
-- trusted schemas while allowing the recovery trigger to resolve digest().
ALTER FUNCTION public.capture_post_recovery_revision()
SET search_path = pg_catalog, extensions, public;
