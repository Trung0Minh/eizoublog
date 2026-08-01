import type { Prisma } from "@prisma/client"
import { Bell, MessageSquare, PenLine, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { MarkCommentsReadButton } from "@/components/notifications/MarkCommentsReadButton"
import { ViewLink } from "@/components/notifications/ViewLink"
import { CoAuthorInviteActions } from "@/components/posts/CoAuthorInviteActions"
import { Button } from "@/components/ui/button"
import { RelativeTime } from "@/components/ui/RelativeTime"
import { TextReveal } from "@/components/ui/TextReveal"
import { getActiveSession } from "@/lib/authz"
import { getNotifications } from "@/lib/notifications"
import { cn } from "@/lib/utils"

type NotificationCategory = "collaboration" | "comments" | "moderation" | "system"

interface NotificationsPageProps {
  searchParams: Promise<{ type?: string }>
}

function isRecord(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringValue(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" ? value : ""
}

function excerpt(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed
}

interface EventRoomCommentNotification {
  author: {
    name: string
    username: string
  }
  content: string
  createdAt: Date | string
  event: {
    id: string
    title: string
  }
  id: string
  room: {
    id: string
    title: string
  }
}

function isEventRoomComment(value: unknown): value is EventRoomCommentNotification {
  return typeof value === "object" && value !== null && "room" in value && "event" in value
}

function timestamp(value: Date | string) {
  return value instanceof Date ? value.getTime() : Date.parse(value)
}

function moderationTitle(action: string) {
  switch (action) {
    case "UNPUBLISH":
      return "Bài viết đã bị rút khỏi xuất bản"
    case "PUBLISH":
      return "Bài viết đã được xuất bản lại"
    case "ARCHIVE":
      return "Bài viết đã được lưu trữ"
    case "RESTORE_ARCHIVED":
      return "Bài viết đã được khôi phục khỏi kho lưu trữ"
    case "REMOVE":
      return "Bài viết đã bị gỡ"
    case "RESTORE_REMOVED":
      return "Bài viết đã được khôi phục"
    default:
      return "Trạng thái bài viết đã được cập nhật"
  }
}

const categoryMeta = {
  collaboration: {
    icon: PenLine,
    label: "Cộng tác",
    tone: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  comments: {
    icon: MessageSquare,
    label: "Bình luận",
    tone: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  moderation: {
    icon: ShieldAlert,
    label: "Kiểm duyệt",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  system: {
    icon: ShieldAlert,
    label: "Hệ thống",
    tone: "border-destructive/25 bg-destructive/10 text-destructive",
  },
} satisfies Record<NotificationCategory, { icon: typeof Bell; label: string; tone: string }>

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    redirect("/login")
  }

  const [{ pendingInvites, responseEvents, unreadComments }, params] =
    await Promise.all([getNotifications(activeSession.user), searchParams])
  const selectedCategory: NotificationCategory | "all" | "unread" =
    params.type === "moderation" ||
    params.type === "system" ||
    params.type === "collaboration" ||
    params.type === "comments"
      ? params.type
      : params.type === "unread"
        ? "unread"
      : "all"

  const feed = [
    ...pendingInvites.map((invite) => ({
      category: "collaboration" as const,
      createdAt: invite.post.updatedAt,
      id: `invite-${invite.postId}`,
      kind: "invite" as const,
      value: invite,
    })),
    ...responseEvents.map((event) => ({
      category: event.type === "POST_MODERATION"
        ? "moderation" as const
        : event.type === "DURABILITY_ALERT"
          ? "system" as const
          : "collaboration" as const,
      createdAt: event.createdAt,
      id: event.id,
      kind: "event" as const,
      value: event,
    })),
    ...unreadComments.map((comment) => ({
      category: "comments" as const,
      createdAt: comment.createdAt,
      id: comment.id,
      kind: "comment" as const,
      value: comment,
    })),
  ].sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt))

  const visibleFeed = selectedCategory === "all"
    ? feed
    : selectedCategory === "unread"
      ? feed.filter((item) => item.kind !== "event" || !item.value.readAt)
      : feed.filter((item) => item.category === selectedCategory)
  const filters: Array<{
    category: NotificationCategory | "all" | "unread"
    href: string
    label: string
  }> = [
    { category: "all", href: "/dashboard/notifications", label: "Tất cả" },
    { category: "unread", href: "/dashboard/notifications?type=unread", label: "Chưa đọc" },
    { category: "moderation", href: "/dashboard/notifications?type=moderation", label: "Kiểm duyệt" },
    { category: "system", href: "/dashboard/notifications?type=system", label: "Hệ thống" },
    { category: "collaboration", href: "/dashboard/notifications?type=collaboration", label: "Cộng tác" },
    { category: "comments", href: "/dashboard/notifications?type=comments", label: "Bình luận" },
  ]

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Trung tâm thông báo
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary">
            <TextReveal text="Thông báo" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            Bình luận, cộng tác và quyết định kiểm duyệt trong một dòng thời gian.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MarkCommentsReadButton
            disabled={
              unreadComments.length === 0 &&
              !responseEvents.some((event) => !event.readAt)
            }
          />
          <Button asChild variant="outline">
            <Link href="/dashboard" prefetch={false}>Bài viết của tôi</Link>
          </Button>
        </div>
      </div>

      <nav aria-label="Lọc thông báo" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const active = selectedCategory === filter.category
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border border-border-default bg-background/55 px-4 py-2 text-sm font-medium text-text-secondary backdrop-blur-md transition-colors hover:border-accent/40 hover:text-text-primary",
                active && "border-accent bg-accent text-white hover:text-white",
              )}
              href={filter.href}
              key={filter.category}
              prefetch={false}
            >
              {filter.label}
            </Link>
          )
        })}
      </nav>

      {visibleFeed.length > 0 ? (
        <section aria-label="Dòng thời gian thông báo" className="overflow-hidden rounded-[24px] border border-border-default/60 bg-background/55 shadow-sm backdrop-blur-xl">
          <div className="divide-y divide-border-default/55">
            {visibleFeed.map((item) => {
              const meta = categoryMeta[item.category]
              const Icon = meta.icon

              return (
                <article
                  className="relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:p-6"
                  data-testid={`notification-${item.id}`}
                  key={`${item.kind}-${item.id}`}
                >
                  {(item.kind !== "event" || !item.value.readAt) && (
                    <span aria-hidden="true" className="absolute left-3 top-3 h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                  )}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-background/70 text-accent">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", meta.tone)}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-text-tertiary"><RelativeTime date={item.createdAt} /></span>
                    </div>

                    {item.kind === "invite" && (
                      <>
                        <p className="font-medium text-text-primary">Lời mời cộng tác cho “{item.value.post.title}”</p>
                        <p className="mt-1 text-sm leading-6 text-text-secondary">{item.value.post.author.name} mời bạn tham gia bài viết.</p>
                      </>
                    )}

                    {item.kind === "comment" && (
                      isEventRoomComment(item.value) ? (
                        <>
                          <p className="font-medium text-text-primary">
                            {item.value.author.name} đã gửi feedback trong “{item.value.room.title}”
                          </p>
                          <p className="mt-1 text-sm leading-6 text-text-secondary">
                            {item.value.event.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-text-secondary">{excerpt(item.value.content)}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-text-primary">{item.value.authorName} đã bình luận trong “{item.value.post.title}”</p>
                          <p className="mt-1 text-sm leading-6 text-text-secondary">{excerpt(item.value.content)}</p>
                        </>
                      )
                    )}

                    {item.kind === "event" && (() => {
                      const data = isRecord(item.value.data) ? item.value.data : {}
                      const postId = stringValue(data.postId)
                      const postTitle = stringValue(data.postTitle) || "bài viết"

                      if (item.value.type === "POST_MODERATION") {
                        const action = stringValue(data.action)
                        const reason = stringValue(data.reason)
                        return (
                          <>
                            <p className="font-medium text-text-primary">{moderationTitle(action)}</p>
                            <p className="mt-1 text-sm text-text-secondary">“{postTitle}”</p>
                            <blockquote className="mt-3 border-l-2 border-amber-500/70 pl-3 text-sm leading-6 text-text-primary">{reason}</blockquote>
                            {postId && stringValue(data.toStatus) === "DRAFT" && (
                              <ViewLink className="mt-3 inline-flex text-sm font-semibold text-editorial hover:underline" href={`/dashboard/edit/${postId}`} notificationId={item.value.id}>
                                Chỉnh sửa bài viết
                              </ViewLink>
                            )}
                          </>
                        )
                      }

                      if (item.value.type === "DURABILITY_ALERT") {
                        const severity = stringValue(data.severity) || "WARNING"
                        const issues = Array.isArray(data.issues)
                          ? data.issues.flatMap((issue) =>
                              isRecord(issue) && typeof issue.message === "string"
                                ? [issue.message]
                                : [],
                            )
                          : []
                        return (
                          <>
                            <p className="font-medium text-text-primary">
                              Post protection status: {severity.toLowerCase()}
                            </p>
                            {issues.map((issue) => (
                              <p className="mt-1 text-sm leading-6 text-text-secondary" key={issue}>{issue}</p>
                            ))}
                          </>
                        )
                      }

                      const accepted = item.value.type === "COAUTHOR_ACCEPTED"
                      const actorName = stringValue(data.actorName) || "Một đồng tác giả"
                      return (
                        <p className="text-sm leading-6 text-text-secondary">
                          <span className="font-medium text-text-primary">{actorName}</span>{" "}
                          {accepted ? "đã chấp nhận" : "đã từ chối"} lời mời cộng tác cho{" "}
                          {postId ? (
                            <ViewLink className="font-medium text-editorial hover:underline" href={`/dashboard/edit/${postId}`} notificationId={item.value.id}>{postTitle}</ViewLink>
                          ) : postTitle}
                        </p>
                      )
                    })()}
                  </div>

                  <div className="col-start-2 sm:col-auto sm:pt-1">
                    {item.kind === "invite" && <CoAuthorInviteActions postId={item.value.postId} />}
                    {item.kind === "comment" && (
                      <Button asChild size="sm" variant="outline">
                        {isEventRoomComment(item.value) ? (
                          <ViewLink
                            eventRoomCommentId={item.value.id}
                            href={`/dashboard/events/${item.value.event.id}/rooms/${item.value.room.id}`}
                          >
                            Xem
                          </ViewLink>
                        ) : (
                          <ViewLink commentId={item.value.id} href={`/${item.value.post.slug}#comment-${item.value.id}`}>Xem</ViewLink>
                        )}
                      </Button>
                    )}
                    {item.kind === "event" &&
                      item.value.type !== "POST_MODERATION" &&
                      item.value.type !== "DURABILITY_ALERT" &&
                      isRecord(item.value.data) &&
                      stringValue(item.value.data.postId) && (
                      <Button asChild size="sm" variant="outline">
                        <ViewLink href={`/dashboard/edit/${stringValue(item.value.data.postId)}`} notificationId={item.value.id}>Xem</ViewLink>
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        <div className="rounded-[24px] border border-dashed border-border-default bg-background/40 px-6 py-14 text-center backdrop-blur-md">
          <Bell aria-hidden="true" className="mx-auto h-8 w-8 text-text-tertiary" />
          <p className="mt-4 font-medium text-text-primary">Không có thông báo trong mục này.</p>
          <p className="mt-1 text-sm text-text-tertiary">Các cập nhật mới sẽ xuất hiện theo thứ tự thời gian.</p>
        </div>
      )}
    </main>
  )
}
