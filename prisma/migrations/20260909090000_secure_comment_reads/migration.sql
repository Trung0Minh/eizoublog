-- Read receipts are accessed only through the server's Prisma connection.
ALTER TABLE public.comment_reads ENABLE ROW LEVEL SECURITY;

-- RLS does not cover privileges such as TRUNCATE; public API roles need no access.
REVOKE ALL PRIVILEGES ON TABLE public.comment_reads FROM PUBLIC, anon, authenticated;
