import type { Metadata } from "next"
import Link from "next/link"

import { PageContainer } from "@/components/layout/PageContainer"
import { StaticPostContent } from "@/components/posts/StaticPostContent"
import { getCachedContributors } from "@/lib/queries"
import { buildMetadata, getAppName } from "@/lib/seo"

interface ContributorsPageProps {
  searchParams: Promise<{ sort?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    canonicalPath: "/contributors",
    description: `Meet the writers behind ${getAppName()}.`,
    title: "Người đóng góp",
  })
}

function parseSort(sort?: string): "role" | "posts" {
  if (sort === "posts") {
    return sort
  }
  return "role"
}

export default async function ContributorsPage({ searchParams }: ContributorsPageProps) {
  const { sort: sortParam } = await searchParams
  const sort = parseSort(sortParam)
  
  const contributors = await getCachedContributors()

  const sortedContributors = [...contributors].sort((a, b) => {
    if (sort === "posts") {
      const postsDiff = b._count.posts - a._count.posts
      if (postsDiff !== 0) return postsDiff
    }

    // Default sorting: Role (ADMIN > WRITER), then Name alphabetically
    if (a.role === "ADMIN" && b.role === "WRITER") return -1
    if (a.role === "WRITER" && b.role === "ADMIN") return 1

    return a.name.localeCompare(b.name, "vi", { sensitivity: "base" })
  })

  const sortOptions: { value: "role" | "posts"; label: string }[] = [
    { value: "role", label: "Mặc định (Vai trò)" },
    { value: "posts", label: "Nhiều bài viết nhất" },
  ]

  return (
    <PageContainer>
      <section className="mb-8 border-b pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
              Người đóng góp
            </p>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight">Tác giả</h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Những người được mời viết phân tích, đánh giá và ghi chú sản xuất cho ấn phẩm này.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-medium text-text-tertiary">Sắp xếp:</span>
            <div className="flex rounded-md border border-border-default bg-subtle-bg/30 p-0.5" role="tablist" aria-label="Sắp xếp tác giả">
              {sortOptions.map((option) => {
                const isActive = sort === option.value
                const queryStr = option.value !== "role" ? `?sort=${option.value}` : "/contributors"
                return (
                  <Link
                    href={queryStr}
                    key={option.value}
                    role="tab"
                    aria-selected={isActive}
                    className={`rounded-[4px] px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-all ${
                      isActive
                        ? "bg-background text-editorial shadow-sm border border-border-default/60"
                        : "text-text-secondary hover:text-text-primary border border-transparent"
                    }`}
                  >
                    {option.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-5">
        {sortedContributors.map((contributor) => (
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
