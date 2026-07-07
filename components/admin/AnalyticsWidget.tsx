import Link from "next/link"
import {
  BookOpenCheck,
  Eye,
  Mail,
  MessageSquare,
  MousePointerClick,
  Search,
  Timer,
  Users,
} from "lucide-react"

import { AdminMetricCard } from "@/components/admin/AdminPrimitives"
import type {
  InternalAnalyticsStats,
  InternalTopPage,
} from "@/lib/internalAnalytics"
import { getCachedAdminAnalyticsData } from "@/lib/queries"

function last30Days() {
  const endAt = Date.now()
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000

  return { endAt, startAt }
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? "0%" : "+100%"
  }

  const change = ((current - previous) / previous) * 100
  return `${change >= 0 ? "+" : ""}${change.toFixed(0)}%`
}

function formatDuration(totalSeconds: number, reads: number) {
  if (reads <= 0) {
    return "0s"
  }

  const seconds = Math.round(totalSeconds / reads)

  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}m ${remainingSeconds}s`
}

function buildLinePoints(values: number[]) {
  const width = 720
  const height = 240
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width
      const y = height - ((value - min) / range) * (height - 24) - 12

      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

export async function AnalyticsWidget({
  compact = false,
}: { compact?: boolean } = {}) {
  const { endAt, startAt } = last30Days()
  let stats: InternalAnalyticsStats
  let topPages: InternalTopPage[]

  try {
    ;({ stats, topPages } = await getCachedAdminAnalyticsData(startAt, endAt))
  } catch {
    return (
      <section className="rounded-[24px] border-[2px] border-dashed border-border-default bg-subtle-bg/30 backdrop-blur-md p-5 text-[13px] text-text-tertiary shadow-sm">
        Analytics data unavailable.
      </section>
    )
  }

  const metrics = [
    {
      change: percentChange(stats.pageviews.value, stats.pageviews.prev),
      icon: Eye,
      label: "Page views",
      value: stats.pageviews.value.toLocaleString(),
    },
    {
      change: percentChange(stats.visitors.value, stats.visitors.prev),
      icon: Users,
      label: "Unique visitors",
      value: stats.visitors.value.toLocaleString(),
    },
    {
      change: percentChange(stats.visits.value, stats.visits.prev),
      icon: MousePointerClick,
      label: "Visits",
      value: stats.visits.value.toLocaleString(),
    },
    {
      change: percentChange(stats.reads.value, stats.reads.prev),
      icon: BookOpenCheck,
      label: "Reads",
      value: stats.reads.value.toLocaleString(),
    },
    {
      change: percentChange(
        stats.totalReadSeconds.value,
        stats.totalReadSeconds.prev,
      ),
      icon: Timer,
      label: "Avg. read time",
      value: formatDuration(stats.totalReadSeconds.value, stats.reads.value),
    },
    {
      change: percentChange(stats.comments.value, stats.comments.prev),
      icon: MessageSquare,
      label: "Comments",
      value: stats.comments.value.toLocaleString(),
    },
    {
      change: percentChange(
        stats.newsletterSignups.value,
        stats.newsletterSignups.prev,
      ),
      icon: Mail,
      label: "Newsletter",
      value: stats.newsletterSignups.value.toLocaleString(),
    },
    {
      change: percentChange(stats.searches.value, stats.searches.prev),
      icon: Search,
      label: "Searches",
      value: stats.searches.value.toLocaleString(),
    },
  ]

  const visibleMetrics = compact ? metrics.slice(0, 4) : metrics

  if (!compact) {
    const chartValues = [
      Math.max(stats.pageviews.prev, 0),
      Math.max(stats.visits.prev, 0),
      Math.max(stats.visitors.prev, 0),
      Math.max(stats.reads.prev, 0),
      Math.max(stats.reads.value, 0),
      Math.max(stats.visitors.value, 0),
      Math.max(stats.visits.value, 0),
      Math.max(stats.pageviews.value, 0),
    ]
    const chartPoints = buildLinePoints(chartValues)
    const chartLabels = ["Day 1", "Day 5", "Day 9", "Day 13"]
    const totalViews = stats.pageviews.value
    const topPanelPages = topPages.slice(0, 5)
    const engagementRows = [
      {
        label: "Visits",
        percent: stats.pageviews.value
          ? Math.min(Math.round((stats.visits.value / stats.pageviews.value) * 100), 100)
          : 0,
        value: stats.visits.value.toLocaleString(),
      },
      {
        label: "Readers",
        percent: stats.visitors.value
          ? Math.min(Math.round((stats.reads.value / stats.visitors.value) * 100), 100)
          : 0,
        value: stats.reads.value.toLocaleString(),
      },
      {
        label: "Searches",
        percent: stats.pageviews.value
          ? Math.min(Math.round((stats.searches.value / stats.pageviews.value) * 100), 100)
          : 0,
        value: stats.searches.value.toLocaleString(),
      },
    ]

    return (
      <section>
        <div className="mb-8 rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md p-5 shadow-sm md:p-8">
          <div className="mb-6 flex items-end gap-3">
            <div className="text-[32px] font-bold leading-none text-text-primary">
              {totalViews.toLocaleString()}
            </div>
            <div className="mb-1 text-[13px] text-text-secondary">
              Total page views
            </div>
            <div className="mb-1 ml-auto text-[13px] font-medium text-[#15803d] dark:text-[#4ade80]">
              {percentChange(stats.pageviews.value, stats.pageviews.prev)} vs previous period
            </div>
          </div>

          <div className="h-[300px] w-full">
            <svg
              aria-label="Page views trend"
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 720 300"
            >
              {[48, 96, 144, 192, 240].map((y) => (
                <line
                  key={y}
                  stroke="var(--border-default)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  x1="0"
                  x2="720"
                  y1={y}
                  y2={y}
                />
              ))}
              <polyline
                fill="none"
                points={chartPoints}
                stroke="var(--accent)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {chartPoints.split(" ").map((point, index, points) => {
                if (index !== points.length - 1) return null
                const [cx, cy] = point.split(",")

                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    fill="var(--accent)"
                    key={point}
                    r="4"
                    vectorEffect="non-scaling-stroke"
                  />
                )
              })}
              {chartLabels.map((label, index) => (
                <text
                  fill="var(--text-tertiary)"
                  fontSize="11"
                  key={label}
                  x={index * 240}
                  y="292"
                >
                  {label}
                </text>
              ))}
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <div className="overflow-hidden rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md shadow-sm">
            <div className="border-b border-border-default bg-subtle-bg/50 p-4">
              <h3 className="text-[13px] font-semibold text-text-primary">
                Top Referrers
              </h3>
            </div>
            <div className="flex flex-col">
              {topPanelPages.length > 0 ? (
                topPanelPages.map((page, index) => (
                  <div
                    className="flex items-center justify-between border-b border-border-default p-4 last:border-0"
                    key={`${page.path}-${index}`}
                  >
                    <Link
                      className="min-w-0 truncate text-[13px] font-medium text-text-primary hover:text-accent"
                      href={page.path}
                      prefetch={false}
                    >
                      {page.path}
                    </Link>
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] text-text-secondary">
                        {page.views.toLocaleString()}
                      </span>
                      <span className="w-8 text-right text-[12px] text-text-tertiary">
                        {page.readRate}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-[13px] text-text-tertiary">
                  No page data yet.
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md shadow-sm">
            <div className="border-b border-border-default bg-subtle-bg/50 p-4">
              <h3 className="text-[13px] font-semibold text-text-primary">
                Device Breakdown
              </h3>
            </div>
            <div className="flex flex-col gap-5 p-5">
              {engagementRows.map((row, index) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-text-primary">
                      {row.label}
                    </span>
                    <span className="text-[13px] text-text-secondary">
                      {row.value}
                      <span className="ml-1 text-[11px] text-text-tertiary">
                        ({row.percent}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full border border-border-default bg-subtle-bg">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor:
                          index === 0
                            ? "var(--accent)"
                            : index === 1
                              ? "var(--text-secondary)"
                              : "var(--text-tertiary)",
                        width: `${row.percent}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className={compact ? "mb-5 grid grid-cols-2 gap-4 md:flex md:flex-row" : "mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"}>
        {visibleMetrics.map(({ change, icon, label, value }) => {
          const isPositive = change.startsWith("+")
          const isFlat = change === "0%"

          return (
            <AdminMetricCard
              icon={icon}
              key={label}
              label={label}
              trend={`${change} vs prev period`}
              trendTone={isFlat ? "neutral" : isPositive ? "positive" : "negative"}
              value={value}
            />
          )
        })}
      </div>

      <div className={compact ? "mt-5 hidden md:block" : "mt-6 rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md p-6 shadow-sm"}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[14px] font-semibold text-text-primary">
            Top pages {compact ? "— last 30 days" : ""}
          </h3>
          {!compact && (
            <span className="text-xs text-text-tertiary">Ranked by views</span>
          )}
        </div>

        {topPages.length > 0 ? (
          <div className={compact ? "mt-3 flex flex-col" : "mt-4 space-y-3"}>
            {topPages.map((page, index) => (
              <div
                className={compact ? "flex items-center justify-between gap-4 border-b border-border-default py-2.5 text-[13px] last:border-0" : "flex items-center justify-between gap-4 text-sm"}
                key={`${page.path}-${index}`}
              >
                <Link
                  className="min-w-0 truncate font-mono text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={page.path}
                >
                  {page.path}
                </Link>
                <span className="shrink-0 font-semibold text-text-primary">
                  {page.views.toLocaleString()}
                  {!compact && page.reads > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {page.readRate}% read
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No page data yet.
          </p>
        )}
      </div>
      {compact && (
        <Link
          className="mt-4 inline-block text-[13px] font-medium text-accent hover:underline"
          href="/admin/analytics"
          prefetch={false}
        >
          View full analytics dashboard &rarr;
        </Link>
      )}
    </section>
  )
}
