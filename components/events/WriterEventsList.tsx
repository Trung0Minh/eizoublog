"use client"

import type { AwardEventRoomStatus, AwardEventStatus } from "@prisma/client"
import { ArrowRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { cn } from "@/lib/utils"

interface WriterEventItem {
  _count: { rooms: number }
  finalPost: { slug: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REMOVED" } | null
  id: string
  rooms: { id: string; status: AwardEventRoomStatus }[]
  status: AwardEventStatus
  title: string
}

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Something went wrong"
}

const eventStatusMeta: Record<AwardEventStatus, { label: string; tone: string }> = {
  CLOSED: {
    label: "Đã đóng",
    tone: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  OPEN: {
    label: "Đang mở",
    tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
}

const roomStatusMeta: Record<AwardEventRoomStatus, { label: string; tone: string }> = {
  DRAFT: {
    label: "Bản nháp",
    tone: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  SUBMITTED: {
    label: "Đã gửi",
    tone: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
}

export function WriterEventsList({ events }: { events: WriterEventItem[] }) {
  const router = useRouter()
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function joinEvent(eventId: string) {
    setJoiningId(eventId)
    setError("")

    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.push(`/dashboard/events/${eventId}`)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to join event")
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-[6px] border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {events.map((event, index) => {
        const room = event.rooms[0] ?? null
        const eventStatus = eventStatusMeta[event.status]
        const roomStatus = room ? roomStatusMeta[room.status] : null

        return (
          <ScrollReveal key={event.id} index={index}>
            <article className="glass-card flex flex-col gap-3 p-5 transition-colors sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium text-text-primary">
                    {room ? (
                    <Link
                        className="transition-colors hover:text-accent hover:underline"
                        href={`/dashboard/events/${event.id}`}
                        prefetch={false}
                      >
                        {event.title}
                      </Link>
                    ) : (
                      event.title
                    )}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-semibold",
                      eventStatus.tone,
                    )}
                  >
                    {eventStatus.label}
                  </span>
                  {roomStatus && (
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-semibold",
                        roomStatus.tone,
                      )}
                    >
                      {roomStatus.label}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event._count.rooms} phòng viết
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!room && event.status === "OPEN" && (
                  <Button
                    disabled={joiningId === event.id}
                    onClick={() => void joinEvent(event.id)}
                    size="icon"
                    title="Tham gia"
                    type="button"
                    className="rounded-full bg-accent text-white hover:bg-accent/90"
                  >
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Button>
                )}
                  {event.finalPost?.status === "PUBLISHED" && (
                  <Button asChild size="sm" variant="ghost" className="rounded-full">
                    <Link href={`/${event.finalPost.slug}`}>
                      <ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" />
                      Bài viết công khai
                    </Link>
                  </Button>
                )}
              </div>
            </article>
          </ScrollReveal>
        )
      })}
      {events.length === 0 && (
        <div className="rounded-[24px] border border-dashed border-border-default bg-subtle-bg/30 p-8 text-center text-sm text-text-secondary">
          Hiện tại không có sự kiện viết nào mở.
        </div>
      )}
    </div>
  )
}
