import Link from "next/link"

import { RelativeTime } from "@/components/ui/RelativeTime"
import { cn } from "@/lib/utils"

interface SidebarProps {
  archives?: {
    count: number
    month: string
  }[]
  categories: {
    _count: { posts: number }
    id: string
    name: string
    slug: string
  }[]
  className?: string
  newsletter?: React.ReactNode
  recentPosts: {
    publishedAt: Date | null
    slug: string
    title: string
  }[]
}

export function Sidebar({
  archives = [],
  categories,
  className,
  newsletter,
  recentPosts,
}: SidebarProps) {
  const visibleCategories = categories.filter(
    (category) => category._count.posts > 0,
  )

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col gap-6 mt-4 lg:mt-0 lg:w-[240px]",
        className,
      )}
    >
      {newsletter && (
        <SidebarSection title="Bản tin">{newsletter}</SidebarSection>
      )}

      {visibleCategories.length > 0 && (
        <SidebarSection title="Danh mục">
          <ul className="flex flex-col gap-3 text-[13px]">
            {visibleCategories.map((category) => (
              <li key={category.id} className="flex flex-col">
                <Link
                  className="flex justify-between text-text-primary hover:text-accent cursor-pointer group transition-transform duration-200 hover:translate-x-1.5"
                  href={`/category/${category.slug}`}
                >
                  <span className="group-hover:text-accent transition-colors">{category.name}</span>
                  <span className="text-text-tertiary">{category._count.posts}</span>
                </Link>
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}

      {recentPosts.length > 0 && (
        <SidebarSection title="Bài viết gần đây">
          <ul className="flex flex-col gap-4">
            {recentPosts.map((post) => (
              <li key={post.slug} className="flex flex-col group cursor-pointer">
                <Link
                  className="text-[13px] text-text-primary group-hover:text-accent leading-tight line-clamp-2 transition-all duration-200 group-hover:translate-x-1.5"
                  href={`/${post.slug}`}
                >
                  {post.title}
                </Link>
                {post.publishedAt && (
                  <RelativeTime
                    className="text-[12px] text-text-secondary mt-1 transition-all duration-200 group-hover:translate-x-1.5"
                    date={post.publishedAt}
                  />
                )}
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}

      {archives.length > 0 && (
        <SidebarSection title="Lưu trữ">
          <ul className="flex flex-col gap-3 text-[13px]">
            {archives.map((archive) => (
              <li key={archive.month}>
                <Link
                  className="flex justify-between text-text-primary hover:text-accent cursor-pointer group transition-transform duration-200 hover:translate-x-1.5"
                  href={`/archive/${archive.month}`}
                >
                  <span className="group-hover:text-accent transition-colors">{formatArchiveMonth(archive.month)}</span>
                  <span className="text-text-tertiary">{Number(archive.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}
    </aside>
  )
}

function formatArchiveMonth(month: string) {
  const [yearPart, monthPart] = month.split("-")
  const date = new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1, 1))

  if (Number.isNaN(date.getTime())) {
    return month
  }

  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)
}

function SidebarSection({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <div className="glass-card flex flex-col p-5">
      <h3 className="text-[13px] font-display font-bold text-accent uppercase tracking-wider mb-4 border-b border-border-default pb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}
