import { redirect } from "next/navigation"

import { WriterEventsList } from "@/components/events/WriterEventsList"
import { TextReveal } from "@/components/ui/TextReveal"
import { getCachedWriterEvents } from "@/lib/queries"
import { getCurrentSession } from "@/lib/session"

export default async function DashboardEventsPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const events = await getCachedWriterEvents(session.user.id)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
          Sự kiện viết
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary">
          <TextReveal text="Sự kiện viết" />
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          Tham gia các sự kiện viết mở và gửi phần nội dung của bạn cho bài viết tổng hợp cuối cùng.
        </p>
      </div>
      <WriterEventsList events={events} />
    </main>
  )
}
