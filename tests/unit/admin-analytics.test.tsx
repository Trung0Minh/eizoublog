import { render, screen } from "@testing-library/react"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const analyticsMocks = vi.hoisted(() => ({
  getCachedAdminAnalyticsData: vi.fn(),
  getInternalAnalyticsStats: vi.fn(),
  getInternalTopPages: vi.fn(),
}))

vi.mock("@/lib/queries", () => ({
  getCachedAdminAnalyticsData: analyticsMocks.getCachedAdminAnalyticsData,
}))
vi.mock("@/lib/internalAnalytics", () => ({
  getInternalAnalyticsStats: analyticsMocks.getInternalAnalyticsStats,
  getInternalTopPages: analyticsMocks.getInternalTopPages,
}))
vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))

import AdminAnalyticsPage from "@/app/(admin)/admin/analytics/page"
import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget"

const populatedStats = {
  comments: { prev: 2, value: 5 },
  newsletterSignups: { prev: 1, value: 3 },
  pageviews: { prev: 100, value: 150 },
  reads: { prev: 25, value: 60 },
  searches: { prev: 4, value: 8 },
  totalReadSeconds: { prev: 750, value: 1800 },
  visitors: { prev: 30, value: 45 },
  visits: { prev: 40, value: 60 },
}
const emptyStats = {
  comments: { prev: 0, value: 0 },
  newsletterSignups: { prev: 0, value: 0 },
  pageviews: { prev: 0, value: 0 },
  reads: { prev: 0, value: 0 },
  searches: { prev: 0, value: 0 },
  totalReadSeconds: { prev: 0, value: 0 },
  visitors: { prev: 0, value: 0 },
  visits: { prev: 0, value: 0 },
}
const populatedTopPages = [
  { path: "/frieren-memory", readRate: 60, reads: 15, views: 25 },
  { path: "/", readRate: 0, reads: 0, views: 10 },
]

function renderAsync(node: React.ReactNode) {
  render(<>{node}</>)
}

describe("AnalyticsWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    analyticsMocks.getInternalAnalyticsStats.mockResolvedValue(populatedStats)
    analyticsMocks.getInternalTopPages.mockResolvedValue(populatedTopPages)
    analyticsMocks.getCachedAdminAnalyticsData.mockResolvedValue({
      stats: populatedStats,
      topPages: populatedTopPages,
    })
  })

  it("renders summary metrics and top pages", async () => {
    renderAsync(await AnalyticsWidget())

    expect(analyticsMocks.getCachedAdminAnalyticsData).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Total page views")).toBeVisible()
    expect(screen.getByRole("heading", { name: "Top Referrers" })).toBeVisible()
    expect(screen.getByRole("heading", { name: "Device Breakdown" })).toBeVisible()
    expect(screen.getByText("150")).toBeVisible()
    expect(screen.getAllByText("60").length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: "/frieren-memory" })).toHaveAttribute(
      "href",
      "/frieren-memory",
    )
    expect(
      screen.queryByRole("link", { name: /full analytics dashboard/i }),
    ).not.toBeInTheDocument()
  })

  it("renders repeated top page paths without duplicate React keys", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    analyticsMocks.getCachedAdminAnalyticsData.mockResolvedValue({
      stats: populatedStats,
      topPages: [
        { path: "/", readRate: 0, reads: 0, views: 10 },
        { path: "/", readRate: 0, reads: 0, views: 5 },
      ],
    })

    try {
      renderAsync(await AnalyticsWidget({ compact: true }))

      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining("Encountered two children with the same key"),
        expect.anything(),
      )
      expect(screen.getAllByRole("link", { name: "/" })).toHaveLength(2)
    } finally {
      consoleError.mockRestore()
    }
  })

  it("falls back gracefully when analytics data is unavailable", async () => {
    analyticsMocks.getCachedAdminAnalyticsData.mockRejectedValue(
      new Error("offline"),
    )
    analyticsMocks.getInternalAnalyticsStats.mockRejectedValue(
      new Error("offline"),
    )

    renderAsync(await AnalyticsWidget())

    expect(screen.getByText("Analytics data unavailable.")).toBeVisible()
  })
})

describe("AdminAnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    analyticsMocks.getInternalAnalyticsStats.mockResolvedValue(emptyStats)
    analyticsMocks.getInternalTopPages.mockResolvedValue([])
    analyticsMocks.getCachedAdminAnalyticsData.mockResolvedValue({
      stats: emptyStats,
      topPages: [],
    })
  })

  it("renders the full analytics page without an external dashboard link", async () => {
    renderAsync(await AdminAnalyticsPage())

    expect(screen.getByRole("heading", { name: "Analytics" })).toBeVisible()
    expect(
      screen.getByText(/Detailed traffic and engagement data/i),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: /Last 30 Days/i })).toBeVisible()
    expect(screen.getByRole("button", { name: /Export/i })).toBeVisible()
    expect(screen.getByText("Loading analytics...")).toBeVisible()
    expect(
      screen.queryByRole("link", { name: /open analytics dashboard/i }),
    ).not.toBeInTheDocument()
  })
})
