import type { Metadata } from "next"
import Link from "next/link"

import { PageContainer } from "@/components/layout/PageContainer"
import { StaticPostContent } from "@/components/posts/StaticPostContent"
import { getCachedContributors } from "@/lib/queries"
import { buildMetadata, getAppName } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    canonicalPath: "/contributors",
    description: `Meet the writers behind ${getAppName()}.`,
    title: "Người đóng góp",
  })
}

export default async function ContributorsPage() {
  const contributors = await getCachedContributors()

  return (
    <PageContainer>
      <section className="mb-10 border-b pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Người đóng góp
        </p>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight">Tác giả</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Những người được mời viết phân tích, đánh giá và ghi chú sản xuất cho ấn phẩm này.
        </p>
      </section>

      <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-6">
        {contributors.map((contributor) => (
          <Link
            className="flex gap-4 border-t py-5 transition-colors first:border-t-0 hover:text-editorial sm:[&:nth-child(2)]:border-t-0"
            href={`/authors/${contributor.username}`}
            key={contributor.username}
          >
            {contributor.avatarUrl ? (
              <img
                alt={contributor.name}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
                decoding="async"
                loading="lazy"
                src={contributor.avatarUrl}
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                {contributor.name.charAt(0)}
              </span>
            )}
            <span>
              <span className="flex items-center gap-2">
                <span className="font-semibold">{contributor.name}</span>
                <span className="flex items-center gap-1">
                  {contributor.role === "ADMIN" && (
                    <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">Admin</span>
                  )}
                  {(contributor.role === "ADMIN" || contributor.role === "WRITER") && (
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Writer</span>
                  )}
                </span>
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                @{contributor.username} · {contributor._count.posts} bài viết
              </span>
              {contributor.bio && (
                <div className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground [&_.ProseMirror]:!ml-0 [&_.ProseMirror>p]:!ml-0 [&_.ProseMirror]:line-clamp-2">
                  {(() => {
                    if (contributor.bio.startsWith("{")) {
                      try {
                        const json = JSON.parse(contributor.bio)
                        return <StaticPostContent content={json} />
                      } catch {}
                    }
                    return <span>{contributor.bio}</span>
                  })()}
                </div>
              )}
            </span>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
