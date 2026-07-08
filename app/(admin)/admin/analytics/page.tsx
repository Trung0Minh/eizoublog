import { Suspense } from "react"
import { Calendar, Download } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

export default async function AdminAnalyticsPage() {
  return (
    <div>
      <AdminPageHeader
        action={
          <div className="flex items-center gap-2">
            <button className="flex h-9 items-center gap-2 rounded-full border border-border-default bg-subtle-bg/50 px-4 text-[13px] font-semibold text-text-secondary transition-all hover:bg-white/40 hover:text-text-primary dark:hover:bg-white/10 shadow-sm backdrop-blur-sm">
              <Calendar aria-hidden="true" className="h-4 w-4" />
              Last 30 Days
            </button>
            <button
              aria-label="Export analytics"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default bg-subtle-bg/50 p-0 text-[13px] font-semibold text-text-secondary shadow-sm backdrop-blur-sm transition-all hover:bg-white/40 hover:text-text-primary dark:hover:bg-white/10"
              title="Export analytics"
              type="button"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        }
        subtitle="Detailed traffic and engagement data"
        title="Analytics"
      />

      <ScrollReveal index={0} className="w-full">
        <Suspense
          fallback={
            <div className="rounded-[8px] border border-dashed p-5 text-sm text-text-secondary">
              Loading analytics...
            </div>
          }
        >
          <AnalyticsWidget />
        </Suspense>
      </ScrollReveal>
    </div>
  )
}
