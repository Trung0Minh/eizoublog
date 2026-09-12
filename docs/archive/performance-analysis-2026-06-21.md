# Performance Analysis Report

Last updated: 2026-06-21

This document records the performance work already implemented and the remaining optimization backlog for future passes. It is intentionally broad: not every item should be implemented immediately, but these are the practical areas worth considering if the site needs to get faster.

## Implemented Optimizations

### Reader Experience

- Public post pages no longer call `auth()` during server render.
  - Result: individual post pages can be SSG/ISR instead of fully request-time rendered.
  - Build confirmed `/[slug]` is SSG with a 5 minute revalidate window.
- `/about` and `/resources` no longer do request-time admin auth checks.
  - Result: both routes build as static pages.
  - Tradeoff: public-page inline admin editing for these pages is disabled.
- Public post edit controls moved to client-side session detection.
  - Result: readers do not wait on auth/session work before seeing the article.
- Comments now derive authenticated state client-side when needed.
  - Result: post page server render does not block on session lookup.
- Public list/sidebar queries now parallelize independent reads.
  - Post list + count run in parallel.
  - Sidebar categories + recent posts run in parallel.

### Writer Experience

- Added a shared client session cache for writer/admin navigation.
  - Result: `/api/auth/session` is fetched once and reused instead of refetching on every navigation.
- Writer navbar uses the cached client session helper.
  - Result: less network chatter during route changes.
- Autosave now skips clean drafts.
  - Result: no background PATCH when nothing changed.
- Draft-only autosaves no longer revalidate the public `posts` cache.
  - Result: writer typing does not flush public reader caches.
- Writer edit page fetches post data and editor reference data in parallel.
  - Result: faster initial editor load.
- Published post mutations now invalidate the affected public paths and admin/writer management paths.
  - Result: after publish, archive, restore, or delete, stale public post pages and management lists refresh without repeated manual reloads.
  - Draft-only autosaves still avoid public post cache invalidation.

### Admin Experience

- Admin layout passes the already-known session user into `AdminNav` and `WriterMenu`.
  - Result: admin pages avoid an extra `/api/auth/session` request after load.
- Admin analytics now uses a cached 60 second helper for stats + top pages.
  - Result: navigating to admin dashboard/analytics does not rerun aggregate analytics queries every time.
  - Tradeoff: analytics numbers may be up to 60 seconds stale.
- Admin events list data is cached for 60 seconds.
  - Result: event list, category options, and tag options are reused across admin navigations.
- Admin event detail uses a lightweight select for the admin UI.
  - Result: selected post `content` JSON is not loaded just to show id/title/status.
  - Full event content is still loaded for publish/regeneration paths where it is required.
- Admin event room reorder is optimistic and skips full page refresh on success.
  - Result: faster perceived response when moving event rooms.
  - Failure path rolls the order back.
- Admin post create/update/delete/archive/restore/bulk actions now use targeted post path revalidation.
  - Result: admin and writer changes show up consistently after mutations while preserving cached reader pages.
- Admin posts latest/oldest list queries now paginate before counting comments.
  - Result: `/admin/posts` avoids counting comments across the full filtered post set when comment count is not needed for sorting.
  - Comment sorting still counts before pagination because it needs comment counts for ordering.
- Admin posts table updates rows locally after successful delete/archive/restore/bulk actions instead of forcing `router.refresh()`.
  - Result: actions feel immediate, while server-side cache invalidation still keeps other routes fresh.

## Known Tradeoffs And Behavior Changes

- `/about` and `/resources` no longer support inline admin editing directly on the public page.
- Admin analytics is intentionally cached for 60 seconds.
- Admin event room reorder no longer refreshes the whole page after a successful move.
- Admin post row actions update the visible table locally; cross-page totals/count chips update on the next navigation or cache refresh.
- Admin routes remain dynamic because they must check admin auth.
- Reader routes are prioritized over admin routes for UX speed.

## Remaining Optimization Backlog

### Highest-Value Reader Work

- Make homepage faster.
  - Inspect why `/` is still dynamic.
  - Move any session-dependent UI to client-side session detection.
  - Cache homepage post feeds, featured sections, category/tag data, and sidebar data.
  - Consider ISR for the homepage with `revalidate` plus tag invalidation on publish/archive/delete.
