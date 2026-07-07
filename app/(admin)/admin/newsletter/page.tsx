import {
  ArrowUpRight,
  MailOpen,
  MoreHorizontal,
  MousePointerClick,
  Plus,
  Search,
  Users,
} from "lucide-react"

import { AdminMetricCard, AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { NewsletterBroadcastForm } from "@/components/admin/NewsletterBroadcastForm"
import { getCachedAdminNewsletterData } from "@/lib/queries"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

export default async function AdminNewsletterPage() {
  const { activeCount, recentPosts } = await getCachedAdminNewsletterData()

  return (
    <div className="animate-in fade-in duration-300">
      <AdminPageHeader
        action={
          <button className="flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-5 font-semibold text-white shadow-md shadow-accent/20 transition-all hover:scale-105 hover:shadow-accent/40 md:w-auto">
            <Plus aria-hidden="true" className="mr-1 h-4 w-4" />
            New Email
          </button>
        }
        subtitle="Manage subscribers and email broadcasts"
        title="Newsletter"
      />

      <ScrollReveal index={0} className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminMetricCard
          icon={Users}
          label="TOTAL SUBSCRIBERS"
          trend="Active subscribers"
          value={activeCount.toLocaleString()}
        />
        <AdminMetricCard
          icon={MailOpen}
          label="AVG OPEN RATE"
          trend="Stored after broadcasts are sent"
          trendTone="neutral"
          value="0%"
        />
        <AdminMetricCard
          icon={MousePointerClick}
          label="AVG CLICK RATE"
          trend="No click data yet"
          trendTone="neutral"
          value="0%"
        />
      </ScrollReveal>

      <ScrollReveal index={1} className="mb-8 rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-2 sm:p-6 backdrop-blur-md shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 px-4 pt-4 sm:flex-row sm:items-center sm:px-0 sm:pt-0">
          <h2 className="text-[18px] font-bold text-text-primary">
            Recent Broadcasts
          </h2>
          <div className="relative hidden w-[180px] md:block md:w-[280px]">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
            />
            <input
              className="h-11 w-full rounded-full border-[2px] border-border-default bg-subtle-bg/30 pl-10 pr-4 text-[14px] font-medium outline-none transition-all placeholder:text-text-tertiary focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20 backdrop-blur-md"
              placeholder="Search emails..."
              type="text"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <div className="min-w-[700px] flex flex-col">
            <div className="flex h-[40px] items-center border-b border-border-default px-6 text-[11px] font-bold uppercase tracking-[0.05em] text-text-secondary">
              <div className="min-w-0 flex-1 pr-4">Subject</div>
              <div className="w-[120px] shrink-0">Status</div>
              <div className="w-[100px] shrink-0 text-right">Recipients</div>
              <div className="w-[80px] shrink-0 text-right">Opens</div>
              <div className="w-[80px] shrink-0 text-right">Clicks</div>
              <div className="w-[80px] shrink-0 pr-2 text-right">Actions</div>
            </div>

            <div className="flex flex-col">
              {recentPosts.map((post) => (
                <div
                  className="group flex items-center border-b border-border-default/50 px-4 py-4 transition-colors last:border-0 hover:bg-white/40 dark:hover:bg-white/5 sm:px-6 h-[64px]"
                  key={post.id}
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="block truncate text-[14px] font-bold text-text-primary group-hover:text-accent transition-colors">
                      {post.title}
                    </span>
                  </div>
                  <div className="w-[120px] shrink-0">
                    <span className="rounded-full border border-border-default/60 bg-background/50 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-text-secondary shadow-sm">
                      Draft
                    </span>
                  </div>
                  <div className="w-[100px] shrink-0 text-right text-[13px] font-medium text-text-secondary">
                    {activeCount.toLocaleString()}
                  </div>
                  <div className="w-[80px] shrink-0 text-right text-[13px] font-medium text-text-secondary">
                    -
                  </div>
                  <div className="w-[80px] shrink-0 text-right text-[13px] font-medium text-text-secondary">
                    -
                  </div>
                  <div className="flex w-[80px] shrink-0 items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-transparent text-text-tertiary transition-all hover:bg-subtle-bg hover:text-text-primary"
                      title="View report"
                      type="button"
                    >
                      <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-transparent text-text-tertiary transition-all hover:bg-subtle-bg hover:text-text-primary"
                      title="More"
                      type="button"
                    >
                      <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {recentPosts.length === 0 && (
                <div className="p-12 text-center text-[14px] font-medium text-text-tertiary">
                  No published posts available for broadcasts.
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal index={2} className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-8 backdrop-blur-md shadow-sm">
        <div className="mb-6">
          <h2 className="text-[18px] font-bold text-text-primary">
            Compose Broadcast
          </h2>
          <p className="mt-1 text-[14px] text-text-secondary">
            Send a custom newsletter or feature a recent post to all your active subscribers.
          </p>
        </div>
        <NewsletterBroadcastForm recentPosts={recentPosts} />
      </ScrollReveal>
    </div>
  )
}
