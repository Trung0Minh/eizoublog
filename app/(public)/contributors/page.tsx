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

      <div className="flex flex-col gap-5">
        {contributors.map((contributor) => (
          <div
            className="flex flex-col sm:flex-row items-start gap-5 rounded-[12px] border border-border-default bg-subtle-bg/30 p-6 transition-all hover:border-accent/40 hover:bg-subtle-bg/60 hover:shadow-sm"
            key={contributor.username}
          >
            <Link href={`/authors/${contributor.username}`} className="shrink-0">
              {contributor.avatarUrl ? (
                <img
                  alt={contributor.name}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                  decoding="async"
                  loading="lazy"
                  src={contributor.avatarUrl}
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-lg">
                  {contributor.name.charAt(0)}
                </span>
              )}
            </Link>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/authors/${contributor.username}`} className="font-bold text-lg hover:text-accent transition-colors">
                  {contributor.name}
                </Link>
                <div className="flex items-center gap-1">
                  {contributor.role === "ADMIN" && (
                    <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">ADMIN</span>
                  )}
                  {contributor.role === "WRITER" && (
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">WRITER</span>
                  )}
                </div>
              </div>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                <Link href={`/authors/${contributor.username}`} className="hover:text-accent">@{contributor.username}</Link> · {contributor._count.posts} bài viết
              </span>
              {contributor.bio && (
                <div className="mt-3 text-sm leading-relaxed text-text-secondary [&_.ProseMirror]:!ml-0 [&_.ProseMirror>p]:!ml-0">
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
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
