# AGENTS.md

## Project Overview

This is an **invite-only anime analysis and review blog** built with Next.js 16 (App Router), React 19, Prisma, PostgreSQL (Supabase), Cloudflare R2, NextAuth.js v5, Tiptap, Resend, and Tailwind CSS + shadcn/ui.

Before writing code, inspect the current implementation and tests for the area
being changed. Historical planning documents are not authoritative.

---

## Sources of Truth

| Location | What it covers |
|---|---|
| `app/`, `components/`, `hooks/`, `lib/` | Current application behavior and architecture |
| `prisma/schema.prisma`, `prisma/migrations/` | Current database schema and migration history |
| `tests/` | Expected behavior and regression coverage |
| `app/globals.css`, `tailwind.config.ts` | Current design tokens and global styling |
| `performance_analysis_report.md` | Remaining performance work and completed optimization context |
| `.env.example` | Supported environment variables |

---

## Essential Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Database: create and apply a new migration
npx prisma migrate dev --name <migration_name>

# Database: apply existing migrations (e.g. after pulling new changes)
npx prisma migrate deploy

# Database: open Prisma Studio (visual DB browser)
npx prisma studio

# Database: seed with initial data
npx prisma db seed

# Generate Prisma client after schema changes
npx prisma generate

# Run unit + integration tests
npx vitest run

# Run tests in watch mode
npx vitest

# Run E2E tests (requires dev server running)
npx playwright test

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Architecture Rules

### Never violate these

1. **Inspect the current implementation and tests before changing behavior.** Preserve established API shapes, ownership boundaries, and user-facing behavior unless the task explicitly changes them.

2. **Never modify `prisma/schema.prisma` without running a migration immediately after.** Schema changes that are not migrated will break the app silently.

3. **Never use `any` in TypeScript.** Use `unknown` if the type is genuinely unknown.

4. **Never return `authorEmail` in any API response.** This field is private and must never be exposed to clients. Always use explicit `select` in Prisma queries to exclude it.

5. **Never render comment content via `dangerouslySetInnerHTML`.** Comments are plain text — render with `whitespace-pre-wrap`.

6. **The only exception to `dangerouslySetInnerHTML` is search snippets** from PostgreSQL `ts_headline` — this is safe because the HTML is server-generated and only contains `<mark>` tags.

7. **All API routes must return `{ data: T }` on success and `{ error: string }` on failure.** Never return raw objects or arrays at the top level.

8. **Never use `any` type — use `unknown` or create a proper interface.**

9. **Analytics must be first-party and fire-and-forget.** Tracking must never block page rendering or navigation.

10. **Test-only API routes (`/api/test/*`) must be guarded with `NODE_ENV === 'test'` check.** They must never be reachable in production.

11. **Next.js 16 request-time route values are asynchronous.** Page `params`,
    page `searchParams`, and route-handler `context.params` must be typed as
    `Promise<...>` and awaited before use.

12. **Use `proxy.ts`, not `middleware.ts`.** Next.js 16 deprecated the
    middleware file convention in favor of proxy.

---

## Project Conventions

