import Link from "next/link"
import { redirect } from "next/navigation"
import { Eye, Lock, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CoAuthorInviteActions } from "@/components/posts/CoAuthorInviteActions"
import { PostOwnerActions } from "@/components/posts/PostOwnerActions"
import { getCachedWriterDashboardPosts } from "@/lib/queries"
import { getCurrentSession } from "@/lib/session"
import { formatDate } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const posts = await getCachedWriterDashboardPosts(session.user.id)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
            Bảng điều khiển
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Bài viết của tôi</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/new" prefetch={false}>
            Bài viết mới
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        {posts.map((post) => {
          const isOwner = post.authorId === session.user.id
          const hasPendingInvite = post.coAuthors?.some(
            (coAuthor) =>
              coAuthor.userId === session.user.id &&
              coAuthor.status === "PENDING",
          )

          return (
            <article
              className="flex flex-col gap-3 border-t py-4 transition-colors first:border-t-0 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              key={post.id}
            >
              <div className="min-w-0">
                <h2 className="truncate font-medium">{post.title}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  {post.status === "PUBLISHED" && post.publishedAt
                    ? `Đã xuất bản ${formatDate(post.publishedAt)}`
                    : (
                      <>
                        {post.draftVisibility === "PRIVATE" && (
                          <Lock aria-hidden="true" className="h-3 w-3" />
                        )}
                        <span>
                          Bản nháp ·{" "}
                          {post.draftVisibility === "PRIVATE"
                            ? "Riêng tư"
                            : "Đã chia sẻ với đồng tác giả"}{" "}
                          · Đã cập nhật {formatDate(post.updatedAt)}
                        </span>
                      </>
                    )}
                  {" · "}
                  {post._count.comments} bình luận
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                {hasPendingInvite ? (
                  <CoAuthorInviteActions postId={post.id} />
                ) : (
                  <>
                    <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                      {post.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                    </Badge>
                    {post.status === "PUBLISHED" && (
                      <Button asChild size="icon" variant="ghost">
                        <Link
                          aria-label={`Xem ${post.title}`}
                          href={`/${post.slug}`}
                          title={`Xem ${post.title}`}
                        >
                          <Eye aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button asChild size="icon" variant="outline">
                      <Link
                        aria-label={`Chỉnh sửa ${post.title}`}
                        href={`/dashboard/edit/${post.id}`}
                        prefetch={false}
                        title={`Chỉnh sửa ${post.title}`}
                      >
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </Button>
                    {isOwner && (
                      <PostOwnerActions
                        postId={post.id}
                        status={post.status}
                        title={post.title}
                      />
                    )}
                  </>
                )}
              </div>
            </article>
          )
        })}

        {posts.length === 0 && (
          <div className="rounded-[8px] border border-dashed p-8 text-center text-sm text-muted-foreground">
            Chưa có bài viết nào.{" "}
            <Link
              className="font-medium text-editorial hover:underline"
              href="/dashboard/new"
              prefetch={false}
            >
              Viết bài đầu tiên của bạn.
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
