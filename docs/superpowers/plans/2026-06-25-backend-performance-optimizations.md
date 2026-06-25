# Backend Performance Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce request-time database work and write amplification while adding durable asynchronous newsletter delivery without changing the site's visual UI.

**Architecture:** Cache the global background settings read, split published-list SQL into count-before-pagination and comment-sort paths, compare PostgreSQL enum columns directly, omit raw page-view analytics rows while retaining aggregates, and add a PostgreSQL newsletter queue processed by an idempotent worker and protected cron route.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 6, PostgreSQL, Vitest, Resend, Vercel Cron

---

### Task 1: Cache background settings

**Files:**
- Modify: `lib/backgrounds.ts`
- Modify: `app/api/admin/settings/backgrounds/route.ts`
- Create: `tests/unit/backgrounds.test.ts`
- Modify: `tests/unit/background-settings-access.test.ts`

- [ ] Write a failing unit test that mocks `unstable_cache`, calls `getCustomBackgrounds()`, and expects cache key `["custom-backgrounds"]`, five-minute revalidation, and tag `["backgrounds"]`.
- [ ] Run `npx vitest run tests/unit/backgrounds.test.ts` and confirm the cache expectation fails.
- [ ] Wrap the existing explicit `sitePage.findUnique` query with `unstable_cache`.
- [ ] Add a failing route test expecting a successful settings update to call `revalidateTag("backgrounds", "max")`.
- [ ] Run the route test and confirm it fails because no tag is invalidated.
- [ ] Invalidate the background cache tag after a successful upsert.
- [ ] Run both focused background test files and confirm they pass.

### Task 2: Optimize published-list SQL and enum comparisons

**Files:**
- Modify: `lib/queries.ts`
- Modify: `lib/notifications.ts`
- Modify: `tests/unit/queries.test.ts`
- Modify: `tests/unit/notifications.test.ts`

- [ ] Add failing SQL-shape tests asserting latest/oldest post queries paginate before comment counting and that comment-sorted queries retain pre-pagination counts.
- [ ] Add failing tests asserting hot `WHERE` clauses do not compare enum columns through `::text`.
- [ ] Run the focused query and notification tests and confirm the new assertions fail.
- [ ] Split `getPublishedPostListBySql` into an ordinary pagination path and a comment-sort path while preserving its return shape.
- [ ] Replace enum-column text comparisons with direct enum comparisons, casting dynamic parameters to the corresponding PostgreSQL enum type.
- [ ] Keep enum-to-text casts only in result projections that TypeScript parses.
- [ ] Run the focused query and notification tests and confirm they pass.

### Task 3: Reduce analytics raw writes

**Files:**
- Modify: `lib/internalAnalytics.ts`
- Modify: `tests/unit/internal-analytics.test.ts` or the existing analytics unit test containing `recordAnalyticsEvent`

- [ ] Add a failing test that records a `PAGE_VIEW` and expects no `analyticsEvent.create`, while still expecting visitor/session uniqueness and daily aggregate writes.
- [ ] Add a control test confirming a `POST_READ` still creates a raw analytics row.
- [ ] Run the focused analytics test and confirm the page-view assertion fails.
- [ ] Guard the raw event insert so it runs only for non-page-view event types.
- [ ] Run the focused analytics tests and confirm they pass.

### Task 4: Add the durable newsletter queue schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260625xxxxxx_add_newsletter_broadcast_queue/migration.sql`
- Modify: `tests/unit/prisma-schema.test.ts`

- [ ] Add failing schema tests for `NewsletterBroadcast`, `NewsletterBroadcastRecipient`, queue enums, relations, unique recipient constraint, and worker indexes.
- [ ] Run `npx vitest run tests/unit/prisma-schema.test.ts` and confirm the new expectations fail.
- [ ] Add the Prisma models, enums, and subscriber relation.
- [ ] Immediately create the matching SQL migration, including RLS enablement for both new tables.
- [ ] Run `npx prisma generate`.
- [ ] Run the schema test and confirm it passes.

### Task 5: Implement queue enqueueing and worker processing

**Files:**
- Create: `lib/newsletterQueue.ts`
- Modify: `app/api/newsletter/broadcast/route.ts`
- Modify: `tests/integration/newsletter.test.ts`
- Create: `tests/unit/newsletter-queue.test.ts`

- [ ] Replace the old broadcast integration expectation with a failing test that expects a single transaction to create a broadcast and recipient snapshots, returns HTTP 202, and does not call Resend inline.
- [ ] Add failing worker tests for claiming pending/stale recipients, successful delivery, retries, terminal failure, and aggregate reconciliation.
- [ ] Run both focused newsletter tests and confirm they fail.
- [ ] Implement `enqueueNewsletterBroadcast()` with an atomic transaction and immutable content/recipient snapshots.
- [ ] Implement `processNewsletterQueue()` using `FOR UPDATE SKIP LOCKED`, bounded claims, three attempts, claim expiry, recipient state transitions, and aggregate reconciliation.
- [ ] Change the broadcast route to enqueue and schedule immediate processing with `after()`.
- [ ] Run both focused newsletter tests and confirm they pass.

### Task 6: Add cron recovery and environment configuration

**Files:**
- Create: `app/api/cron/newsletter/route.ts`
- Create: `tests/integration/newsletter-cron.test.ts`
- Modify: `.env.example`
- Modify: `vercel.json`

- [ ] Add failing route tests for missing/incorrect `CRON_SECRET`, valid authorization, and worker failure handling.
- [ ] Run the cron test and confirm it fails because the route does not exist.
- [ ] Add the protected GET route using `Authorization: Bearer ${CRON_SECRET}`.
- [ ] Add `CRON_SECRET` to `.env.example`.
- [ ] Add a daily `/api/cron/newsletter` schedule to `vercel.json`.
- [ ] Run the focused cron test and confirm it passes.

### Task 7: Preserve the newsletter form while reflecting queue semantics

**Files:**
- Modify: `components/admin/NewsletterBroadcastForm.tsx`
- Modify: `tests/unit/newsletter-ui.test.tsx`

- [ ] Add a failing UI test expecting the existing form to parse `{ queued, total }` and render `Queued for X of Y subscribers`.
- [ ] Run the focused UI test and confirm it fails.
- [ ] Update only the response type/parser and status text; preserve markup structure, styling, fields, confirmation, and interactions.
- [ ] Run the focused UI test and confirm it passes.

### Task 8: Final verification

**Files:**
- Modify only if verification exposes defects in files already in scope.

- [ ] Run all focused tests changed by this plan.
- [ ] Run `npx prisma validate`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run ESLint against changed TypeScript/TSX files.
- [ ] Run `npm run build` and verify the route table includes `/api/cron/newsletter`.
- [ ] Run `git diff --check` and review `git status --short`.