### File naming
- Components: `PascalCase.tsx` (e.g. `PostCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g. `useAutosave.ts`)
- Utilities: `camelCase.ts` (e.g. `utils.ts`, `search.ts`)
- API routes: follow Next.js App Router convention (`route.ts`)

### Import aliases
All imports use the `@/` alias pointing to the project root:
```typescript
import { prisma } from '@/lib/prisma'
import { PostCard } from '@/components/posts/PostCard'
```

### API response format
```typescript
// Always return this shape:
Response.json({ data: result })           // success
Response.json({ error: 'message' }, { status: 4xx | 5xx })  // error
```

### Prisma queries
- Always use `select` to limit returned fields — never return entire records with sensitive fields
- Always wrap multi-step operations in `prisma.$transaction([])`
- Log errors with `console.error('[ROUTE_NAME]', error)` before returning 500

### Authentication in API routes
```typescript
const session = await auth()
if (!session) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Tailwind + shadcn/ui
- Use CSS variables defined in `globals.css` for colors — never hardcode hex values in components
- Use `cn()` from `lib/utils.ts` for conditional class merging
- Dark mode is handled via the `dark` class on `<html>` — always test both modes

---

## Environment Variables

All required environment variables are listed in `.env.example`. Copy to `.env.local` and fill in values before running the app.

**Never commit `.env.local` to git.**

Key variables and where they are used:

| Variable | Used in |
|---|---|
| `DATABASE_URL` | Prisma (pooled connection) |
| `DIRECT_URL` | Prisma migrations (Supabase direct) |
| `NEXTAUTH_SECRET` | NextAuth session signing |
| `NEXTAUTH_URL` | NextAuth redirect URLs |
| `RESEND_API_KEY` | Email sending (invites, comments, newsletter) |
| `RESEND_FROM_EMAIL` | Sender address for all emails |
| `R2_ACCOUNT_ID` | Cloudflare R2 file uploads |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 file uploads |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 file uploads |
| `R2_BUCKET_NAME` | Cloudflare R2 file uploads |
| `R2_PUBLIC_URL` | Public base URL for uploaded files |
| `NEXT_PUBLIC_APP_URL` | Canonical URL used in emails and SEO |
| `NEXT_PUBLIC_APP_NAME` | Blog name shown in UI and emails |
| `ANALYTICS_HASH_SALT` | Optional salt for anonymous analytics hashes; falls back to auth secret when blank |

---

## Database Notes

- Database is **PostgreSQL on Supabase**
- Use `DATABASE_URL` for the app (pooled via PgBouncer) and `DIRECT_URL` for migrations
- After any schema change: `npx prisma migrate dev --name <name>` then `npx prisma generate`
- The full-text search trigger is in a separate migration SQL file — do not delete it
- To verify the search trigger is active:
  ```sql
  SELECT tgname FROM pg_trigger WHERE tgrelid = 'posts'::regclass;
  ```
- Seed data (categories, tags, admin user) is in `prisma/seed.ts` — run with `npx prisma db seed`

---

## Common Mistakes to Avoid

- **Do not use the Pages Router.** This project uses the App Router exclusively. All pages go under `app/`, not `pages/`.
- **Do not use `useRouter` from `next/router`.** Use `next/navigation` instead.
- **Do not use `<img>` for cover images and avatars that are uploaded files.** Use a standard `<img>` tag with explicit width/height or Tailwind aspect-ratio classes. Do not use `next/image` for R2-hosted files unless the R2 domain is added to `next.config.mjs`.
- **Do not use `localStorage` or `sessionStorage`.** They are not available during SSR and will cause hydration errors.
- **Do not add `'use client'` to a component unless it genuinely needs browser APIs or React state/effects.** Prefer Server Components by default.
- **Do not import server-only modules (prisma, auth, resend) inside Client Components.** Keep data fetching in Server Components or API routes.
- **Do not write desktop-only styles and try to undo them on mobile.** Always write mobile-first base styles and override upward with `md:`, `lg:`, `xl:` prefixes.
- **Do not forget to wrap Tiptap editor components in `'use client'`** — Tiptap uses browser APIs and cannot run on the server.
- **Do not start autosave before the post has been created** (i.e. before the first manual save that returns a `postId`).

---

## External Services Setup (Manual Steps)

These must be completed manually before the app will work end-to-end. They cannot be automated by the agent:

1. **Supabase** — Create a project, copy `DATABASE_URL` and `DIRECT_URL`
2. **Cloudflare R2** — Create a bucket, enable public access, set CORS policy, copy credentials
3. **Resend** — Create an account, verify a sending domain, copy API key
4. **Vercel** — Connect GitHub repo, add all env variables from `.env.example`

Use each provider's current documentation for service-specific setup.

## Web UI/UX Agent Workflow

When working on this web project, use the available skills intentionally and in the right order.

### Available Skills

Use these skills when relevant:

* `ui-ux-pro-max`: for UX strategy, design system decisions, layout direction, color palette, font pairing, responsive patterns, and product-level UI decisions.
* `frontend-design`: for high-quality frontend implementation, visual hierarchy, spacing, typography, layout, component polish, and avoiding generic AI-looking interfaces.
* `taste-skill` / `gpt-taste`: for aesthetic refinement, premium visual polish, better composition, stronger design taste, and final UI improvements.
* `agent-browser`: for opening the app in a real browser, inspecting pages visually, clicking through flows, checking responsive behavior, and capturing screenshots when useful.
* `webapp-testing`: for Playwright/browser-based testing, UI behavior checks, screenshots, logs, console errors, and functional verification.

### Default Workflow for Web UI Tasks

For any meaningful web UI/UX task, follow this workflow:

1. Understand the product context.

   * Identify the target users.
   * Identify the main page goal.
   * Preserve the existing brand/style unless asked to redesign it.
   * Avoid applying a generic SaaS/dashboard look to every project.

2. Use `ui-ux-pro-max` for design direction.

   * Choose an appropriate layout system.
   * Define visual hierarchy.
   * Select suitable spacing, typography, color, and component patterns.
   * Consider desktop, tablet, and mobile from the start.

3. Use `frontend-design` for implementation.

   * Build clean, responsive, production-quality UI.
   * Improve layout, alignment, spacing, typography, cards, navigation, buttons, forms, and states.
   * Keep components reusable and consistent.
   * Avoid random gradients, excessive animations, and decorative clutter unless they fit the product.

4. Use `taste-skill` / `gpt-taste` for polish.

   * Make the UI feel distinctive and intentional.
   * Improve composition, rhythm, balance, contrast, and visual refinement.
   * Remove generic AI-generated design patterns.
   * Make the result feel finished, not just functional.

5. Use `agent-browser` to inspect the actual app.

   * Open the deployed URL or local dev server.
   * Check desktop layout.
   * Check mobile layout.
   * Click main navigation, CTAs, forms, menus, links, and important flows.
   * Look for broken layout, overflow, unreadable text, bad spacing, broken images, and interaction issues.

6. Use `webapp-testing` when behavior or regression testing is needed.

   * Use browser testing or Playwright-style checks.
   * Inspect console errors and runtime issues.
   * Capture screenshots when useful.
   * Verify main user flows before finalizing.

7. Fix issues before responding.

   * Do not stop after implementation only.
   * Re-open or re-test the changed UI when possible.
   * Prioritize user-visible bugs first.
   * Summarize what changed and what was tested.

### Browser Launch Note

On this Linux machine, if `agent-browser` fails because of a Chrome sandbox issue, run:

```bash
agent-browser close
agent-browser open <url> --args "--no-sandbox --disable-dev-shm-usage"
```

If a daemon is already running and arguments are ignored, close it first:

```bash
agent-browser close
```

Then reopen with the required args.

### When to Use Each Skill

For a full redesign:

Use:

* `ui-ux-pro-max`
* `frontend-design`
* `taste-skill` / `gpt-taste`
* `agent-browser`
* `webapp-testing`

For small visual polish:

Use:

* `frontend-design`
* `taste-skill` / `gpt-taste`

For design system or UX direction:

Use:

* `ui-ux-pro-max`

For checking the actual web app:

Use:

* `agent-browser`
* `webapp-testing`

For debugging UI behavior:

Use:

* `webapp-testing`
* `agent-browser`

### Quality Checklist

Before finishing, check:

* The page has a clear visual hierarchy.
* Typography is readable and consistent.
* Spacing is intentional and consistent.
* Buttons, links, cards, forms, and navigation look polished.
* The layout works on mobile, tablet, and desktop.
* There is no unwanted horizontal scrolling.
* Main interactions work.
* Hover, focus, active, disabled, loading, empty, and error states are handled when relevant.
* There are no obvious console/runtime errors.
* The UI does not look generic or template-like.
* The final result matches the product’s identity.

### Prompt Template

Use this prompt when asking the agent to improve a web app:

Use ui-ux-pro-max for UX and design-system decisions.
Use frontend-design and taste-skill/gpt-taste for visual polish and frontend implementation quality.
Use agent-browser and webapp-testing to verify the result in a real browser.

Improve this web app/page with strong visual hierarchy, polished spacing, better typography, responsive layout, clean interactions, and a distinctive non-generic design.

After implementation, open the app in the browser, test desktop and mobile layouts, click the main navigation/CTA/interactions, check console errors, fix visible issues, and summarize what changed and what was tested.

On this Linux machine, if agent-browser has Chrome sandbox issues, run:
agent-browser close
agent-browser open <url> --args "--no-sandbox --disable-dev-shm-usage"
