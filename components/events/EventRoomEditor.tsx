"use client"

import type {
  AwardEventRoomStatus,
  AwardEventRoomVisibility,
  PostStatus,
} from "@prisma/client"
import { CheckCircle2, ExternalLink, FileText, Send, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

interface EventRoom {
  id: string
  postId: string | null
  selectedPost: {
    id: string
    status: PostStatus
    title: string
    version: number
  } | null
  status: AwardEventRoomStatus
  submittedPostId: string | null
  submittedPostVersion: number | null
  visibility: AwardEventRoomVisibility
}

interface EligiblePost {
  id: string
  status: PostStatus
  title: string
  updatedAt: Date
  version: number
}

interface EventRoomEditorProps {
  eligiblePosts: EligiblePost[]
  event: {
    finalPost: { slug: string; status: PostStatus } | null
    id: string
    status: string
    title: string
  }
  room: EventRoom
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
}: EventRoomEditorProps) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [postId, setPostId] = useState(room.postId ?? "")
  const [status, setStatus] = useState<AwardEventRoomStatus>(room.status)
  const [submittedPostId, setSubmittedPostId] = useState(room.submittedPostId)
  const [submittedPostVersion, setSubmittedPostVersion] = useState(
    room.submittedPostVersion,
  )
  const [visibility, setVisibility] = useState<AwardEventRoomVisibility>(room.visibility)

  const controlsDisabled = event.status === "CLOSED"
  const selectedEligiblePost = eligiblePosts.find((post) => post.id === postId)
  const updateAvailable =
    status === "SUBMITTED" &&
    (!submittedPostId ||
      submittedPostId !== postId ||
      (selectedEligiblePost?.version ?? 0) > (submittedPostVersion ?? 0))
  const actionLabel = status === "SUBMITTED" ? "Cập nhật bài dự thi" : "Nộp bài dự thi"

  async function submit() {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch(`/api/events/${event.id}/room`, {
        body: JSON.stringify({
          postId: postId || null,
          status: "SUBMITTED",
          visibility,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setStatus("SUBMITTED")
      setSubmittedPostId(postId || null)
      setSubmittedPostVersion(selectedEligiblePost?.version ?? null)
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nộp bài thất bại")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-[14px] border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </div>
      )}
      <section className="overflow-hidden rounded-[16px] border border-border-default/80 dark:border-white/10 bg-background/60 dark:bg-background/40 shadow-[0_18px_60px_rgba(31,24,38,0.08)] backdrop-blur-md hover:-translate-y-0.5 hover:shadow-lg hover:border-accent/30 transition-all duration-300 ease-out">
        <div className="flex flex-col items-stretch gap-4 border-b border-border-default/70 bg-subtle-bg/55 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:px-7" data-testid="submission-header">
          <div className="flex min-w-0 items-start gap-3 sm:items-center" data-testid="submission-heading-row">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent">
              {status === "SUBMITTED" ? (
                <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              ) : (
                <FileText aria-hidden="true" className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary">
                {status === "SUBMITTED" ? "Bài dự thi đã được gửi" : "Chọn bài cho sự kiện"}
              </p>
              {updateAvailable && (
                <span className="mt-1 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  Có bản cập nhật
                </span>
              )}
              <p className="mt-0.5 text-xs leading-5 text-text-secondary">
                {status === "SUBMITTED"
                  ? "Bạn có thể thay đổi lựa chọn và gửi lại khi sự kiện còn mở."
                  : "Chọn một bài viết rồi gửi cho quản trị viên."}
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            <Button
              aria-label={actionLabel}
              className="h-10 flex-1 rounded-[13px] bg-accent px-4 text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-colors hover:bg-accent/90 sm:h-11 sm:flex-none sm:rounded-[14px]"
              disabled={isPending || controlsDisabled || !postId}
              onClick={() => void submit()}
              title={actionLabel}
              type="button"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              <span>{actionLabel}</span>
            </Button>
            {event.finalPost?.status === "PUBLISHED" && (
              <Button asChild className="h-10 w-10 rounded-[13px] sm:h-11 sm:w-11 sm:rounded-[14px]" size="icon" variant="outline">
                <Link
                  aria-label="Mở bài viết công khai"
                  href={`/${event.finalPost.slug}`}
                  title="Mở bài viết công khai"
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {controlsDisabled && (
          <div className="mx-5 mt-5 rounded-[14px] border border-border-default bg-muted/50 p-4 text-sm text-text-secondary sm:mx-7">
            Sự kiện này đã đóng, bài dự thi hiện chỉ ở chế độ xem.
          </div>
        )}

        <div className="space-y-7 p-5 sm:p-7">
          <div
            className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.38fr)]"
            data-testid="submission-primary-row"
          >
            <label className="block" htmlFor="submission-post">
              <span className="mb-2 flex min-h-5 items-center gap-2 text-xs font-bold uppercase leading-none tracking-[0.12em] text-text-tertiary">
                <FileText aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
                Bài viết được chọn
              </span>
              <select
                className="h-12 w-full rounded-[14px] border border-border-default bg-background px-4 text-sm font-semibold text-text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
                disabled={controlsDisabled || isPending}
                id="submission-post"
                onChange={(changeEvent) => setPostId(changeEvent.target.value)}
                value={postId}
              >
                <option value="">Chọn một bài viết nháp hoặc đã xuất bản</option>
                {eligiblePosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title} ({post.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="block" htmlFor="submission-visibility">
              <span className="mb-2 flex min-h-5 items-center gap-2 text-xs font-bold uppercase leading-none tracking-[0.12em] text-text-tertiary">
                <Users aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
                Ai có thể xem
              </span>
              <select
                className="h-12 w-full rounded-[14px] border border-border-default bg-background px-4 text-sm font-semibold text-text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
                disabled={controlsDisabled || isPending}
                id="submission-visibility"
                onChange={(changeEvent) =>
                  setVisibility(changeEvent.target.value as AwardEventRoomVisibility)
                }
                value={visibility}
              >
                <option value="PRIVATE">Chỉ tôi và quản trị viên</option>
                <option value="PARTICIPANTS">Tất cả người tham gia</option>
              </select>
            </label>
          </div>
        </div>
      </section>
    </div>
  )
}
