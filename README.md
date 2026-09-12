# Anime Blog

An invite-only editorial publication for long-form anime analysis, interviews,
and reviews.

## Stack

- Next.js 16 App Router with React 19 and TypeScript
- Tailwind CSS and shadcn/ui
- Prisma with PostgreSQL on Supabase
- Auth.js, Tiptap, Cloudflare R2, Resend, and first-party analytics
- Vitest and Playwright

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

External-service credentials are required before database, authentication,
media upload, email, analytics, and deployment flows work end to end.

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

The current implementation, Prisma schema and migrations, automated tests, and
[`performance_analysis_report.md`](performance_analysis_report.md) are the
sources of truth for ongoing work.

## Comment Email Delivery

Apply migrations with `npx prisma migrate deploy` before running a release that
uses the comment outbox. A comment and its notification jobs are saved in one
transaction. Next.js `after()` starts delivery after the response; subsequent
comments and the existing authenticated `/api/cron/newsletter` job also drain
pending deliveries. Keep `CRON_SECRET` configured. The current cron is daily,
so recovery after an interrupted worker can be delayed on a quiet site.

`comment_email_deliveries` is server-only and contains private email payloads.
Workers claim up to 250 jobs per invocation, recover abandoned 15-minute claims,
and allow three attempts with backoff. Provider idempotency keys protect retries.
Attempts older than 23 hours are held as `FAILED` and logged for manual review
because Resend's idempotency window is 24 hours. Check failed rows using the
server database connection and reconcile them with provider delivery records
before retrying; blindly resetting old jobs can send duplicate notifications.
