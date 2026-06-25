import { MessageSquare, PenLine } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import type { Prisma } from "@prisma/client"

import { MarkCommentsReadButton } from "@/components/notifications/MarkCommentsReadButton"
import { ViewLink } from "@/components/notifications/ViewLink"
import { CoAuthorInviteActions } from "@/components/posts/CoAuthorInviteActions"
import { Button } from "@/components/ui/button"
import { RelativeTime } from "@/components/ui/RelativeTime"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { TextReveal } from "@/components/ui/TextReveal"
import { getActiveSession } from "@/lib/authz"
import { getNotifications } from "@/lib/notifications"

function excerpt(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed
}

function isRecord(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringValue(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" ? value : ""
}

export default async function NotificationsPage() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    redirect("/login")
  }

  const { pendingInvites, responseEvents, unreadComments } = await getNotifications(
    activeSession.user,
  )

  const hasNotifications =
    pendingInvites.length > 0 ||
    responseEvents.length > 0 ||
    unreadComments.length > 0

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
            Theo dõi lời mời cộng tác và bình luận mới trên bài viết của bạn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MarkCommentsReadButton
            disabled={
              unreadComments.length === 0 && responseEvents.length === 0
            }
          />
          <Button asChild variant="outline">
            <Link href="/dashboard" prefetch={false}>
              Bài viết của tôi
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <ScrollReveal className="glass-card p-6" index={0}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 font-display text-lg font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
                <PenLine aria-hidden="true" className="h-4 w-4" />
              </span>
              Lời mời cộng tác
            </h2>
            <span className="inline-flex items-center justify-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
              {pendingInvites.length}
            </span>
          </div>

          <div className="divide-y divide-border-default/50">
            {pendingInvites.map((invite) => (
              <article
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={invite.postId}
              >
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">
                    {invite.post.title}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {invite.post.author.name} mời bạn cộng tác · cập nhật{" "}
                    <RelativeTime date={invite.post.updatedAt} />
                  </p>
                </div>
                <CoAuthorInviteActions postId={invite.postId} />
              </article>
            ))}

            {pendingInvites.length === 0 && (
              <p className="py-4 text-sm text-text-tertiary">
                Không có lời mời cộng tác mới.
              </p>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal className="glass-card p-6" index={1}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 font-display text-lg font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
                <PenLine aria-hidden="true" className="h-4 w-4" />
              </span>
              Phản hồi lời mời
            </h2>
            <span className="inline-flex items-center justify-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
              {responseEvents.length}
            </span>
          </div>

          <div className="divide-y divide-border-default/50">
            {responseEvents.map((event) => {
              const data = isRecord(event.data) ? event.data : {}
              const actorName = stringValue(data.actorName) || "Một đồng tác giả"
              const postId = stringValue(data.postId)
              const postTitle = stringValue(data.postTitle) || "bài viết"
              const accepted = event.type === "COAUTHOR_ACCEPTED"
              const postHref = postId ? `/dashboard/edit/${postId}` : ""

              return (
                <article
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={event.id}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-text-secondary">
                      <span className="font-medium text-text-primary">
                        {actorName}
                      </span>{" "}
                      {accepted ? "đã chấp nhận" : "đã từ chối"} lời mời cộng tác
                      cho{" "}
                      {postHref ? (
                        <ViewLink
                          className="font-medium text-editorial hover:underline"
                          href={postHref}
                          notificationId={event.id}
                        >
                          {postTitle}
                        </ViewLink>
                      ) : (
                        <span className="font-medium text-text-primary">
                          {postTitle}
                        </span>
                      )}
                    </p>
                    <p className="mt-2 text-xs text-text-tertiary">
                      <RelativeTime date={event.createdAt} />
                    </p>
                  </div>
                  {postHref && (
                    <Button asChild size="sm" variant="outline">
                      <ViewLink href={postHref} notificationId={event.id}>
                        Xem
                      </ViewLink>
                    </Button>
                  )}
                </article>
              )
            })}

            {responseEvents.length === 0 && (
              <p className="py-4 text-sm text-text-tertiary">
                Chưa có phản hồi lời mời mới.
              </p>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal className="glass-card p-6" index={2}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 font-display text-lg font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
                <MessageSquare
                  aria-hidden="true"
                  className="h-4 w-4"
                />
              </span>
              Bình luận mới
            </h2>
            <span className="inline-flex items-center justify-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
              {unreadComments.length}
            </span>
          </div>

          <div className="divide-y divide-border-default/50">
            {unreadComments.map((comment) => (
              <article className="p-4" key={comment.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-text-secondary">
                      <span className="font-medium text-text-primary">
                        {comment.authorName}
                      </span>{" "}
                      đã bình luận trong{" "}
                      <ViewLink
                        className="font-medium text-editorial hover:underline"
                        href={`/${comment.post.slug}#comment-${comment.id}`}
                        commentId={comment.id}
                      >
                        {comment.post.title}
                      </ViewLink>
                    </p>
                    <p className="mt-2 text-sm leading-6 text-text-primary">
                      {excerpt(comment.content)}
                    </p>
                    <p className="mt-2 text-xs text-text-tertiary">
                      <RelativeTime date={comment.createdAt} />
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <ViewLink
                      href={`/${comment.post.slug}#comment-${comment.id}`}
                      commentId={comment.id}
                    >
                      Xem
                    </ViewLink>
                  </Button>
                </div>
              </article>
            ))}

            {unreadComments.length === 0 && (
              <p className="py-4 text-sm text-text-tertiary">
                Không có bình luận mới.
              </p>
            )}
          </div>
        </ScrollReveal>

        {!hasNotifications && (
          <div className="rounded-[8px] border border-dashed p-8 text-center text-sm text-text-tertiary">
            Bạn đã xem hết thông báo.
          </div>
        )}
      </div>
    </main>
  )
}
