import type { NewsletterBroadcastStatus } from "@prisma/client"
import { MailCheck, Send, Users } from "lucide-react"

import { AdminMetricCard, AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { NewsletterBroadcastForm } from "@/components/admin/NewsletterBroadcastForm"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { getCachedAdminNewsletterData } from "@/lib/queries"
import { formatDate } from "@/lib/utils"

function statusLabel(status: NewsletterBroadcastStatus) {
  switch (status) {
    case "COMPLETED":
      return "Completed"
    case "PROCESSING":
      return "Sending"
    case "PARTIAL":
      return "Partial"
    case "FAILED":
      return "Failed"
    default:
      return "Queued"
  }
}

function statusClassName(status: NewsletterBroadcastStatus) {
  if (status === "COMPLETED") {
    return "border-accent/25 bg-accent/10 text-accent"
  }

  if (status === "FAILED") {
    return "border-destructive/25 bg-destructive/10 text-destructive"
  }

  return "border-border-default bg-background/60 text-text-secondary"
}

export default async function AdminNewsletterPage() {
  const {
    activeCount,
    deliveredCount,
    recentBroadcasts,
    recentPosts,
    totalBroadcasts,
  } = await getCachedAdminNewsletterData()

  return (
    <div className="animate-in fade-in duration-300">
      <AdminPageHeader
        subtitle="Compose newsletters and monitor delivery"
        title="Newsletter"
      />

      <div className="mb-8 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <ScrollReveal
          className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1"
          index={0}
        >
          <AdminMetricCard
            icon={Users}
            label="TOTAL SUBSCRIBERS"
            trend="Active subscribers"
            value={activeCount.toLocaleString()}
          />
          <AdminMetricCard
            icon={Send}
            label="TOTAL BROADCASTS"
            trend="Created newsletters"
            trendTone="neutral"
            value={totalBroadcasts.toLocaleString()}
          />
          <AdminMetricCard
            icon={MailCheck}
            label="EMAILS DELIVERED"
            trend="Successfully sent"
            trendTone="neutral"
            value={deliveredCount.toLocaleString()}
          />
        </ScrollReveal>

        <ScrollReveal
          className="min-w-0 overflow-hidden rounded-[24px] border border-border-default/70 bg-background/65 shadow-sm backdrop-blur-xl"
          index={1}
        >
          <div className="border-b border-border-default/60 px-5 py-5 sm:px-6">
            <h2 className="text-[18px] font-bold text-text-primary">
              Recent Broadcasts
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Delivery history from the newsletter queue.
            </p>
          </div>

          <div>
            <div className="min-w-0 md:min-w-[720px]">
              <div className="hidden h-11 grid-cols-[minmax(220px,1fr)_110px_90px_90px_120px] items-center gap-3 border-b border-border-default/50 px-6 text-[11px] font-bold uppercase tracking-[0.08em] text-text-tertiary md:grid">
                <div>Subject</div>
                <div>Status</div>
                <div className="text-right">Sent</div>
                <div className="text-right">Failed</div>
                <div className="text-right">Created</div>
              </div>

              {recentBroadcasts.length > 0 ? (
                recentBroadcasts.map((broadcast) => (
                  <div
                    className="flex min-h-16 flex-wrap items-center gap-x-5 gap-y-3 border-b border-border-default/45 px-5 py-4 last:border-0 hover:bg-subtle-bg/35 sm:px-6 md:grid md:grid-cols-[minmax(220px,1fr)_110px_90px_90px_120px] md:gap-3 md:py-3"
                    key={broadcast.id}
                  >
                    <div className="w-full min-w-0 md:w-auto">
                      <p className="truncate text-[14px] font-bold text-text-primary">
                        {broadcast.subject}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-tertiary">
                        {broadcast.totalCount.toLocaleString()} recipients
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${statusClassName(broadcast.status)}`}
                      >
                        {statusLabel(broadcast.status)}
                      </span>
                    </div>
                    <div className="text-[13px] font-semibold text-text-secondary before:font-normal before:text-text-tertiary before:content-['Sent:_'] md:text-right md:before:content-none">
                      {broadcast.sentCount.toLocaleString()}
                    </div>
                    <div className="text-[13px] font-semibold text-text-secondary before:font-normal before:text-text-tertiary before:content-['Failed:_'] md:text-right md:before:content-none">
                      {broadcast.failedCount.toLocaleString()}
                    </div>
                    <div className="ml-auto text-right text-[12px] text-text-tertiary md:ml-0">
                      {formatDate(broadcast.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-16 text-center text-[14px] text-text-tertiary">
                  No broadcasts have been sent yet.
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal
        className="rounded-[24px] border border-border-default/70 bg-background/65 p-5 shadow-sm backdrop-blur-xl sm:p-7"
        index={2}
      >
        <div className="mb-6">
          <h2 className="text-[18px] font-bold text-text-primary">
            Compose Broadcast
          </h2>
          <p className="mt-1 text-[14px] text-text-secondary">
            Send a custom newsletter or feature a recent post to active subscribers.
          </p>
        </div>
        <NewsletterBroadcastForm recentPosts={recentPosts} />
      </ScrollReveal>
    </div>
  )
}
