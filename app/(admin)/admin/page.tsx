import { Suspense } from "react"
import {
  Archive,
  Edit2,
  FileText,
  Mail,
  MessageSquare,
  Users,
} from "lucide-react"

import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget"
import { AdminMetricCard, AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { Loader } from "@/components/ui/Loader"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { getCachedAdminDashboardStats } from "@/lib/queries"

const statCards = [
  { icon: FileText, key: "publishedPosts", label: "PUBLISHED POSTS" },
  { icon: Edit2, key: "draftPosts", label: "DRAFTS" },
  { icon: Archive, key: "archivedPosts", label: "ARCHIVED" },
  { icon: Users, key: "writers", label: "WRITERS" },
  { icon: MessageSquare, key: "approvedComments", label: "COMMENTS" },
  { icon: Mail, key: "activeSubscribers", label: "SUBSCRIBERS" },
] satisfies Array<{
  icon: typeof FileText
  key:
    | "activeSubscribers"
    | "approvedComments"
    | "archivedPosts"
    | "draftPosts"
    | "publishedPosts"
    | "writers"
  label: string
}>

export default async function AdminDashboardPage() {
  const stats = await getCachedAdminDashboardStats()

  return (
    <div className="w-full">
      <AdminPageHeader
        subtitle="Content operations and audience analytics in one workspace"
        title="Dashboard"
      />

      <ScrollReveal
        className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mb-8 2xl:grid-cols-6"
        index={0}
      >
        {statCards.map(({ icon, key, label }) => (
          <AdminMetricCard
            icon={icon}
            key={key}
            label={label}
            trendTone="neutral"
            value={stats[key].toLocaleString()}
          />
        ))}
      </ScrollReveal>

      <ScrollReveal index={1}>
        <div className="mb-5">
          <h2 className="text-[18px] font-bold text-text-primary">Audience analytics</h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            Traffic and engagement from the last 30 days.
          </p>
        </div>
        <Suspense
          fallback={
            <section className="flex min-h-72 flex-col items-center justify-center rounded-[24px] border border-dashed border-border-default/60 text-center">
              <Loader className="mb-4" size="md" />
              <p className="text-xs font-medium text-text-secondary">
                Loading analytics...
              </p>
            </section>
          }
        >
          <AnalyticsWidget />
        </Suspense>
      </ScrollReveal>
    </div>
  )
}
