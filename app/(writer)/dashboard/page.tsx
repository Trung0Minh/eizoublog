import Link from "next/link"
import { redirect } from "next/navigation"
import { Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CoAuthorInviteActions } from "@/components/posts/CoAuthorInviteActions"
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
            Dashboard
          </p>
          <h1 className="text-2xl font-bold tracking-tight">My Posts</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/new" prefetch={false}>
            New post
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        {posts.map((post) => (
          <article
            className="flex flex-col gap-3 border-t py-4 transition-colors first:border-t-0 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
            key={post.id}
          >
            <div className="min-w-0">
              <h2 className="truncate font-medium">{post.title}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {post.status === "PUBLISHED" && post.publishedAt
                  ? `Published ${formatDate(post.publishedAt)}`
                  : (
                    <>
                      {post.draftVisibility === "PRIVATE" && (
                        <Lock aria-hidden="true" className="h-3 w-3" />
                      )}
                      <span>
                        Draft ·{" "}
                        {post.draftVisibility === "PRIVATE"
                          ? "Private"
                          : "Shared with co-authors"}{" "}
                        · Updated {formatDate(post.updatedAt)}
                      </span>
                    </>
                  )}
                {" · "}
                {post._count.comments} comment
                {post._count.comments === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {post.coAuthors?.some(c => c.userId === session.user.id && c.status === "PENDING") ? (
                <CoAuthorInviteActions postId={post.id} />
              ) : (
                <>
                  <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                    {post.status === "PUBLISHED" ? "Published" : "Draft"}
                  </Badge>
                  {post.status === "PUBLISHED" && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/${post.slug}`}>
                        View
                      </Link>
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/edit/${post.id}`} prefetch={false}>
                      Edit
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </article>
        ))}

        {posts.length === 0 && (
          <div className="rounded-[8px] border border-dashed p-8 text-center text-sm text-muted-foreground">
            No posts yet.{" "}
            <Link
              className="font-medium text-editorial hover:underline"
              href="/dashboard/new"
              prefetch={false}
            >
              Write your first post.
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
