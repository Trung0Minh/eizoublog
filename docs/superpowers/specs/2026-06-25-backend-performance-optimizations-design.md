# Backend Performance Optimizations Design

## Scope

Implement the five approved performance changes while preserving the existing
visual design, animation system, effects, page structure, and editor behavior:

1. Cache global background settings.
2. Avoid counting comments across an entire result set before pagination.
3. Remove index-hostile PostgreSQL enum-column casts.
4. Reduce analytics write amplification.
5. Replace blocking newsletter delivery with a durable queue.

The newsletter form keeps its current layout and styling. Its success copy will
change from “Sent to X” to “Queued for X” because delivery becomes asynchronous.

## Cached Background Settings

`getCustomBackgrounds()` will become an `unstable_cache` helper with a dedicated
`backgrounds` cache tag and a five-minute fallback TTL. The background settings
mutation route will invalidate that tag after a successful update.

The root layout and `DynamicBackground` interface remain unchanged. This removes
the unconditional settings query from most requests without changing which
background is displayed.

## Published Post List Query

Latest and oldest list queries will:

1. Filter and count matching posts without joining comment counts.
2. Apply ordering and pagination.
3. Count comments only for the resulting page.
4. Load author, category, co-author, and tag data only for that page.

Comment-sorted queries must still calculate counts before pagination because the
count is the sort key. Both paths will retain the current return type and API
behavior.

## PostgreSQL Enum Comparisons

Raw SQL filters will compare enum columns directly:

```sql
p.status = 'PUBLISHED'
```

Dynamic parameters will cast the parameter rather than the indexed column:

```sql
p.status = ${status}::"PostStatus"
```

Text casts used only to serialize enum values into JavaScript-compatible query
results will remain. Tests will assert that hot `WHERE` clauses no longer contain
`column::text` comparisons.

## Analytics Write Reduction

Daily summary, daily page, visitor, and session aggregates remain authoritative
for dashboards. Routine `PAGE_VIEW` events will no longer create a raw
`analytics_events` row.

Raw rows remain for:

- post reads;
- searches;
- comments;
- newsletter subscriptions.

This reduces the common page-view transaction by one insert while preserving
all existing aggregate metrics. The rest of the transaction and API response
remain unchanged.

## Durable Newsletter Queue

### Data model

Add:

- `NewsletterBroadcast`: immutable message snapshot, aggregate status and counts.
- `NewsletterBroadcastRecipient`: recipient snapshot, attempt count, delivery
  status, error, claim timestamp, and sent timestamp.

Recipient records have a unique `(broadcastId, subscriberId)` key. Queue state
is stored in PostgreSQL, so process termination cannot lose accepted work.

### Enqueue flow

The admin broadcast endpoint will:

1. Validate the request and featured post.
2. Read active subscribers.
3. Create the broadcast and recipient snapshots in one transaction.
4. Schedule a best-effort immediate queue drain with Next.js `after()`.
5. Return `202` with `{ broadcastId, queued, total }`.

No email is sent inside the request lifecycle.

### Worker flow

`processNewsletterQueue()` will claim a small batch using PostgreSQL row locking
with `FOR UPDATE SKIP LOCKED`. Claims expire, allowing another invocation to
recover recipients from a terminated worker.

Each recipient:

- is sent at most once after reaching `SENT`;
- is retried up to three times;
- records a bounded error message on failure;
- transitions to `FAILED` after the final attempt.

Broadcast aggregate counts and status are reconciled from recipient state after
each batch. Concurrent or duplicate worker invocations are safe.

### Worker invocation

Add a protected `GET /api/cron/newsletter` route. It validates
`Authorization: Bearer ${CRON_SECRET}`. `vercel.json` invokes it once daily,
which works on all Vercel plans and acts as recovery for missed immediate
processing. The enqueue route's `after()` callback starts processing
immediately under normal operation.

The official Vercel Cron contract automatically supplies the bearer header when
`CRON_SECRET` is configured. Cron delivery can be missed or duplicated, so the
worker is reconciliation-based and idempotent.

## Error Handling

- Enqueue failure returns the existing `{ error: string }` format and creates no
  partial broadcast.
- Individual email failures do not fail the entire batch.
- Worker authorization failures return 401.
- Worker route failures are logged and return 500 for observability.
- Missing `CRON_SECRET` denies cron access rather than leaving the route open.

## Database Migration

The Prisma schema change will be accompanied immediately by a migration that
creates both tables, enums, foreign keys, indexes, unique constraints, and
enables row-level security for the new public-schema tables.

## Verification

Add or update tests for:

- background caching and invalidation;
- latest/oldest query pagination before comment counting;
- comment sorting behavior;
- direct enum comparisons;
- raw analytics page-view suppression with aggregates preserved;
- atomic newsletter enqueue;
- worker authorization;
- recipient claiming, retry, completion, and duplicate-run safety.

Run focused Vitest suites, Prisma generation, type checking, linting for changed
files, and a production build.
