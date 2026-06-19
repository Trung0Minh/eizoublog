import type { Metadata } from "next"
import Link from "next/link"
import { Sparkles } from "lucide-react"

import { PageContainer } from "@/components/layout/PageContainer"
import { TextReveal } from "@/components/ui/TextReveal"
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
    { value: "role", label: "Vai trò" },
    { value: "posts", label: "Nhiều bài viết nhất" },
  ]

  return (
    <div className="min-h-screen flex flex-col pt-0">
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 pt-8 md:pt-16 pb-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
            <h1 className="text-[36px] md:text-[48px] font-display font-bold text-text-primary">
              <TextReveal text="Tác giả" />
            </h1>
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
          </div>
          <p className="text-[16px] text-text-secondary max-w-2xl mx-auto mb-6">
            Những người được mời viết phân tích, đánh giá và ghi chú sản xuất cho ấn phẩm này.
          </p>

          <div className="flex justify-center items-center gap-2">
            <div className="flex rounded-full border-[2px] border-border-default bg-subtle-bg/30 p-1 backdrop-blur-sm" role="tablist" aria-label="Sắp xếp tác giả">
              {sortOptions.map((option) => {
                const isActive = sort === option.value
                const queryStr = option.value !== "role" ? `?sort=${option.value}` : "/contributors"
                return (
                  <Link
                    href={queryStr}
                    key={option.value}
                    role="tab"
                    aria-selected={isActive}
                    className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      isActive
                        ? "bg-accent text-white shadow-md"
                        : "text-text-secondary hover:text-text-primary hover:bg-subtle-bg/50"
                    }`}
                  >
                    {option.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {sortedContributors.map((contributor) => (
            <div key={contributor.username} className="group bg-subtle-bg/30 backdrop-blur-md transition-all duration-300 border-[2px] border-border-default hover:border-accent/40 rounded-[24px] p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left hover:shadow-lg relative overflow-hidden">
              <Link href={`/authors/${contributor.username}`} className="w-[120px] h-[120px] shrink-0 relative rounded-full overflow-hidden border-4 border-background shadow-md group-hover:scale-105 transition-transform block">
                {contributor.avatarUrl ? (
                  <img
                    alt={contributor.name}
                    className="w-full h-full object-cover"
                    decoding="async"
                    loading="lazy"
                    src={contributor.avatarUrl}
                  />
                ) : (
                  <span className="flex w-full h-full items-center justify-center bg-muted font-display font-bold text-4xl text-text-primary">
                    {contributor.name.charAt(0)}
                  </span>
                )}
              </Link>

              <div className="flex-1">
                <div className="inline-block bg-accent/10 text-accent text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
                  {contributor.role === "ADMIN" ? "ADMIN" : "WRITER"}
                </div>
                <Link href={`/authors/${contributor.username}`}>
                  <h2 className="text-[22px] font-display font-bold text-text-primary mb-2 group-hover:text-accent transition-colors">
                    {contributor.name}
                  </h2>
                </Link>
                <div className="text-[14px] text-text-secondary mb-4 line-clamp-3">
                  {contributor.bio ? (
                    <div className="[&_.ProseMirror]:!ml-0 [&_.ProseMirror>p]:!ml-0">
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
                  ) : (
                    <span>Chưa có tiểu sử.</span>
                  )}
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-[12px] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-primary">Username:</span> <Link href={`/authors/${contributor.username}`} className="text-text-secondary hover:text-accent">@{contributor.username}</Link>
                  </div>
                  <div>
                    <span className="font-bold text-text-primary">Posts:</span> <span className="text-text-secondary">{contributor._count.posts}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
