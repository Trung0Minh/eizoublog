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
            <button className="flex h-[34px] items-center gap-1.5 rounded-full border border-border-default px-4 text-[13px] font-medium text-text-secondary transition-colors hover:bg-subtle-bg">
              <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
              Last 30 Days
            </button>
            <button className="flex h-[34px] items-center gap-1.5 rounded-full border border-border-default px-4 text-[13px] font-medium text-text-secondary transition-colors hover:bg-subtle-bg">
              <Download aria-hidden="true" className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        }
        subtitle="Detailed traffic and engagement data"
        title="Analytics"
      />

      <ScrollReveal index={0} className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6">
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
