-- Pin object resolution so a malicious schema cannot shadow objects used by the trigger.
ALTER FUNCTION public.capture_post_recovery_revision()
SET search_path = pg_catalog, public;
