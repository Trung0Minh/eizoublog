"use client"

import type {
  AwardEventRoomStatus,
  AwardEventRoomVisibility,
  AwardEventStatus,
  PostStatus,
} from "@prisma/client"
import { ExternalLink, FileText, MessageSquare, Save, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RoomDetailDrawer } from "@/components/events/RoomDetailDrawer"

interface EventRoom {
  id: string
  postId: string | null
  selectedPost: {
    id: string
    status: PostStatus
    title: string
  } | null
  status: AwardEventRoomStatus
  visibility: AwardEventRoomVisibility
  writerIntro: string | null
}

interface EligiblePost {
  id: string
  status: PostStatus
  title: string
  updatedAt: Date
}

interface ParticipantRoom {
  id: string
  postId: string | null
  selectedPost: {
    id: string
    status: string
    title: string
  } | null
  status: string
  visibility: string
  writer: { id: string; name: string; username: string; avatarUrl: string | null }
  writerIntro: string | null
}

interface EventRoomEditorProps {
  eligiblePosts: EligiblePost[]
  event: {
    finalPost: { slug: string } | null
    id: string
    status: string
    title: string
  }
  room: EventRoom
  participantRooms: ParticipantRoom[]
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

export function EventRoomEditor({
  eligiblePosts,
  event,
  room,
  participantRooms,
}: EventRoomEditorProps) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [postId, setPostId] = useState(room.postId ?? "")
  const [status, setStatus] = useState<AwardEventRoomStatus>(room.status)
  const [visibility, setVisibility] = useState<AwardEventRoomVisibility>(room.visibility)
  const [writerIntro, setWriterIntro] = useState(room.writerIntro ?? "")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeRoom, setActiveRoom] = useState<ParticipantRoom | null>(null)

  const controlsDisabled = event.status === "CLOSED" || event.status === "ARCHIVED"
  const selectedPost = eligiblePosts.find((post) => post.id === postId) ?? room.selectedPost

  async function save(nextStatus = status) {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch(`/api/events/${event.id}/room`, {
        body: JSON.stringify({
          postId: postId || null,
          status: nextStatus,
          visibility,
          writerIntro,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setStatus(nextStatus)
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to save room")
    } finally {
      setIsPending(false)
    }
  }

  const otherParticipants = participantRooms.filter((pr) => pr.id !== room.id)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <main className="min-w-0 space-y-4">
        {error && (
          <div className="rounded-[6px] border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <section className="rounded-[8px] border bg-background p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {status}
              </span>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose one of your existing posts. Submitted entries appear when
                admin updates the final event article.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={isPending || controlsDisabled}
                onClick={() => void save()}
                size="sm"
                type="button"
                variant="outline"
              >
                <Save aria-hidden="true" className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button
                disabled={isPending || controlsDisabled || !postId}
                onClick={() => void save("SUBMITTED")}
                size="sm"
                type="button"
              >
                <Send aria-hidden="true" className="mr-2 h-4 w-4" />
                Submit
              </Button>
              {event.finalPost && (
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/${event.finalPost.slug}`}>
                    <ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" />
                    Public post
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {controlsDisabled && (
            <div className="mb-4 rounded-[6px] border border-border-default bg-muted/40 p-3 text-sm text-muted-foreground">
              This event is closed, so submissions are read-only.
            </div>
          )}

          <div className="mb-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_13rem]">
            <label className="block md:col-span-2" htmlFor="submission-post">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                Submission post
              </span>
              <select
                className="h-10 w-full rounded-[5px] border bg-background px-3 text-sm"
                disabled={controlsDisabled || isPending}
                id="submission-post"
                onChange={(changeEvent) => setPostId(changeEvent.target.value)}
                value={postId}
              >
                <option value="">Choose a draft or published post</option>
                {eligiblePosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title} ({post.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                Writer introduction
              </span>
              <Textarea
                className="min-h-24"
                disabled={controlsDisabled || isPending}
                maxLength={1000}
                onChange={(changeEvent) => setWriterIntro(changeEvent.target.value)}
                placeholder="A short intro that appears before your event section."
                value={writerIntro}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                Submission visibility
              </span>
              <select
                className="h-10 w-full rounded-[5px] border bg-background px-3 text-sm"
                disabled={controlsDisabled || isPending}
                onChange={(changeEvent) =>
                  setVisibility(changeEvent.target.value as AwardEventRoomVisibility)
                }
                value={visibility}
              >
                <option value="PRIVATE">Private</option>
                <option value="PARTICIPANTS">Share with participants</option>
              </select>
            </label>
          </div>

          {selectedPost ? (
            <div className="rounded-[8px] border border-border-default bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText aria-hidden="true" className="h-4 w-4 text-editorial" />
                {selectedPost.title}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedPost.status} · Edit the source post from My posts, then ask
                admin to update the final event article.
              </p>
            </div>
          ) : (
            <div className="rounded-[8px] border border-dashed border-border-default p-5 text-sm text-muted-foreground">
              Create or save a draft in My posts, then select it here for the event.
            </div>
          )}
        </section>
      </main>

      <aside className="space-y-4">
        <div className="rounded-[8px] border bg-background p-5">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare aria-hidden="true" className="h-4 w-4 text-editorial" />
            <h2 className="text-sm font-semibold">Participants</h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Writers collaborating in this event room.
          </p>
        </div>

        {otherParticipants.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-1">No other participants yet.</p>
        ) : (
          <div className="space-y-4">
            {otherParticipants.map((pr) => (
              <section
                className="rounded-[8px] border bg-background p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
                key={pr.id}
              >
                {/* Header: Avatar and Name */}
                <div className="flex items-center gap-3">
                  {pr.writer.avatarUrl ? (
                    <img
                      src={pr.writer.avatarUrl}
                      alt={pr.writer.name}
                      className="h-9 w-9 rounded-full object-cover border border-border-default"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground border border-border-default">
                      {pr.writer.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{pr.writer.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">@{pr.writer.username}</p>
                  </div>
                </div>

                {/* Intro if exists */}
                {pr.writerIntro && (
                  <p className="text-xs italic text-muted-foreground line-clamp-2">
                    "{pr.writerIntro}"
                  </p>
                )}

                {/* Submission Info */}
                <div className="space-y-2 border-t pt-3">
                  {!pr.postId || !pr.selectedPost ? (
                    <span className="text-xs text-muted-foreground italic">Not selected yet</span>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground line-clamp-2">
                          {pr.selectedPost.title}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {pr.visibility === "PARTICIPANTS" ? (
                          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15" variant="outline">
                            Shared
                          </Badge>
                        ) : (
                          <Badge className="border-border bg-muted text-muted-foreground hover:bg-muted" variant="outline">
                            Private
                          </Badge>
                        )}

                        {pr.status === "SUBMITTED" && (
                          <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/15" variant="outline">
                            Submitted
                          </Badge>
                        )}
                      </div>

                      {/* Action Button */}
                      {pr.visibility === "PARTICIPANTS" && (
                        <Button
                          className="w-full mt-1.5 font-medium"
                          onClick={() => {
                            setActiveRoom(pr)
                            setDrawerOpen(true)
                          }}
                          size="sm"
                          variant="outline"
                        >
                          View & Comment
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </aside>

      {activeRoom && (
        <RoomDetailDrawer
          eventId={event.id}
          roomId={activeRoom.id}
          postId={activeRoom.postId}
          writerName={activeRoom.writer.name}
          writerIntro={activeRoom.writerIntro}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </div>
  )
}
