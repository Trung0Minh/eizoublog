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
  hasMore?: {
    archives?: boolean
    categories?: boolean
    recentComments?: boolean
  }
  newsletter?: React.ReactNode
  recentComments?: {
    authorName: string
    content: string
    createdAt: Date
    id: string
    post: {
      slug: string
      title: string
    }
  }[]
  recentPosts: {
    publishedAt: Date | null
    slug: string
    title: string
  }[]
}

const SIDEBAR_ITEM_LIMIT = 5

export function Sidebar({
  archives = [],
  categories,
  className,
  hasMore,
  newsletter,
  recentComments = [],
  recentPosts,
}: SidebarProps) {
  const visibleArchives = archives.slice(0, SIDEBAR_ITEM_LIMIT)
  const visibleCategories = categories
    .filter((category) => category._count.posts > 0)
    .slice(0, SIDEBAR_ITEM_LIMIT)
  const visibleRecentComments = recentComments.slice(0, SIDEBAR_ITEM_LIMIT)
  const visibleRecentPosts = recentPosts.slice(0, SIDEBAR_ITEM_LIMIT)

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

      {visibleRecentPosts.length > 0 && (
        <SidebarSection title="Bài viết gần đây">
          <ul className="flex flex-col gap-4">
            {visibleRecentPosts.map((post) => (
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

      {visibleRecentComments.length > 0 && (
        <SidebarSection title="Bình luận gần đây">
          <ul className="flex flex-col gap-4">
            {visibleRecentComments.map((comment) => (
              <li key={comment.id} className="flex flex-col group cursor-pointer">
                <Link
                  className="flex flex-col text-text-primary transition-all duration-200 hover:text-accent group-hover:translate-x-1.5"
                  href={`/${comment.post.slug}#comment-${comment.id}`}
                >
                  <span className="text-[13px] leading-tight line-clamp-2">
                    <span className="font-medium">{comment.authorName}</span>
                    {": "}
                    {comment.content}
                  </span>
                  <span className="mt-1 text-[12px] leading-tight text-text-secondary line-clamp-1 group-hover:text-accent">
                    {comment.post.title}
                  </span>
                </Link>
                <RelativeTime
                  className="text-[12px] text-text-secondary mt-1 transition-all duration-200 group-hover:translate-x-1.5"
                  date={comment.createdAt}
                />
              </li>
            ))}
          </ul>
          {hasMore?.recentComments && (
            <SidebarMoreLink href="/comments" label="bình luận" />
          )}
        </SidebarSection>
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
          {hasMore?.categories && (
            <SidebarMoreLink href="/category" label="danh mục" />
          )}
        </SidebarSection>
      )}

      {visibleArchives.length > 0 && (
        <SidebarSection title="Lưu trữ">
          <ul className="flex flex-col gap-3 text-[13px]">
            {visibleArchives.map((archive) => (
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
          {hasMore?.archives && (
            <SidebarMoreLink href="/archive" label="lưu trữ" />
          )}
        </SidebarSection>
      )}
    </aside>
  )
}

function formatArchiveMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return month
  }

  const [yearPart, monthPart] = month.split("-")
  const monthNumber = Number(monthPart)

  if (monthNumber < 1 || monthNumber > 12) {
    return month
  }

  return `${monthPart}/${yearPart}`
}

function SidebarMoreLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="mt-4 inline-flex w-fit text-[12px] font-medium text-accent transition-transform duration-200 hover:translate-x-1"
      href={href}
    >
      Xem thêm <span className="sr-only">{label}</span>
    </Link>
  )
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
