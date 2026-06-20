import Link from "next/link"
import { Sparkles } from "lucide-react"

import { RelativeTime } from "@/components/ui/RelativeTime"
import { cn } from "@/lib/utils"

interface SidebarProps {
  archives?: {
    count: number
    month: string
  }[]
  categories: {
    _count: { posts: number }
    children: { id: string; name: string; slug: string }[]
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
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col gap-10 mt-4 lg:mt-0 lg:w-[240px]",
        className,
      )}
    >
      {newsletter && (
        <SidebarSection title="Bản tin">{newsletter}</SidebarSection>
      )}

      {newsletter && <SidebarDivider />}

      {categories.length > 0 && (
        <>
          <SidebarSection title="Danh mục">
            <ul className="flex flex-col gap-3 text-[13px]">
              {categories.map((category) => (
                <li key={category.id} className="flex flex-col">
                  <Link
                    className="flex justify-between text-text-primary hover:text-accent cursor-pointer group"
                    href={`/category/${category.slug}`}
                  >
                    <span className="group-hover:text-accent transition-colors">{category.name}</span>
                    <span className="text-text-tertiary">{category._count.posts}</span>
                  </Link>
                  {category.children.length > 0 && (
                    <ul className="flex flex-col gap-2 mt-2 ml-[6px] pl-3 border-l-[1px] border-border-default">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            className="flex justify-between text-text-secondary hover:text-accent cursor-pointer"
                            href={`/category/${child.slug}`}
                          >
                            <span>{child.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </SidebarSection>
          <SidebarDivider />
        </>
      )}

      {recentPosts.length > 0 && (
        <>
          <SidebarSection title="Bài viết gần đây">
            <ul className="flex flex-col gap-4">
              {recentPosts.map((post) => (
                <li key={post.slug} className="flex flex-col group cursor-pointer">
                  <Link
                    className="text-[13px] text-text-primary group-hover:text-accent leading-tight line-clamp-2 transition-colors"
                    href={`/${post.slug}`}
                  >
                    {post.title}
                  </Link>
                  {post.publishedAt && (
                    <RelativeTime
                      className="text-[12px] text-text-secondary mt-1"
                      date={post.publishedAt}
                    />
                  )}
                </li>
              ))}
            </ul>
          </SidebarSection>
          {archives.length > 0 && <SidebarDivider />}
        </>
      )}

      {archives.length > 0 && (
        <SidebarSection title="Lưu trữ">
          <ul className="flex flex-col gap-3 text-[13px]">
            {archives.map((archive) => (
              <li key={archive.month}>
                <Link
                  className="flex justify-between text-text-primary hover:text-accent cursor-pointer group"
                  href={`/?archive=${archive.month}`}
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

function SidebarDivider() {
  return <div className="h-[1px] w-full bg-border-default" />
}

function formatArchiveMonth(month: string) {
  const [yearPart, monthPart] = month.split("-")
  const date = new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1, 1))

  if (Number.isNaN(date.getTime())) {
    return month
  }

  return new Intl.DateTimeFormat("en-US", {
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
    <div className="flex flex-col">
      <h3 className="text-[13px] font-display font-bold text-accent uppercase tracking-wider mb-4 flex items-center gap-1">
        <Sparkles className="w-4 h-4" /> {title}
      </h3>
      {children}
    </div>
  )
}
