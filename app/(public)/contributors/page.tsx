import type { Metadata } from "next"
import Link from "next/link"

import { FourPointSparkle } from "@/components/ui/FourPointSparkle"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { ContributorBio } from "@/components/profile/ContributorBio"
import { RoleBadges } from "@/components/profile/RoleBadges"
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
      <main className="flex-1 w-full max-w-[1240px] mx-auto px-5 pt-8 md:pt-16 pb-20">
        <div className="text-center mb-16">
          <div className="mb-4 inline-grid grid-cols-[32px_auto_32px] items-center justify-center gap-3">
            <FourPointSparkle className="sparkle-glyph h-8 w-8 text-accent" />
            <h1 className="text-[36px] sm:text-[44px] md:text-[56px] font-display font-bold">
              <TextReveal
                text="Tác giả"
                className="animate-gradient-x bg-[linear-gradient(105deg,var(--accent)_0%,var(--season-logo-secondary,var(--accent))_48%,var(--accent)_100%)] bg-clip-text text-transparent [&>span:last-child]:mr-0"
              />
            </h1>
            <FourPointSparkle className="sparkle-glyph h-8 w-8 text-accent" />
          </div>
          <ScrollReveal delay={0.2}>
            <p className="text-[16px] text-text-secondary max-w-2xl mx-auto mb-6">
              Những người được mời viết phân tích, đánh giá và ghi chú sản xuất cho ấn phẩm này.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
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
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {sortedContributors.map((contributor, index) => (
            <ScrollReveal key={contributor.username} delay={index * 0.035}>
              <div className="glass-card group flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left overflow-hidden p-6">
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

              <div className="w-full min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Link href={`/authors/${contributor.username}`}>
                    <h2 className="text-[22px] font-display font-bold text-text-primary group-hover:text-accent transition-colors">
                      {contributor.name}
                    </h2>
                  </Link>
                  <RoleBadges
                    badgeClassName="rounded-md px-2 text-[11px]"
                    className="basis-full justify-center sm:basis-auto sm:justify-start"
                    displayRoleColor={contributor.displayRoleColor}
                    displayRoleName={contributor.displayRoleName}
                    role={contributor.role}
                  />
                </div>
                <div className="mb-4">
                  {contributor.bio ? (
                    <ContributorBio bio={contributor.bio} />
                  ) : (
                    <span className="text-[14px] text-text-secondary">
                      Chưa có tiểu sử.
                    </span>
                  )}
                </div>
                <div className="w-full bg-background/50 rounded-lg p-3 text-[12px] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-primary">Tên đăng nhập:</span> <Link href={`/authors/${contributor.username}`} className="text-text-secondary hover:text-accent">@{contributor.username}</Link>
                  </div>
                  <div>
                    <span className="font-bold text-text-primary">Bài viết:</span> <span className="text-text-secondary">{contributor._count.posts}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
        </div>
      </main>
    </div>
  )
}
