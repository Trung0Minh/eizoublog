import { createHash } from "node:crypto"
import type { AnalyticsEventType, Prisma, Role } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export type AnalyticsEventData = Record<string, number | string>

export type AnalyticsEventName =
  | "comment_submitted"
  | "newsletter_subscribed"
  | "page_view"
  | "post_read"
  | "search"

export interface AnalyticsMetric {
  prev: number
  value: number
}

export interface InternalAnalyticsStats {
  comments: AnalyticsMetric
  newsletterSignups: AnalyticsMetric
  pageviews: AnalyticsMetric
  reads: AnalyticsMetric
  searches: AnalyticsMetric
  totalReadSeconds: AnalyticsMetric
  visitors: AnalyticsMetric
  visits: AnalyticsMetric
}

export interface InternalTopPage {
  comments: number
  lastViewedAt: Date | null
  path: string
  postSlug: string | null
  readRate: number
  reads: number
  views: number
}

export interface PostAnalytics {
  comments: number
  lastViewedAt: Date | null
  readRate: number
  reads: number
  views: number
}

interface RecordAnalyticsEventInput {
  data?: AnalyticsEventData
  eventName: string
  occurredAt?: Date
  path?: null | string
  sessionHash?: null | string
  visitorHash?: null | string
}

const EVENT_NAME_TO_TYPE = {
  comment_submitted: "COMMENT_SUBMITTED",
  newsletter_subscribed: "NEWSLETTER_SUBSCRIBED",
  page_view: "PAGE_VIEW",
  post_read: "POST_READ",
  search: "SEARCH_PERFORMED",
} satisfies Record<AnalyticsEventName, AnalyticsEventType>

const AUTH_AND_PRIVATE_PREFIXES = [
  "/_next",
  "/admin",
  "/api",
  "/dashboard",
  "/forgot-password",
  "/invite",
  "/login",
  "/reset-password",
]

const NON_POST_SINGLE_SEGMENTS = new Set([
  "about",
  "authors",
  "category",
  "contributors",
  "favicon.ico",
  "robots.txt",
  "search",
  "sitemap.xml",
  "tag",
  "unsubscribe",
])

function getEventType(eventName: string): AnalyticsEventType | null {
  return eventName in EVENT_NAME_TO_TYPE
    ? EVENT_NAME_TO_TYPE[eventName as AnalyticsEventName]
    : null
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function getHashSalt() {
  return (
    process.env.ANALYTICS_HASH_SALT ??
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET ??
    "development-analytics-salt"
  )
}

function getDayKey(date: Date) {
  return startOfUtcDay(date).toISOString().slice(0, 10)
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? ""
  }

  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    ""
  )
}

