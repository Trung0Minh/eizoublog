import { MessageSquare, PenLine } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { MarkCommentsReadButton } from "@/components/notifications/MarkCommentsReadButton"
import { CoAuthorInviteActions } from "@/components/posts/CoAuthorInviteActions"
import { Button } from "@/components/ui/button"
import { getActiveSession } from "@/lib/authz"
import { getNotifications } from "@/lib/notifications"
import { formatDate } from "@/lib/utils"

function excerpt(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed
}

export default async function NotificationsPage() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    redirect("/login")
  }

  const { pendingInvites, unreadComments } = await getNotifications(
    activeSession.user,
  )

  const hasNotifications =
    pendingInvites.length > 0 || unreadComments.length > 0

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
            Trung tâm thông báo
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Thông báo</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            Theo dõi lời mời cộng tác và bình luận mới trên bài viết của bạn.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard" prefetch={false}>
            Bài viết của tôi
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <PenLine aria-hidden="true" className="h-4 w-4 text-editorial" />
              Lời mời cộng tác
            </h2>
            <span className="text-xs text-text-tertiary">
              {pendingInvites.length} lời mời
            </span>
          </div>

          <div className="divide-y rounded-[8px] border">
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
                    {formatDate(invite.post.updatedAt)}
                  </p>
                </div>
                <CoAuthorInviteActions postId={invite.postId} />
              </article>
            ))}

            {pendingInvites.length === 0 && (
              <p className="p-4 text-sm text-text-tertiary">
                Không có lời mời cộng tác mới.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <MessageSquare
                aria-hidden="true"
                className="h-4 w-4 text-editorial"
              />
              Bình luận mới
            </h2>
            <MarkCommentsReadButton disabled={unreadComments.length === 0} />
          </div>

          <div className="divide-y rounded-[8px] border">
            {unreadComments.map((comment) => (
              <article className="p-4" key={comment.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-text-secondary">
                      <span className="font-medium text-text-primary">
                        {comment.authorName}
                      </span>{" "}
                      đã bình luận trong{" "}
                      <Link
                        className="font-medium text-editorial hover:underline"
                        href={`/${comment.post.slug}#comment-${comment.id}`}
                      >
                        {comment.post.title}
                      </Link>
                    </p>
                    <p className="mt-2 text-sm leading-6 text-text-primary">
                      {excerpt(comment.content)}
                    </p>
                    <p className="mt-2 text-xs text-text-tertiary">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/${comment.post.slug}#comment-${comment.id}`}>
                      Xem
                    </Link>
                  </Button>
                </div>
              </article>
            ))}

            {unreadComments.length === 0 && (
              <p className="p-4 text-sm text-text-tertiary">
                Không có bình luận mới.
              </p>
            )}
          </div>
        </section>

        {!hasNotifications && (
          <div className="rounded-[8px] border border-dashed p-8 text-center text-sm text-text-tertiary">
            Bạn đã xem hết thông báo.
          </div>
        )}
      </div>
    </main>
  )
}
