"use client"

import type {
  AwardEventRoomStatus,
  AwardEventRoomVisibility,
  PostStatus,
} from "@prisma/client"
import { ExternalLink, FileText, Save, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

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

interface EventRoomEditorProps {
  eligiblePosts: EligiblePost[]
  event: {
    finalPost: { slug: string } | null
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
      setError(caughtError instanceof Error ? caughtError.message : "Lưu thất bại")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-[6px] border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <section className="rounded-[8px] border bg-background p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase text-muted-foreground">
              {status}
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              Chọn một trong những bài viết hiện tại của bạn. Các bài dự thi sẽ xuất hiện khi quản trị viên cập nhật bài viết sự kiện.
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
              Lưu
            </Button>
            <Button
              disabled={isPending || controlsDisabled || !postId}
              onClick={() => void save("SUBMITTED")}
              size="sm"
              type="button"
            >
              <Send aria-hidden="true" className="mr-2 h-4 w-4" />
              Nộp bài
            </Button>
            {event.finalPost && (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/${event.finalPost.slug}`}>
                  <ExternalLink aria-hidden="true" className="mr-2 h-4 w-4" />
                  Bài viết công khai
                </Link>
              </Button>
            )}
          </div>
        </div>

        {controlsDisabled && (
          <div className="mb-4 rounded-[6px] border border-border-default bg-muted/40 p-3 text-sm text-muted-foreground">
            Sự kiện này đã đóng, bài dự thi hiện chỉ ở chế độ xem.
          </div>
        )}

        <div className="mb-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_13rem]">
          <label className="block md:col-span-2" htmlFor="submission-post">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              Bài dự thi
            </span>
            <select
              className="h-10 w-full rounded-[5px] border bg-background px-3 text-sm"
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
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              Giới thiệu người viết
            </span>
            <Textarea
              className="min-h-24 bg-background border border-border-default focus:border-accent"
              disabled={controlsDisabled || isPending}
              maxLength={1000}
              onChange={(changeEvent) => setWriterIntro(changeEvent.target.value)}
              placeholder="Một đoạn giới thiệu ngắn hiển thị trước phần của bạn trong sự kiện."
              value={writerIntro}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              Quyền riêng tư bài dự thi
            </span>
            <select
              className="h-10 w-full rounded-[5px] border bg-background px-3 text-sm"
              disabled={controlsDisabled || isPending}
              onChange={(changeEvent) =>
                setVisibility(changeEvent.target.value as AwardEventRoomVisibility)
              }
              value={visibility}
            >
              <option value="PRIVATE">Riêng tư</option>
              <option value="PARTICIPANTS">Chia sẻ với những người tham gia</option>
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
              {selectedPost.status} · Chỉnh sửa bài viết gốc trong Bài viết của tôi, sau đó nhờ
              quản trị viên cập nhật bài viết sự kiện.
            </p>
          </div>
        ) : (
          <div className="rounded-[8px] border border-dashed border-border-default p-5 text-sm text-muted-foreground">
            Tạo hoặc lưu một bản nháp trong Bài viết của tôi, sau đó chọn ở đây cho sự kiện.
          </div>
        )}
      </section>
    </div>
  )
}
