"use client"

import type {
  AwardEventRoomStatus,
  AwardEventRoomVisibility,
  AwardEventStatus,
  PostStatus,
} from "@prisma/client"
import type { JSONContent } from "@tiptap/react"
import { ExternalLink, FileText, MessageSquare, Save, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { StaticPostContent } from "@/components/posts/StaticPostContent"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

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

interface SharedRoom {
  comments: {
    author: { name: string; username: string }
    content: string
    createdAt: Date
    id: string
  }[]
  id: string
  postId: string | null
  selectedPost: {
    content: JSONContent
    contentText: string | null
    id: string
    status: PostStatus
    title: string
  } | null
  status: AwardEventRoomStatus
  writer: { name: string; username: string }
  writerIntro: string | null
}

interface EventRoomEditorProps {
  eligiblePosts: EligiblePost[]
  event: {
    finalPost: { slug: string } | null
    id: string
    status: AwardEventStatus
    title: string
  }
  room: EventRoom
  sharedRooms: SharedRoom[]
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
  sharedRooms,
}: EventRoomEditorProps) {
  const router = useRouter()
  const [commentByRoom, setCommentByRoom] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [postId, setPostId] = useState(room.postId ?? "")
  const [status, setStatus] = useState<AwardEventRoomStatus>(room.status)
  const [visibility, setVisibility] = useState<AwardEventRoomVisibility>(room.visibility)
  const [writerIntro, setWriterIntro] = useState(room.writerIntro ?? "")
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

  async function postComment(roomId: string) {
    const comment = commentByRoom[roomId]?.trim()
    if (!comment) return

    setError("")
    setIsPending(true)

    try {
      const response = await fetch(`/api/events/${event.id}/rooms/${roomId}/comments`, {
        body: JSON.stringify({ content: comment }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setCommentByRoom((current) => ({ ...current, [roomId]: "" }))
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to post comment")
    } finally {
      setIsPending(false)
    }
  }

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
            <h2 className="text-sm font-semibold">Shared rooms</h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            These are participant submissions that writers chose to share for feedback.
          </p>
        </div>

        {sharedRooms.map((sharedRoom) => (
          <section
            className="rounded-[8px] border bg-background p-4"
            key={sharedRoom.id}
          >
            <h3 className="font-medium">{sharedRoom.writer.name}</h3>
            {sharedRoom.selectedPost && (
              <div className="mt-2 rounded-[6px] border border-border-default bg-muted/20 p-3">
                <div className="text-sm font-medium">
                  {sharedRoom.selectedPost.title}
                </div>
                <div className="mt-2 max-h-[28rem] overflow-auto post-content text-sm">
                  <StaticPostContent content={sharedRoom.selectedPost.content} />
                </div>
              </div>
            )}
            {sharedRoom.writerIntro && (
              <p className="mt-1 text-xs italic text-muted-foreground">
                {sharedRoom.writerIntro}
              </p>
            )}
            <div className="mt-3 space-y-2">
              {sharedRoom.comments.map((comment) => (
                <div
                  className="rounded-[6px] bg-muted/50 p-2 text-xs"
                  key={comment.id}
                >
                  <div className="font-medium">{comment.author.name}</div>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {comment.content}
                  </p>
                </div>
              ))}
              {sharedRoom.comments.length === 0 && (
                <p className="text-xs text-muted-foreground">No feedback yet.</p>
              )}
            </div>
            <Textarea
              className="mt-3 min-h-20 text-sm"
              onChange={(changeEvent) =>
                setCommentByRoom((current) => ({
                  ...current,
                  [sharedRoom.id]: changeEvent.target.value,
                }))
              }
              placeholder="Leave private feedback..."
              value={commentByRoom[sharedRoom.id] ?? ""}
            />
            <Button
              className="mt-2 w-full"
              disabled={isPending || !(commentByRoom[sharedRoom.id] ?? "").trim()}
              onClick={() => void postComment(sharedRoom.id)}
              size="sm"
              type="button"
              variant="outline"
            >
              Comment
            </Button>
          </section>
        ))}
      </aside>
    </div>
  )
}