function normalizePath(path: null | string | undefined) {
  if (!path) {
    return null
  }

  try {
    const parsed = path.startsWith("http")
      ? new URL(path)
      : new URL(path, "https://analytics.local")
    const normalized = parsed.pathname || "/"
    return normalized.length > 1
      ? normalized.replace(/\/+$/, "").slice(0, 2048)
      : normalized
  } catch {
    const normalized = path.split("?")[0]?.split("#")[0]?.trim() ?? ""
    if (!normalized) {
      return null
    }

    const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`
    return withSlash.length > 1
      ? withSlash.replace(/\/+$/, "").slice(0, 2048)
      : withSlash
  }
}

function normalizeSlug(value: null | string | undefined) {
  const slug = value?.trim().replace(/^\/+|\/+$/g, "")
  return slug ? slug.slice(0, 200) : null
}

function normalizeDataValue(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  return null
}

function getDataString(data: AnalyticsEventData | undefined, key: string) {
  if (!data || !(key in data)) {
    return null
  }

  return normalizeDataValue(data[key])
}

function getDataNumber(data: AnalyticsEventData | undefined, key: string) {
  if (!data || !(key in data)) {
    return null
  }

  const value = data[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function inferPostSlug(path: null | string) {
  if (!path || path === "/") {
    return null
  }

  const segments = path.split("/").filter(Boolean)
  if (segments.length !== 1) {
    return null
  }

  const [slug] = segments
  if (!slug || NON_POST_SINGLE_SEGMENTS.has(slug)) {
    return null
  }

  return normalizeSlug(slug)
}

function getReadDurationSeconds(
  data: AnalyticsEventData | undefined,
  type: AnalyticsEventType,
) {
  if (type !== "POST_READ") {
    return null
  }

  const value = getDataNumber(data, "durationSeconds") ?? 30
  return Math.max(1, Math.min(Math.round(value), 24 * 60 * 60))
}

function getSearchQuery(data: AnalyticsEventData | undefined) {
  const query = getDataString(data, "query")
  return query ? query.slice(0, 200) : null
}

function getReadRate(reads: number, views: number) {
  if (views <= 0) {
    return 0
  }

  return Math.round((reads / views) * 100)
}

function getRange(startAt: number, endAt: number) {
  const start = startOfUtcDay(new Date(startAt))
  const end = startOfUtcDay(new Date(endAt))
  const duration = Math.max(1, endAt - startAt)
  const previousStart = startOfUtcDay(new Date(startAt - duration))
  const previousEnd = startOfUtcDay(new Date(startAt - 1))

  return { end, previousEnd, previousStart, start }
}

function sumSummaries(
  rows: Array<{
    comments: number
    newsletterSignups: number
    pageviews: number
    reads: number
    searches: number
    sessions: number
    totalReadSeconds: number
    visitors: number
  }>,
) {
  return rows.reduce(
    (total, row) => ({
      comments: total.comments + row.comments,
      newsletterSignups: total.newsletterSignups + row.newsletterSignups,
      pageviews: total.pageviews + row.pageviews,
      reads: total.reads + row.reads,
      searches: total.searches + row.searches,
      sessions: total.sessions + row.sessions,
      totalReadSeconds: total.totalReadSeconds + row.totalReadSeconds,
      visitors: total.visitors + row.visitors,
    }),
    {
      comments: 0,
      newsletterSignups: 0,
      pageviews: 0,
      reads: 0,
      searches: 0,
      sessions: 0,
      totalReadSeconds: 0,
      visitors: 0,
    },
  )
}

function metric(value: number, prev: number): AnalyticsMetric {
  return { prev, value }
}

function getSummaryCounts(
  type: AnalyticsEventType,
  visitorCount: number,
  sessionCount: number,
  durationSeconds: number | null,
) {
  return {
    comments: type === "COMMENT_SUBMITTED" ? 1 : 0,
    newsletterSignups: type === "NEWSLETTER_SUBSCRIBED" ? 1 : 0,
    pageviews: type === "PAGE_VIEW" ? 1 : 0,
    reads: type === "POST_READ" ? 1 : 0,
    searches: type === "SEARCH_PERFORMED" ? 1 : 0,
    sessions: sessionCount,
    totalReadSeconds: durationSeconds ?? 0,
    visitors: visitorCount,
  }
}

function getPageCounts(type: AnalyticsEventType) {
  return {
    comments: type === "COMMENT_SUBMITTED" ? 1 : 0,
    pageviews: type === "PAGE_VIEW" ? 1 : 0,
    reads: type === "POST_READ" ? 1 : 0,
  }
}

async function createUniqueVisitorAndSession(
  tx: Prisma.TransactionClient,
  input: {
    day: Date
    sessionHash: null | string
    visitorHash: null | string
  },
) {
  const [visitorResult, sessionResult] = await Promise.all([
    input.visitorHash
      ? tx.analyticsDailyVisitor.createMany({
          data: [{ day: input.day, visitorHash: input.visitorHash }],
          skipDuplicates: true,
        })
      : Promise.resolve({ count: 0 }),
    input.sessionHash
      ? tx.analyticsDailySession.createMany({
          data: [{ day: input.day, sessionHash: input.sessionHash }],
          skipDuplicates: true,
        })
      : Promise.resolve({ count: 0 }),
  ])

  return {
    sessionCount: sessionResult.count,
    visitorCount: visitorResult.count,
  }
}

export function createVisitorHash(request: Request, occurredAt = new Date()) {
  const dayKey = getDayKey(occurredAt)
  const ip = getClientIp(request)
  const userAgent = request.headers.get("user-agent") ?? ""

  return hashValue(`${getHashSalt()}:visitor:${dayKey}:${ip}:${userAgent}`)
}

export function createSessionHash(
  sessionId: null | string | undefined,
  visitorHash: string,
  occurredAt = new Date(),
) {
  const dayKey = getDayKey(occurredAt)
  const source = sessionId?.trim() ? sessionId.trim() : visitorHash

  return hashValue(`${getHashSalt()}:session:${dayKey}:${source}`)
}

export function shouldIgnoreAnalyticsPath(path: null | string | undefined) {
  const normalized = normalizePath(path)
  if (!normalized) {
    return false
  }

  return AUTH_AND_PRIVATE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}

export function shouldIgnoreAnalyticsRole(role: Role | string | undefined) {
  return role === "ADMIN" || role === "WRITER" || role === "REVOKED"
}

export async function recordAnalyticsEvent(input: RecordAnalyticsEventInput) {
  const type = getEventType(input.eventName)
  if (!type) {
    return { tracked: false }
  }

  const occurredAt = input.occurredAt ?? new Date()
  const path = normalizePath(input.path)
  if (shouldIgnoreAnalyticsPath(path)) {
    return { tracked: false }
  }

  const data = input.data
  const postSlug = normalizeSlug(
    getDataString(data, "slug") ??
      getDataString(data, "postSlug") ??
      inferPostSlug(path),
  )
  const eventPath = path ?? (postSlug ? `/${postSlug}` : null)
  const searchQuery = type === "SEARCH_PERFORMED" ? getSearchQuery(data) : null
  const durationSeconds = getReadDurationSeconds(data, type)
  const day = startOfUtcDay(occurredAt)

  await prisma.$transaction(async (tx) => {
    if (type !== "PAGE_VIEW") {
      await tx.analyticsEvent.create({
        data: {
          createdAt: occurredAt,
          durationSeconds,
          path: eventPath,
          postSlug,
          searchQuery,
          sessionHash: input.sessionHash ?? null,
          type,
          visitorHash: input.visitorHash ?? null,
        },
      })
    }

    const { sessionCount, visitorCount } = await createUniqueVisitorAndSession(
      tx,
      {
        day,
        sessionHash: input.sessionHash ?? null,
        visitorHash: input.visitorHash ?? null,
      },
    )
    const summaryCounts = getSummaryCounts(
      type,
      visitorCount,
      sessionCount,
      durationSeconds,
    )

    await tx.analyticsDailySummary.upsert({
      create: {
        day,
        ...summaryCounts,
      },
      update: {
        comments: { increment: summaryCounts.comments },
        newsletterSignups: { increment: summaryCounts.newsletterSignups },
        pageviews: { increment: summaryCounts.pageviews },
        reads: { increment: summaryCounts.reads },
        searches: { increment: summaryCounts.searches },
        sessions: { increment: summaryCounts.sessions },
        totalReadSeconds: { increment: summaryCounts.totalReadSeconds },
        visitors: { increment: summaryCounts.visitors },
      },
      where: { day },
    })

    const pageCounts = getPageCounts(type)
    const shouldUpdatePage =
      eventPath &&
      (pageCounts.comments > 0 ||
        pageCounts.pageviews > 0 ||
        pageCounts.reads > 0)

    if (shouldUpdatePage) {
      await tx.analyticsDailyPage.upsert({
        create: {
          comments: pageCounts.comments,
          day,
          lastViewedAt: pageCounts.pageviews > 0 ? occurredAt : null,
          pageviews: pageCounts.pageviews,
          path: eventPath,
          postSlug,
          reads: pageCounts.reads,
        },
        update: {
          comments: { increment: pageCounts.comments },
          lastViewedAt: pageCounts.pageviews > 0 ? occurredAt : undefined,
          pageviews: { increment: pageCounts.pageviews },
          postSlug: postSlug ?? undefined,
          reads: { increment: pageCounts.reads },
        },
        where: { day_path: { day, path: eventPath } },
      })
    }
  })

  return { tracked: true }
}

export async function getInternalAnalyticsStats(
  startAt: number,
  endAt: number,
): Promise<InternalAnalyticsStats> {
  const range = getRange(startAt, endAt)
  const [currentRows, previousRows] = await Promise.all([
    prisma.analyticsDailySummary.findMany({
      where: { day: { gte: range.start, lte: range.end } },
    }),
    prisma.analyticsDailySummary.findMany({
      where: { day: { gte: range.previousStart, lte: range.previousEnd } },
    }),
  ])
  const current = sumSummaries(currentRows)
  const previous = sumSummaries(previousRows)

  return {
    comments: metric(current.comments, previous.comments),
    newsletterSignups: metric(
      current.newsletterSignups,
      previous.newsletterSignups,
    ),
    pageviews: metric(current.pageviews, previous.pageviews),
    reads: metric(current.reads, previous.reads),
    searches: metric(current.searches, previous.searches),
    totalReadSeconds: metric(
      current.totalReadSeconds,
      previous.totalReadSeconds,
    ),
    visitors: metric(current.visitors, previous.visitors),
    visits: metric(current.sessions, previous.sessions),
  }
}

export async function getInternalTopPages(
  startAt: number,
  endAt: number,
  limit = 10,
): Promise<InternalTopPage[]> {
  const range = getRange(startAt, endAt)
  const pages = await prisma.analyticsDailyPage.groupBy({
    _max: { lastViewedAt: true },
    _sum: { comments: true, pageviews: true, reads: true },
    by: ["path", "postSlug"],
    orderBy: { _sum: { pageviews: "desc" } },
    take: limit,
    where: { day: { gte: range.start, lte: range.end } },
  })

  return pages.map((page) => {
    const views = page._sum.pageviews ?? 0
    const reads = page._sum.reads ?? 0

    return {
      comments: page._sum.comments ?? 0,
      lastViewedAt: page._max.lastViewedAt,
      path: page.path,
      postSlug: page.postSlug,
      readRate: getReadRate(reads, views),
      reads,
      views,
    }
  })
}

export async function getPostAnalytics(
  slug: string,
  startAt: number,
  endAt: number,
): Promise<PostAnalytics> {
  const range = getRange(startAt, endAt)
  const normalizedSlug = normalizeSlug(slug) ?? slug
  const [aggregate, comments] = await Promise.all([
    prisma.analyticsDailyPage.aggregate({
      _max: { lastViewedAt: true },
      _sum: { comments: true, pageviews: true, reads: true },
      where: {
        OR: [
          { postSlug: normalizedSlug },
          { path: `/${normalizedSlug}` },
        ],
        day: { gte: range.start, lte: range.end },
      },
    }),
    prisma.comment.count({
      where: {
        post: { slug: normalizedSlug },
        status: "APPROVED",
      },
    }),
  ])
  const views = aggregate._sum.pageviews ?? 0
  const reads = aggregate._sum.reads ?? 0

  return {
    comments,
    lastViewedAt: aggregate._max.lastViewedAt,
    readRate: getReadRate(reads, views),
    reads,
    views,
  }
}
