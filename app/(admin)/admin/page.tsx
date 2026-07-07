import { Suspense } from "react"
import {
  Edit2,
  FileText,
  Mail,
  MessageSquare,
  Users,
} from "lucide-react"

import { AdminMetricCard, AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminPrimitives"
import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget"
import {
  getCachedAdminDashboardRecentData,
  getCachedAdminDashboardStats,
} from "@/lib/queries"
import { formatDate } from "@/lib/utils"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

const statCards = [
  {
    icon: FileText,
    key: "publishedPosts",
    label: "PUBLISHED POSTS",
    trend: "↑ 3 this month",
  },
  {
    icon: Edit2,
    key: "draftPosts",
    label: "DRAFTS",
    trend: undefined,
  },
  {
    icon: Users,
    key: "writers",
    label: "WRITERS",
    trend: "↑ 1 new",
  },
  {
    icon: MessageSquare,
    key: "approvedComments",
    label: "COMMENTS",
    trend: "↑ 12% vs last month",
  },
  {
    icon: Mail,
    key: "activeSubscribers",
    label: "SUBSCRIBERS",
    trend: "↑ 8% vs last month",
  },
] satisfies Array<{
  icon: typeof FileText
  key: "activeSubscribers" | "approvedComments" | "draftPosts" | "publishedPosts" | "writers"
  label: string
  trend?: string
}>

export default async function AdminDashboardPage() {
  const [stats, recentData] = await Promise.all([
    getCachedAdminDashboardStats(),
    getCachedAdminDashboardRecentData(),
  ])
  const { recentComments, recentPosts } = recentData

  return (
    <div>
      <AdminPageHeader
        subtitle="Overview of your blog's activity"
        title="Dashboard"
      />

      <section className="mb-8 grid grid-cols-2 gap-4 md:flex md:flex-row">
        {statCards.map(({ icon, key, label, trend }) => (
          <AdminMetricCard
            className={key === "activeSubscribers" ? "col-span-2 md:col-span-1" : undefined}
            icon={icon}
            key={key}
            label={label}
            trend={trend}
            trendTone={trend ? "positive" : "neutral"}
            value={stats[key].toLocaleString()}
          />
        ))}
      </section>

      <ScrollReveal index={0} className="mb-8 rounded-[20px] border border-border-default/70 bg-background/50 p-6 shadow-sm backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-text-primary">
            Analytics
          </h2>
          <select className="rounded-[5px] border border-border-default bg-transparent px-2.5 py-1.5 pr-8 text-[13px] text-text-primary outline-none focus:border-accent">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>This year</option>
          </select>
        </div>
        <div className="mb-4 h-px w-full bg-border-default" />
        <Suspense
          fallback={
            <section className="rounded-[8px] border border-dashed p-5 text-sm text-text-secondary">
              Loading analytics...
            </section>
          }
        >
          <AnalyticsWidget compact />
        </Suspense>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <ScrollReveal index={1} className="rounded-[20px] border border-border-default/70 bg-background/50 p-6 shadow-sm backdrop-blur-md">
          <h3 className="mb-3.5 border-b border-border-default pb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
            Recent posts
          </h3>
          <div className="flex flex-col">
            {recentPosts.map((post, index) => (
              <div
                className="flex items-start gap-3 border-b border-border-default py-2.5 last:border-0"
                key={post.id ?? `${post.title}-${String(post.updatedAt)}`}
              >
                <AdminStatusBadge
                  status={
                    post.status === "PUBLISHED"
                      ? "Published"
                      : post.status === "ARCHIVED"
                        ? "Archived"
                        : "Draft"
                  }
                />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-[13px] font-medium text-text-primary transition-colors hover:text-accent">
                    {post.title}
                  </h4>
                  <div className="mt-0.5 text-[11px] text-text-tertiary">
                    {post.author.name} · {index === 0 ? "Recently" : formatDate(post.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal index={2} className="rounded-[20px] border border-border-default/70 bg-background/50 p-6 shadow-sm backdrop-blur-md">
          <h3 className="mb-3.5 border-b border-border-default pb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
            Recent comments
          </h3>
          <div className="flex flex-col">
            {recentComments.map((comment) => (
              <div
                className="group flex items-start border-b border-border-default py-2.5 last:border-0"
                key={comment.id}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-[12px]">
                    <span className="font-semibold text-text-primary">
                      {comment.authorName}
                    </span>
                    <span className="mx-1 text-text-tertiary">on</span>
                    <span className="inline-block max-w-[160px] truncate align-bottom text-text-tertiary">
                      {comment.post.title}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[12px] italic leading-[1.4] text-text-secondary">
                    &quot;{comment.content}&quot;
                  </p>
                  <div className="mt-1 text-[11px] text-text-tertiary">
                    {formatDate(comment.createdAt)}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-text-tertiary opacity-100 transition-all group-hover:text-accent md:opacity-0 md:group-hover:opacity-100">
                  Mark spam
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}
