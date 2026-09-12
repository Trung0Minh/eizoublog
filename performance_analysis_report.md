# Current Performance Findings

Updated: 2026-09-12. Existing appearance, animations and available features are
preserved. The [June report](docs/archive/performance-analysis-2026-06-21.md) is
archived verbatim; its SSG and disabled-inline-editing claims are obsolete.

## Current Behavior

- Public routes render at request time where cookies/appearance require it.
  Production home, resources and article responses use private/no-store headers.
  A `revalidate` export alone does not establish shared HTML caching.
- Public lists, taxonomy, authors, sidebar and search already use cached helpers.
  Homepage list, sidebar and carousel reads start together.
- Public inline admin editing is available. The resources catalog and shared
  logo rendering are separated from the editor component; its behavior remains.
- Article bodies use the static rich-text renderer. Hero props contain only
  required fields, and heading records are computed server-side.
- Autosave generation checks, save queues, local recovery, revisions, media
  cleanup and backup/restore workflows remain active. See
  [post durability](POST_DURABILITY.md).

## Verified Changes

Measurements use disposable local PostgreSQL and production Chromium with
synthetic data. They are not field Web Vitals or production latency guarantees.

| Change | Evidence and limits |
| --- | --- |
| Seasonal WebP backgrounds | Eight originals: 8,748,872 -> 2,134,836 bytes (-75.6%); originals retained. No measured LCP improvement in the shared-cover fixture. |
| Custom background resource reuse | Preload/display use the same resource URL while crop metadata remains available. |
| Article client props | HTML plus streamed RSC: ordinary 39,938 -> 36,644 bytes; large 228,724 -> 152,099 bytes. |
| Responsive TOC tracking | Only the visible layout measures headings; scroll trace reads 176 -> 88. Existing presentations remain. |
| Carousel priorities | Only the selected slide has high priority; eager loading, autoplay and controls remain. No byte/latency gain claimed. |
| Editor feedback | Reuses already-normalized emitted JSON; one duplicate full-document pass removed. Typing traces do not establish a latency gain. |
| Comment outbox | Simulated 500 ms provider: handler response 506.531 -> 27.222 ms. Comment and jobs commit together; delivery follows the response. |
| Bundled resource logos | Combined 613,228 -> 341,684 bytes (-44.3%); dimensions and original URLs retained. Browser scaling differs by at most one color-channel level. |
| Notification refreshes | A five-request overlap scenario becomes one active request and one follow-up; five-second freshness is preserved. |
| Redundant database indexes | Eight plain indexes removed through a guarded migration; matching unique indexes retained. Disposable-data storage reduction: 122,880 bytes. |
| Shared list SQL | Identical SQL, parameters and results across 30 sort/filter/page cases after extraction. Maintainability improvement only. |

Lazy command-menu/lightbox loading was trialed and reverted: small JavaScript
savings added roughly 300 ms to first opening on the throttled test connection.
Keeping eager loading preserves immediate interaction responsiveness.

## Remaining Conditional Work

- Hybrid search: existing trigram indexes do not make every word-similarity
  predicate indexable. Small-corpus query calls took 76-146 ms. Any rewrite
  requires representative data and exact matching/ranking/snippet parity.
- Writer histories: all accessible posts remain reachable. Pagination requires
  realistic large-history evidence and review of navigation changes; a bare
  query limit would remove access to posts.
- Uploaded media: responsive variants require storage/backfill, old-URL and
  crop/rotation/animation compatibility. R2 originals remain unchanged.
- Editor and resource admin boundaries: further splitting needs evidence of
  useful download/runtime savings without delaying interactions.
- Field performance: no production RUM/Core Web Vitals instrumentation was added.
  Synthetic event timing is not field INP; broader speed claims remain unproven.

## Operations And Review

Apply new migrations before releasing the changed code. The comment outbox
requires the server database connection and existing cron authentication.
Daily recovery can be delayed on quiet sites; expired/failed deliveries need
provider reconciliation before manual retry. See [README](README.md#comment-email-delivery).
The implementation/test pass used a disposable database. On 2026-09-12, the
user separately authorized applying the outbox and redundant-index migrations
to production Supabase. All 43 migrations are applied; queue privacy and
retained unique indexes were verified. The pre-existing malformed initial
migration checksum remains unchanged. No R2 object or application deployment
was changed by that step.

The temporary checkpoint report and reproducible measurements are under
`tmp/cleanup-optimization-audit.md` and `tmp/`. Keep them for the planned review,
then remove or archive the temporary artifacts intentionally. Dependencies,
build caches, migration history, credentials and agent/provider configuration
are not obsolete source files.
