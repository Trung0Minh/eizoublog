import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const analyticsTrackerMock = vi.hoisted(() => vi.fn())
const prismaMocks = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn(),
    analyticsDailyPage: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      upsert: vi.fn(),
    },
    analyticsDailySession: {
      createMany: vi.fn(),
    },
    analyticsDailySummary: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    analyticsDailyVisitor: {
      createMany: vi.fn(),
    },
    analyticsEvent: {
      create: vi.fn(),
    },
    comment: {
      count: vi.fn(),
    },
  }

  return { prisma }
})


vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock("@/components/analytics/InternalAnalyticsTracker", () => ({
  InternalAnalyticsTracker: () => {
    analyticsTrackerMock()
    return <div data-testid="internal-analytics-tracker" />
  },
}))
vi.mock("@/components/layout/Navbar", () => ({
  Navbar: () => <header>Navbar</header>,
}))
vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer>Footer</footer>,
}))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMocks.prisma }))
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}))

import RootLayout from "@/app/layout"
import { trackEvent } from "@/lib/analytics"
import {
  getInternalAnalyticsStats,
  getInternalTopPages,
  getPostAnalytics,
  recordAnalyticsEvent,
} from "@/lib/internalAnalytics"

describe("internal analytics layout", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("mounts the internal tracker", () => {
    vi.stubEnv("NODE_ENV", "production")

    render(
      <RootLayout>
        <p>Page content</p>
      </RootLayout>,
    )

    expect(screen.getByTestId("internal-analytics-tracker")).toBeVisible()
  })
})

describe("trackEvent", () => {
  const originalSendBeacon = navigator.sendBeacon

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: vi.fn(() => true),
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: originalSendBeacon,
    })
    vi.unstubAllGlobals()
  })

  it("sends events to the internal analytics endpoint with sendBeacon", () => {
    trackEvent("newsletter_subscribed", { source: "sidebar" })

    const sendBeacon = vi.mocked(navigator.sendBeacon)
    expect(sendBeacon).toHaveBeenCalledTimes(1)
    expect(sendBeacon).toHaveBeenCalledWith(
      "/api/analytics/events",
      expect.stringContaining('"eventName":"newsletter_subscribed"'),
    )
    expect(String(sendBeacon.mock.calls[0]?.[1])).toContain(
      '"source":"sidebar"',
    )
  })

  it("falls back to keepalive fetch when sendBeacon is unavailable", () => {
    Reflect.deleteProperty(navigator, "sendBeacon")
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal("fetch", fetchMock)

    trackEvent("search", { query: "frieren" })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/analytics/events",
      expect.objectContaining({
        body: expect.stringContaining('"eventName":"search"'),
        keepalive: true,
        method: "POST",
      }),
    )
  })
})

describe("internal analytics helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMocks.prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMocks.prisma) => unknown) =>
        callback(prismaMocks.prisma),
    )
    prismaMocks.prisma.analyticsDailyVisitor.createMany.mockResolvedValue({
      count: 1,
    })
    prismaMocks.prisma.analyticsDailySession.createMany.mockResolvedValue({
      count: 1,
    })
    prismaMocks.prisma.analyticsEvent.create.mockResolvedValue({ id: "event-1" })
    prismaMocks.prisma.analyticsDailySummary.upsert.mockResolvedValue({
      id: "summary-1",
    })
    prismaMocks.prisma.analyticsDailyPage.upsert.mockResolvedValue({
      id: "page-1",
    })
  })

  it("records events and updates daily aggregates", async () => {
    await expect(
      recordAnalyticsEvent({
        eventName: "page_view",
        occurredAt: new Date("2026-06-13T12:00:00.000Z"),
        path: "/frieren-memory",
        sessionHash: "session-1",
        visitorHash: "visitor-1",
      }),
    ).resolves.toEqual({ tracked: true })

    expect(prismaMocks.prisma.analyticsEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          path: "/frieren-memory",
          type: "PAGE_VIEW",
          visitorHash: "visitor-1",
        }),
      }),
    )
    expect(prismaMocks.prisma.analyticsDailySummary.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          pageviews: { increment: 1 },
          sessions: { increment: 1 },
          visitors: { increment: 1 },
        }),
      }),
    )
    expect(prismaMocks.prisma.analyticsDailyPage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          pageviews: { increment: 1 },
        }),
      }),
    )
  })

  it("returns dashboard stats, top pages, and per-post analytics", async () => {
    prismaMocks.prisma.analyticsDailySummary.findMany
      .mockResolvedValueOnce([
        {
          comments: 1,
          newsletterSignups: 2,
          pageviews: 100,
          reads: 25,
          searches: 3,
          sessions: 40,
          totalReadSeconds: 750,
          visitors: 30,
        },
      ])
      .mockResolvedValueOnce([
        {
          comments: 1,
          newsletterSignups: 1,
          pageviews: 50,
          reads: 10,
          searches: 1,
          sessions: 20,
          totalReadSeconds: 300,
          visitors: 15,
        },
      ])
    prismaMocks.prisma.analyticsDailyPage.groupBy.mockResolvedValue([
      {
        _max: { lastViewedAt: new Date("2026-06-13T12:00:00.000Z") },
        _sum: { comments: 1, pageviews: 20, reads: 8 },
        path: "/frieren-memory",
        postSlug: "frieren-memory",
      },
    ])
    prismaMocks.prisma.analyticsDailyPage.aggregate.mockResolvedValue({
      _max: { lastViewedAt: new Date("2026-06-13T12:00:00.000Z") },
      _sum: { comments: 1, pageviews: 20, reads: 8 },
    })
    prismaMocks.prisma.comment.count.mockResolvedValue(4)

    await expect(getInternalAnalyticsStats(1000, 2000)).resolves.toEqual(
      expect.objectContaining({
        pageviews: { prev: 50, value: 100 },
        reads: { prev: 10, value: 25 },
        visitors: { prev: 15, value: 30 },
        visits: { prev: 20, value: 40 },
      }),
    )
    await expect(getInternalTopPages(1000, 2000, 5)).resolves.toEqual(
      [
        expect.objectContaining({
          path: "/frieren-memory",
          readRate: 40,
          views: 20,
        }),
      ],
    )
    await expect(
      getPostAnalytics("frieren-memory", 1000, 2000),
    ).resolves.toEqual(
      expect.objectContaining({
        comments: 4,
        lastViewedAt: new Date("2026-06-13T12:00:00.000Z"),
        reads: 8,
        views: 20,
      }),
    )
  })
})

describe("analytics tracking components", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("tracks a post read after the read threshold", async () => {
    const analytics = await import("@/lib/analytics")
    const trackSpy = vi.spyOn(analytics, "trackEvent").mockImplementation(() => {})
    const { PostReadTracker } = await import("@/components/posts/PostReadTracker")

    render(<PostReadTracker slug="frieren-memory" title="Frieren and memory" />)

    expect(trackSpy).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(trackSpy).toHaveBeenCalledWith("post_read", {
      durationSeconds: 30,
      slug: "frieren-memory",
      title: "Frieren and memory",
    })
  })

  it("tracks a search query on the search results page", async () => {
    const analytics = await import("@/lib/analytics")
    const trackSpy = vi.spyOn(analytics, "trackEvent").mockImplementation(() => {})
    const { SearchPageTracker } = await import(
      "@/components/search/SearchPageTracker"
    )

    render(<SearchPageTracker query="frieren" />)

    expect(trackSpy).toHaveBeenCalledWith("search", { query: "frieren" })
  })
})