- Make category and tag pages faster.
  - Build category/tag metadata and list data through cached helpers.
  - Avoid request-time auth/session work.
  - Consider static generation for popular category/tag routes if the route count is small.
- Make author profile pages faster.
  - Cache author lookup and author post list.
  - Avoid request-time session checks.
  - Consider ISR for public author pages.
- Make contributors page faster.
  - It is currently dynamic in build output.
  - Cache contributor data and remove any unnecessary request-time dependencies.
- Improve search result speed.
  - Confirm PostgreSQL full-text indexes are used.
  - Add query debouncing on the client if search happens while typing.
  - Cache stable search result pages for short TTLs where practical.
  - Keep `ts_headline` snippets server-generated and sanitized.
- Improve image performance.
  - Add the R2 domain to `next.config` and migrate important public images to `next/image`, or add an explicit image loader strategy.
  - Prioritize cover images, author avatars, and post cards.
  - Add correct width/height/aspect-ratio to reduce layout shift.
  - Generate thumbnails or responsive variants for R2 uploads.
- Reduce public page JavaScript.
  - Audit client components on reader pages.
  - Keep article rendering server-side/static.
  - Lazy-load non-critical widgets such as comments, lightbox, table of contents enhancements, and analytics tracker.

### Highest-Value Writer Work

- Optimize `/dashboard`.
  - Add pagination or limits if it loads every post for a writer.
  - Split heavy counts/notification data from first paint.
- Optimize `/dashboard/notifications`.
  - Fetch unread counts separately from full notification lists.
  - Add pagination.
  - Consider optimistic mark-read behavior.
- Optimize writer events pages.
  - Use lighter selects for event list/detail pages.
  - Avoid loading full post content unless the page renders or edits it.
  - Cache reference data shared with admin events.
- Optimize profile page.
  - Cache profile data with tag invalidation on save.
  - Lazy-load avatar upload UI only when the user interacts with it.
- Reduce editor initial bundle size.
  - Dynamically import Tiptap-heavy editor code behind the writer editor route.
  - Keep static preview/read-only rendering separate from full editor code.
  - Lazy-load media upload, gallery, and video modal controls.
  - Use route-level loading UI so navigation responds before the editor is fully hydrated.
- Improve autosave and save UX further.
  - Send minimal PATCH payloads when only small fields changed.
  - Coalesce rapid title/excerpt/content updates.
  - Avoid revalidating public caches until a draft becomes published or an already-published post changes.

### Highest-Value Admin Work

- Optimize admin comments.
  - Add optimistic local removal when marking spam.
  - Add pagination for spam/approved lists if not already enough.
  - Implement pending comments only when the backend supports it; current pending tab returns empty data.
- Optimize admin content manager.
  - Cache categories/tags through `lib/queries` instead of direct page Prisma calls.
  - Optimistically insert/update/delete category/tag rows after successful API calls.
  - Avoid full refresh if the changed item is present in local state.
- Optimize admin writers.
  - Paginate writers and pending invites if the team grows.
  - Optimistically remove/revoke writers after successful mutation.
  - Separate invite form from writer table refresh where possible.
- Optimize admin newsletter.
  - Cache active subscriber count and recent post options.
  - Do not load broadcast history until that UI exists.
  - For large subscriber counts, make broadcast sending a background job instead of a blocking request.
- Improve admin analytics further.
  - Store precomputed daily/monthly rollups only; never aggregate raw events for dashboard views.
  - Add a dedicated analytics cache tag only if manual invalidation is needed.
  - Add range selection that queries cached ranges rather than recomputing all metrics.
  - Consider materialized views if analytics tables grow large.
- Improve admin event detail further.
  - Split event metadata, rooms list, and publish controls into separate server/client boundaries.
  - Paginate or virtualize rooms if event participation grows.
  - Lazy-load selected post previews instead of including post data in the main event detail response.

### Data And Database Work

- Run `EXPLAIN ANALYZE` on slow Prisma/raw SQL queries in production-like data.
- Add or verify indexes for common filters:
  - `posts(status, publishedAt, updatedAt)`
  - `posts(authorId, status, updatedAt)`
  - `comments(postId, status, createdAt)`
  - `comments(status, createdAt)`
  - `award_events(createdAt, status)`
  - `award_event_rooms(eventId, order, updatedAt)`
  - `analytics_daily_summaries(day)`
  - `analytics_daily_pages(day, path)`
  - `newsletter_subscribers(status)`
  - `users(role, createdAt)`
