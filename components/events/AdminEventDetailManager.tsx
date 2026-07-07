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
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm"
    case "PUBLISHED":
      return "border-accent/30 bg-accent/10 text-accent shadow-sm"
    default:
      return "border-border-default bg-subtle-bg text-text-tertiary shadow-sm"
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

  async function patchEvent(
    body: object,
    options: { refreshOnSuccess?: boolean; rollbackRooms?: AdminEventRoom[] } = {},
  ) {
    setError("")
    setIsPending(true)
    const refreshOnSuccess = options.refreshOnSuccess ?? true

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

      if (refreshOnSuccess) {
        router.refresh()
      }
    } catch (caughtError) {
      if (options.rollbackRooms) {
        setRooms(options.rollbackRooms)
      }
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
    const previousRooms = rooms
    const current = nextRooms[index]
    nextRooms[index] = nextRooms[nextIndex]
    nextRooms[nextIndex] = current
    const ordered = nextRooms.map((room, order) => ({ ...room, order }))
    setRooms(ordered)
    void patchEvent(
      {
        roomOrder: ordered.map((room) => ({ id: room.id, order: room.order })),
      },
      { refreshOnSuccess: false, rollbackRooms: previousRooms },
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[5px] border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
          {error}
        </div>
      )}

      <section className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase",
                statusTone(event.status),
              )}
            >
              {event.status}
            </span>
            <p className="mt-3 text-[14px] font-medium text-text-secondary">
              <span className="font-bold text-text-primary">{submittedRooms.length}</span> submitted submissions are eligible for the final article.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isPending}
              onClick={() => void patchEvent({ status: "OPEN" })}
              className="h-10 rounded-full font-semibold px-4 transition-all hover:scale-105"
              type="button"
              variant="outline"
            >
              Open
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void patchEvent({ status: "CLOSED" })}
              className="h-10 rounded-full font-semibold px-4 transition-all hover:scale-105"
              type="button"
              variant="outline"
            >
              Close
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void action("shuffle")}
              className="h-10 rounded-full font-semibold px-4 transition-all hover:scale-105"
              type="button"
              variant="outline"
            >
              <Shuffle aria-hidden="true" className="mr-2 h-4 w-4" />
              Shuffle
            </Button>
            <Button
              disabled={isPending}
              onClick={() => void action("publish")}
              className="h-10 rounded-full font-bold px-5 bg-accent text-white shadow-md shadow-accent/20 transition-all hover:scale-105 hover:shadow-accent/40"
              type="button"
            >
              <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
              Publish/update
            </Button>
            {event.finalPost && (
              <Button asChild className="h-10 rounded-full font-semibold px-4 transition-all hover:scale-105" variant="ghost">
                <Link href={`/${event.finalPost.slug}`}>
                  <ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" />
                  View post
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 backdrop-blur-md p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-text-primary">
            Event introduction
          </h2>
          <Button
            disabled={isPending}
            onClick={() => void patchEvent({ introText })}
            className="h-9 rounded-full px-4 font-semibold hover:bg-accent/10 hover:text-accent hover:border-accent transition-colors"
            type="button"
            variant="outline"
          >
            Save intro
          </Button>
        </div>
        <Textarea
          className="min-h-32 rounded-[16px] border-border-default/60 bg-background/50 p-5 focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20 transition-all text-[14px] resize-y"
          onChange={(changeEvent) => setIntroText(changeEvent.target.value)}
          placeholder="Short editor intro shown before the entries list."
          value={introText}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center px-2 text-[12px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          Submissions
        </div>
        <div className="flex flex-col gap-3">
          {rooms.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border-default/50 bg-subtle-bg/20 p-12 text-center text-[14px] text-text-tertiary">
              No writers have joined yet.
            </div>
          ) : (
            rooms.map((room, index) => (
              <article
                className="group flex flex-col gap-4 rounded-[20px] border border-transparent bg-subtle-bg/40 p-5 transition-all duration-300 hover:border-accent/30 hover:bg-white/60 hover:shadow-md dark:hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                key={room.id}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-[16px] font-bold text-text-primary">
                      {room.writer.name}
                    </h3>
                    <span className="rounded-full border border-border-default/60 bg-background/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-text-secondary shadow-sm">
                      {room.status}
                    </span>
                    <span className="rounded-full border border-border-default/60 bg-background/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-text-secondary shadow-sm">
                      {room.visibility === "PARTICIPANTS" ? "Shared" : "Private"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] font-medium text-text-secondary">
                    <span className="text-accent">@{room.writer.username}</span>
                    <span className="mx-2 text-text-tertiary">·</span>
                    {room._count.comments} feedback comments
                  </p>
                  {room.selectedPost ? (
                    <div className="mt-3 flex items-center gap-2 rounded-[12px] border border-accent/20 bg-accent/5 p-3">
                      <p className="text-[14px] font-semibold text-text-primary truncate">
                        {room.selectedPost.title}
                      </p>
                      <span className="shrink-0 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary shadow-sm">
                        {room.selectedPost.status} source
                      </span>
                    </div>
                  ) : (
                    <p className="mt-3 text-[13px] font-medium italic text-text-tertiary">
                      No source post selected yet.
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-[16px] border border-border-default/50 bg-background/50 p-1.5 shadow-sm backdrop-blur-sm transition-all group-hover:border-accent/30 group-hover:bg-background/80">
                  <Button
                    disabled={index === 0 || isPending}
                    onClick={() => moveRoom(room.id, -1)}
                    className="h-9 w-9 rounded-[12px] text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
                    title="Move up"
                    type="button"
                    variant="ghost"
                    size="icon"
                  >
                    <ArrowUp aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <Button
                    disabled={index === rooms.length - 1 || isPending}
                    onClick={() => moveRoom(room.id, 1)}
                    className="h-9 w-9 rounded-[12px] text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
                    title="Move down"
                    type="button"
                    variant="ghost"
                    size="icon"
                  >
                    <ArrowDown aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <div className="h-5 w-px bg-border-default/50 mx-1"></div>
                  {room.selectedPost ? (
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-[12px] text-text-secondary hover:bg-accent/10 hover:text-accent">
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
                      className="h-9 w-9 rounded-[12px]"
                    >
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
