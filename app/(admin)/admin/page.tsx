import { Suspense } from "react"
import {
  Check,
  Edit2,
  FileText,
  Mail,
  MessageSquare,
  Users,
  MoreHorizontal,
  Archive,
  ShieldAlert,
} from "lucide-react"
import Link from "next/link"

import { AdminMetricCard, AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminPrimitives"
import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget"
import {
  getCachedAdminDashboardRecentData,
  getCachedAdminDashboardStats,
} from "@/lib/queries"
import { formatDate } from "@/lib/utils"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EmptyState } from "@/components/ui/EmptyState"
import { Loader } from "@/components/ui/Loader"

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
    icon: Archive,
    key: "archivedPosts",
    label: "ARCHIVED",
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
  key: "activeSubscribers" | "approvedComments" | "draftPosts" | "publishedPosts" | "writers" | "archivedPosts"
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
    <div className="w-full">
      <AdminPageHeader
        subtitle="Overview of your blog's activity"
        title="Dashboard"
      />

      <div className="mb-6 lg:mb-8 overflow-hidden rounded-[32px] border border-border-default/40 bg-gradient-to-r from-accent/10 via-background to-background p-6 md:p-8 relative shadow-sm">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/20 blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#4ade80]/10 blur-[80px]" />
        <div className="relative z-10">
          <h2 className="font-display text-[26px] font-bold tracking-tight text-text-primary md:text-[32px]">
            Welcome back to your workspace
          </h2>
          <p className="mt-2 text-[14px] md:text-[15px] text-text-secondary max-w-xl">
            Here's what's happening with your blog today. You have <span className="font-semibold text-text-primary">{stats.draftPosts}</span> drafts waiting to be published and <span className="font-semibold text-text-primary">{recentComments.length}</span> new comments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 pb-8">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:gap-8">

          <section className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
            {statCards.map(({ icon, key, label, trend }) => (
              <AdminMetricCard
                icon={icon}
                key={key}
                label={label}
                trend={trend}
                trendTone={trend ? "positive" : "neutral"}
                value={stats[key].toLocaleString()}
              />
            ))}
          </section>

          <ScrollReveal index={0} className="rounded-[24px] border border-border-default/50 bg-background/40 p-6 shadow-sm backdrop-blur-xl flex flex-col">
            <div className="mb-6 flex items-center justify-between gap-4 shrink-0">
              <h2 className="text-[16px] font-bold tracking-wide text-text-primary">
                Analytics
              </h2>
              <div className="relative w-[130px]">
                <Select defaultValue="30d">
                  <SelectTrigger className="h-8 text-[12px] bg-subtle-bg/50 border-border-default/50 backdrop-blur-md">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="1y">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <Suspense
                fallback={
                  <section className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-border-default/60 p-12 text-center h-[300px]">
                    <Loader size="md" className="mb-4" />
                    <p className="text-xs font-medium text-text-secondary">Loading...</p>
                  </section>
                }
              >
                <AnalyticsWidget compact />
              </Suspense>
            </div>
          </ScrollReveal>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 lg:gap-8">
          <ScrollReveal index={1} className="rounded-[24px] border border-border-default/50 bg-background/40 p-6 shadow-sm backdrop-blur-xl flex flex-col">
            <h3 className="mb-5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] text-text-secondary shrink-0">
              <FileText className="h-4 w-4 text-accent" />
              Recent Posts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-start content-start">
              {recentPosts.length > 0 ? recentPosts.map((post, index) => (
                <div
                  className="group flex flex-col gap-3 rounded-[16px] border border-transparent p-4 transition-all duration-300 hover:border-border-default/40 hover:bg-subtle-bg/40 hover:shadow-sm bg-subtle-bg/20 animate-in fade-in slide-in-from-bottom-2 h-full"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  key={post.id ?? `${post.title}-${String(post.updatedAt)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <AdminStatusBadge
                      status={
                        post.status === "PUBLISHED"
                          ? "Published"
                          : post.status === "ARCHIVED"
                            ? "Archived"
                            : "Draft"
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-[8px] p-1.5 text-text-tertiary hover:bg-background hover:text-text-primary shadow-sm border border-transparent hover:border-border-default/50 outline-none transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 border-border-default/60 bg-background/80 backdrop-blur-xl">
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/dashboard/edit/${post.id}`} prefetch={false}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Post
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      className="mb-1.5 line-clamp-2 text-[14px] font-semibold text-text-primary transition-colors group-hover:text-accent"
                      href={`/dashboard/edit/${post.id}`}
                      prefetch={false}
                    >
                      {post.title}
                    </Link>
                    <div className="text-[11px] font-medium text-text-tertiary">
                      {post.author.name} <span className="mx-1.5 opacity-50">•</span> {index === 0 ? "Recently" : formatDate(post.updatedAt)}
                    </div>
                  </div>
                </div>
              )) : (
                <EmptyState icon={FileText} title="No posts yet" description="Click 'Create Post' to get started." className="py-8 px-4" />
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal index={2} className="rounded-[24px] border border-border-default/50 bg-background/40 p-6 shadow-sm backdrop-blur-xl flex flex-col">
            <h3 className="mb-5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] text-text-secondary shrink-0">
              <MessageSquare className="h-4 w-4 text-accent" />
              Recent Comments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-start content-start">
              {recentComments.length > 0 ? recentComments.map((comment, index) => (
                <div
                  className="group flex flex-col gap-3 rounded-[16px] border border-transparent p-4 transition-all duration-300 hover:border-border-default/40 hover:bg-subtle-bg/40 hover:shadow-sm bg-subtle-bg/20 relative animate-in fade-in slide-in-from-bottom-2 h-full"
                  style={{ animationDelay: `${(index + 3) * 50}ms`, animationFillMode: "both" }}
                  key={comment.id}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/5 text-[10px] font-bold text-accent border border-accent/10">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[12px] font-bold text-text-primary truncate max-w-[100px]">
                        {comment.authorName}
                      </span>
                    </div>
                    <div className="text-[10px] font-medium text-text-tertiary">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>

                  <p className="line-clamp-2 text-[13px] leading-[1.6] text-text-secondary pl-2 border-l-[2px] border-border-default/40">
                    {comment.content}
                  </p>

                  <div className="text-[11px] text-text-tertiary truncate">
                    on <span className="font-medium hover:text-accent cursor-pointer transition-colors">{comment.post.title}</span>
                  </div>

                  <div className="absolute top-2 right-2 flex opacity-0 transition-all duration-200 group-hover:opacity-100 bg-background/90 backdrop-blur-md rounded-[8px] shadow-sm border border-border-default/50 p-1 scale-95 group-hover:scale-100">
                    <button
                      aria-label="Approve comment"
                      className="flex h-7 w-7 items-center justify-center rounded-sm text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary focus-visible:outline-none"
                      title="Approve comment"
                      type="button"
                    >
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px bg-border-default/50 my-1 mx-0.5" />
                    <button
                      aria-label="Mark comment as spam"
                      className="flex h-7 w-7 items-center justify-center rounded-sm text-[#c2410c] transition-colors hover:bg-[#c2410c]/10 hover:opacity-80 focus-visible:outline-none dark:text-[#fb923c]"
                      title="Mark comment as spam"
                      type="button"
                    >
                      <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )) : (
                <EmptyState icon={MessageSquare} title="No comments" description="No one has commented yet." className="py-8 px-4" />
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