- Keep Prisma `select` shapes explicit.
  - Avoid loading `content`, `contentText`, emails, or relation graphs unless a page needs them.
- Watch for N+1 patterns after adding new relation-heavy UI.
- Use transactions only where multi-step consistency is required.
- Avoid invalidating broad tags like `posts` for draft-only changes.

### Caching And Revalidation Work

- Audit every `unstable_cache` key.
  - Ensure function arguments are enough to distinguish cached values.
  - Keep tag sets narrow.
- Add cache helpers for any admin/public page still doing direct Prisma reads.
- Use TTLs based on user expectation:
  - Reader article/page data: 5 minutes is acceptable with tag invalidation on publish.
  - Writer/admin data: 30-60 seconds is usually acceptable.
  - Analytics: 60 seconds to 5 minutes is acceptable depending on UX.
- Prefer path/tag invalidation only when public user-visible data changes.

### Navigation And Prefetch Work

- Keep `prefetch={false}` on heavy authenticated/admin links unless there is evidence prefetch improves perceived UX.
- Consider prefetching lightweight public routes from reader navigation.
- Use route-level `loading.tsx` for slow dynamic writer/admin routes.
- Split large page data behind `Suspense` boundaries so the shell appears quickly.
- For menu destinations, make the first server response light and load secondary panels after navigation.

### Client-Side Bundle Work

- Run bundle analysis before large refactors.
- Keep Tiptap, media upload, image lightbox, and admin-only controls out of reader bundles.
- Lazy-load modal-heavy components.
- Avoid making server components client components just for small interactions.
- Deduplicate shared client utilities such as session loading, API error parsing, and mutation refresh helpers.

### API And Mutation Work

- Make non-critical writes fire-and-forget where safe.
  - Analytics already uses `after()`.
  - Email notification/broadcast flows may need queues/background jobs if they become slow.
- Return quickly from mutation endpoints when a background job can handle long work.
- Extend local UI updates to remaining admin/writer mutations that still depend on full refreshes.
- Keep API responses in the required `{ data: T }` / `{ error: string }` shape.

### Observability Work

- Add lightweight timing logs around slow server pages in development or behind an env flag.
- Track route navigation timings from the browser for:
  - `/`
  - `/[slug]`
  - `/category/[slug]`
  - `/tag/[slug]`
  - `/authors/[username]`
  - `/dashboard`
  - `/dashboard/edit/[id]`
  - `/admin`
  - `/admin/analytics`
  - `/admin/events`
- Record slow query timing in production logs.
- Compare cold navigation, warm navigation, and post-mutation refresh separately.

### Testing And Tooling Work

- Fix existing baseline test failures before relying on full-suite performance regression checks.
  - Missing test-only API route imports.
  - Comment API test mocks missing author email shape.
  - Upload tests expecting old image-only message.
  - Editor media upload MSW `/PUT` handler issues.
  - Analytics test `usePathname()` null case.
  - SEO title expectation mismatch.
- Fix existing lint blockers.
  - `check-columns.js` uses CommonJS `require()`.
- Add route performance smoke tests where possible.
  - Build output should keep `/[slug]`, `/about`, and `/resources` static/SSG.
  - Future tests can assert no `auth()` import returns to public static routes.

## Current Verification Notes

- Focused performance tests passed for reader/writer/admin changes.
- `npx tsc --noEmit` passed after the latest admin pass.
- `npm run build` passed after the latest admin pass.
- Changed-file ESLint passed for the latest admin pass.
- Full-project `npm run lint` still has unrelated baseline lint errors in test/support files and legacy scripts.
- Full `npm test` still fails because of unrelated baseline failures listed above.

## Recommended Future Order

1. Fix test/lint baseline so future performance work has cleaner safety signals.
2. Optimize homepage, author, contributors, category, and tag pages.
3. Optimize `/dashboard` and writer events.
4. Lazy-load editor-heavy code.
5. Add image optimization for R2-hosted covers/avatars.
6. Add database indexes after checking `EXPLAIN ANALYZE` on real slow queries.
7. Add optimistic UI for more admin/writer mutations.
8. Add route timing instrumentation so future speed work is measured, not guessed.
