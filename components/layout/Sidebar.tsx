import Link from "next/link"

import { cn, formatDate } from "@/lib/utils"

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
        "flex w-full shrink-0 flex-col gap-12 lg:w-[240px]",
        className,
      )}
    >
      {newsletter && (
        <SidebarSection title="Bản tin">{newsletter}</SidebarSection>
      )}

      {categories.length > 0 && (
        <SidebarSection title="Danh mục">
          <ul className="flex flex-col text-sm">
            {categories.map((category) => (
              <li key={category.id} className="group">
                <Link
                  className="flex items-center justify-between border-b border-border-default py-2.5 transition-colors last:border-0 group-hover:text-accent"
                  href={`/category/${category.slug}`}
                >
                  <span>{category.name}</span>
                  <span className="text-[12px] text-text-tertiary">
                    {category._count.posts}
                  </span>
                </Link>
                {category.children.length > 0 && (
                  <ul className="ml-3 mt-2 flex flex-col gap-2 border-l border-border-default pl-3">
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          className="block text-[13px] text-text-secondary transition-colors hover:text-accent"
                          href={`/category/${child.slug}`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}

      {recentPosts.length > 0 && (
        <SidebarSection title="Bài viết gần đây">
          <ul className="space-y-4">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  className="line-clamp-2 text-[13px] font-medium leading-snug transition-colors hover:text-accent"
                  href={`/${post.slug}`}
                >
                  {post.title}
                </Link>
                {post.publishedAt && (
                  <p className="mt-1 text-[12px] text-text-tertiary">
                    {formatDate(post.publishedAt)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </SidebarSection>
      )}

      {archives.length > 0 && (
        <SidebarSection title="Lưu trữ">
          <ul className="flex flex-col text-sm">
            {archives.map((archive) => (
              <li key={archive.month}>
                <Link
                  className="flex items-center justify-between border-b border-border-default py-2.5 transition-colors last:border-0 hover:text-accent"
                  href={`/?archive=${archive.month}`}
                >
                  <span>{formatArchiveMonth(archive.month)}</span>
                  <span className="text-[12px] text-text-tertiary">
                    {archive.count}
                  </span>
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
    <section>
      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-text-secondary">
        {title}
      </h3>
      {children}
    </section>
  )
}
