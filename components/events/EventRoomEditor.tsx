"use client"

import type {
  AwardEventRoomStatus,
  AwardEventRoomVisibility,
  AwardEventStatus,
} from "@prisma/client"
import type { JSONContent } from "@tiptap/react"
import { ExternalLink, MessageSquare, Save, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { emptyAwardEventDoc } from "@/lib/awardEvents"

interface EventRoom {
  content: JSONContent
  contentText: string | null
  id: string
  status: AwardEventRoomStatus
  visibility: AwardEventRoomVisibility
  writerIntro: string | null
}

interface SharedRoom {
  comments: {
    author: { name: string; username: string }
    content: string
    createdAt: Date
    id: string
  }[]
  content: JSONContent
  id: string
  status: AwardEventRoomStatus
  writer: { name: string; username: string }
  writerIntro: string | null
}

interface EventRoomEditorProps {
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
  event,
  room,
  sharedRooms,
}: EventRoomEditorProps) {
  const router = useRouter()
  const [commentByRoom, setCommentByRoom] = useState<Record<string, string>>({})
  const [content, setContent] = useState<JSONContent>(room.content ?? emptyAwardEventDoc)
  const [contentText, setContentText] = useState(room.contentText ?? "")
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [status, setStatus] = useState<AwardEventRoomStatus>(room.status)
  const [visibility, setVisibility] = useState<AwardEventRoomVisibility>(room.visibility)
  const [writerIntro, setWriterIntro] = useState(room.writerIntro ?? "")

  async function save(nextStatus = status) {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch(`/api/events/${event.id}/room`, {
        body: JSON.stringify({
          content,
          contentText,
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
                Only submitted rooms appear in the final event article.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={isPending}
                onClick={() => void save()}
                size="sm"
                type="button"
                variant="outline"
              >
                <Save aria-hidden="true" className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button
                disabled={isPending}
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

          <div className="mb-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                Writer introduction
              </span>
              <Textarea
                className="min-h-24"
                maxLength={1000}
                onChange={(changeEvent) => setWriterIntro(changeEvent.target.value)}
                placeholder="A short intro that appears before your event section."
                value={writerIntro}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                Room visibility
              </span>
              <select
                className="h-10 w-full rounded-[5px] border bg-background px-3 text-sm"
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

          <div className="rounded-[8px] border border-border-default p-4">
            <TiptapEditor
              ariaLabel="Event room editor"
              content={content}
              editable
              onChange={(json, text) => {
                setContent(json)
                setContentText(text)
              }}
              placeholder="Write your personal picks, feelings, and awards..."
            />
          </div>
        </section>
      </main>

      <aside className="space-y-4">
        <div className="rounded-[8px] border bg-background p-5">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare aria-hidden="true" className="h-4 w-4 text-editorial" />
            <h2 className="text-sm font-semibold">Shared rooms</h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            These are participant rooms that writers chose to share for feedback.
          </p>
        </div>

        {sharedRooms.map((sharedRoom) => (
          <section
            className="rounded-[8px] border bg-background p-4"
            key={sharedRoom.id}
          >
            <h3 className="font-medium">{sharedRoom.writer.name}</h3>
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
