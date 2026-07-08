import Link from "next/link"
import { redirect } from "next/navigation"
import { Eye, Pencil, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { TextReveal } from "@/components/ui/TextReveal"
import { RelativeTime } from "@/components/ui/RelativeTime"
import { CoAuthorInviteActions } from "@/components/posts/CoAuthorInviteActions"
import { PostOwnerActions } from "@/components/posts/PostOwnerActions"
import { getCachedWriterDashboardPosts } from "@/lib/queries"
import { getCurrentSession } from "@/lib/session"

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
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Bảng điều khiển
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary">
            <TextReveal text={`Chào, ${session.user.name}! ✨`} />
          </h1>
        </div>
        <Button asChild size="icon" className="rounded-full bg-accent text-white hover:bg-accent/90 shrink-0">
          <Link href="/dashboard/new" prefetch={false} title="Bài viết mới">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {posts.map((post, index) => {
          const isOwner = post.authorId === session.user.id
          const hasPendingInvite = post.coAuthors?.some(
            (coAuthor) =>
              coAuthor.userId === session.user.id &&
              coAuthor.status === "PENDING",
          )

          return (
            <ScrollReveal key={post.id} index={index}>
              <article className="glass-card flex flex-col gap-3 p-5 transition-colors sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-medium">{post.title}</h2>
                    <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"} className="shrink-0 h-5 px-1.5 text-[10px]">
                      {post.status === "PUBLISHED" ? "Đã xuất bản" : "Nháp"}
                    </Badge>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    {post.status === "PUBLISHED" && post.publishedAt ? (
                      <span>
                        Đã xuất bản <RelativeTime date={post.publishedAt} />
                      </span>
                    ) : (
                      <span>
                        Bản nháp · Đã cập nhật <RelativeTime date={post.updatedAt} />
                      </span>
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
                      {post.status === "PUBLISHED" && (
                        <Button asChild size="icon" variant="ghost" className="hover:bg-subtle-bg text-text-secondary hover:text-text-primary">
                          <Link
                            aria-label="Xem bài viết"
                            href={`/${post.slug}`}
                            title="Xem"
                          >
                            <Eye aria-hidden="true" className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button asChild size="icon" variant="outline" className="hover:bg-subtle-bg text-text-secondary hover:text-text-primary">
                        <Link
                          aria-label="Chỉnh sửa bài viết"
                          href={`/dashboard/edit/${post.id}`}
                          prefetch={false}
                          title="Chỉnh sửa"
                        >
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                        </Link>
                      </Button>
                      {isOwner && (
                        <PostOwnerActions
                          postId={post.id}
                          status={post.status}
                        />
                      )}
                    </>
                  )}
                </div>
              </article>
            </ScrollReveal>
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
