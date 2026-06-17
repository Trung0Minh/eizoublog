"use client"

import type {
  AwardEventRoomStatus,
  AwardEventStatus,
  PostStatus,
} from "@prisma/client"
import { ArrowDown, ArrowUp, ExternalLink, Eye, Shuffle, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface AdminEventRoom {
  _count: { comments: number }
  excludedAt: Date | null
  id: string
  order: number
  postId: string | null
  selectedPost: {
    id: string
    status: PostStatus
    title: string
  } | null
  status: AwardEventRoomStatus
  updatedAt: Date
  visibility: "PRIVATE" | "PARTICIPANTS"
  writer: { name: string; username: string }
}

interface AdminEventDetail {
  finalPost: { slug: string } | null
  id: string
  introText: string | null
  rooms: AdminEventRoom[]
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

function statusTone(status: AwardEventStatus) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "PUBLISHED":
      return "bg-accent/10 text-accent"
    default:
      return "bg-subtle-bg text-text-tertiary"
  }
}

export function AdminEventDetailManager({
  event,
}: {
  event: AdminEventDetail
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [introText, setIntroText] = useState(event.introText ?? "")
  const [isPending, setIsPending] = useState(false)
  const [rooms, setRooms] = useState(event.rooms)

  const submittedRooms = useMemo(
    () =>
      rooms.filter(
        (room) => room.status === "SUBMITTED" && !room.excludedAt && room.selectedPost,
      ),
    [rooms],
  )

  async function patchEvent(body: object) {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Event update failed")
    } finally {
      setIsPending(false)
    }
  }

  async function action(path: "publish" | "shuffle") {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch(`/api/admin/events/${event.id}/${path}`, {
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Action failed")
    } finally {
      setIsPending(false)
    }
  }

  function moveRoom(roomId: string, direction: -1 | 1) {
    const index = rooms.findIndex((room) => room.id === roomId)
    const nextIndex = index + direction

    if (index < 0 || nextIndex < 0 || nextIndex >= rooms.length) {
      return
    }

    const nextRooms = [...rooms]
    const current = nextRooms[index]
    nextRooms[index] = nextRooms[nextIndex]
    nextRooms[nextIndex] = current
    const ordered = nextRooms.map((room, order) => ({ ...room, order }))
    setRooms(ordered)
    void patchEvent({
      roomOrder: ordered.map((room) => ({ id: room.id, order: room.order })),
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[5px] border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
          {error}
        </div>
      )}

      <section className="rounded-[8px] border border-border-default bg-background p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                statusTone(event.status),
              )}
            >
              {event.status}
            </span>
            <p className="mt-2 text-[13px] text-text-secondary">
              {submittedRooms.length} submitted submissions are eligible for the final article.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isPending}
              onClick={() => void patchEvent({ status: "OPEN" })}
              size="sm"
              type="button"
              variant="outline"
            >
              Open
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void patchEvent({ status: "CLOSED" })}
              size="sm"
              type="button"
              variant="outline"
            >
              Close
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void action("shuffle")}
              size="sm"
              type="button"
              variant="outline"
            >
              <Shuffle aria-hidden="true" className="mr-2 h-4 w-4" />
              Shuffle
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void action("publish")}
              size="sm"
              type="button"
            >
              <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
              Publish/update
            </Button>
            {event.finalPost && (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/${event.finalPost.slug}`}>
                  <ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" />
                  View post
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[8px] border border-border-default bg-background p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text-primary">
            Event introduction
          </h2>
          <Button
            disabled={isPending}
            onClick={() => void patchEvent({ introText })}
            size="sm"
            type="button"
            variant="outline"
          >
            Save intro
          </Button>
        </div>
        <Textarea
          className="min-h-28"
          onChange={(changeEvent) => setIntroText(changeEvent.target.value)}
          placeholder="Short editor intro shown before the entries list."
          value={introText}
        />
      </section>

      <section className="overflow-hidden rounded-[8px] border border-border-default bg-background">
        <div className="flex h-10 items-center border-b border-border-default bg-subtle-bg px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
          Submissions
        </div>
        {rooms.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-text-tertiary">
            No writers have joined yet.
          </div>
        ) : (
          rooms.map((room, index) => (
            <article
              className="flex flex-col gap-3 border-b border-border-default p-4 last:border-0 md:flex-row md:items-center md:justify-between"
              key={room.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-text-primary">
                    {room.writer.name}
                  </h3>
                  <span className="rounded-full bg-subtle-bg px-2 py-0.5 text-[11px] text-text-secondary">
                    {room.status}
                  </span>
                  <span className="rounded-full bg-subtle-bg px-2 py-0.5 text-[11px] text-text-secondary">
                    {room.visibility === "PARTICIPANTS" ? "Shared" : "Private"}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-text-tertiary">
                  @{room.writer.username} · {room._count.comments} feedback comments
                </p>
                {room.selectedPost ? (
                  <p className="mt-2 text-[13px] text-text-secondary">
                    {room.selectedPost.title}
                    <span className="ml-2 text-[12px] text-text-tertiary">
                      {room.selectedPost.status} source post
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] text-text-tertiary">
                    No source post selected yet.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  disabled={index === 0 || isPending}
                  onClick={() => moveRoom(room.id, -1)}
                  size="icon"
                  title="Move up"
                  type="button"
                  variant="outline"
                >
                  <ArrowUp aria-hidden="true" className="h-4 w-4" />
                </Button>
                <Button
                  disabled={index === rooms.length - 1 || isPending}
                  onClick={() => moveRoom(room.id, 1)}
                  size="icon"
                  title="Move down"
                  type="button"
                  variant="outline"
                >
                  <ArrowDown aria-hidden="true" className="h-4 w-4" />
                </Button>
                {room.selectedPost ? (
                  <Button asChild size="icon" variant="ghost">
                    <Link
                      href={`/dashboard/preview/${room.selectedPost.id}`}
                      title="Preview selected post"
                    >
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    disabled
                    size="icon"
                    title="No selected post to preview"
                    type="button"
                    variant="ghost"
                  >
                    <Eye aria-hidden="true" className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
