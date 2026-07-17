# Post Durability Operations

The application protects ordinary editing mistakes with local recovery, optimistic version checks, and post revisions. Production still needs the external backup workflow configured before hard deletion is enabled.

## Required secrets and settings

- Configure `DATABASE_CAPACITY_BYTES` from the production Supabase quota.
- Create a private R2 backup bucket and credentials separate from the production media credentials.
- Add the backup workflow secrets: `DIRECT_URL`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_BACKUP_BUCKET_NAME`, `R2_BACKUP_ACCESS_KEY_ID`, `R2_BACKUP_SECRET_ACCESS_KEY`, and `BACKUP_AGE_RECIPIENT`.
- Store the matching age private key in a protected secret and in two offline locations.
- Configure R2 lifecycle rules for `six-hourly/` (14 days), `daily/` (90 days), and `monthly/` (one year). Do not configure deletion for `media/` until a manual review confirms no retained backup needs it.
- Keep `POST_HARD_DELETE_ENABLED=false` until one backup and one restore drill succeed.

## Restore drill

Download the newest encrypted dump, decrypt it with the protected age identity, and restore it into an isolated PostgreSQL instance with `pg_restore`. Verify the `posts` table, post counts, sampled post checksums, and referenced media objects before treating the backup as usable.

## Incident response

1. Keep the editor open and use `Download recovery copy` if saving is failing.
2. Review the admin durability banner and the latest backup manifest.
3. Do not purge removed posts while durability status is `UNKNOWN`, `WARNING`, or `CRITICAL`.
4. For an accidental edit, use Post history and restore a protected version.
5. For a deleted post, recover the latest encrypted database dump or deletion-guard revision before attempting any cleanup.
