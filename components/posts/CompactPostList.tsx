'use client'

import Link from "next/link"
import { FileText, MessageSquare } from "lucide-react"
import { motion } from "motion/react"

import { getCoverStyle } from "@/lib/cover-style"
import { Pagination } from "@/components/ui/Pagination"
import { RelativeTime } from "@/components/ui/RelativeTime"
import type { PostCardPost } from "@/components/posts/PostCard"
import { cn } from "@/lib/utils"

interface CompactPostListProps {
  emptyMessage?: string
  pagination?: {
    page: number
    pageSize: number
    query?: Record<string, number | string | undefined>
    total: number
  }
  posts: PostCardPost[]
}

export function CompactPostList({
  emptyMessage = "Không tìm thấy bài viết.",
  pagination,
  posts,
}: CompactPostListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-border-default p-8 text-center text-sm text-text-secondary">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <motion.div 
        className="flex flex-col gap-4"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
      >
        {posts.map((post, index) => {
          const tags = post.tags.map(({ tag }) => tag)

          return (
            <motion.article
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
              }}
              whileHover={{ y: -4 }}
              className={cn(
                "glass-card grid gap-3 p-4 transition-colors hover:bg-subtle-bg/60 sm:gap-5 sm:p-5",
                post.coverUrl
                  ? "grid-cols-[24px_minmax(0,1fr)] sm:grid-cols-[32px_140px_minmax(0,1fr)]"
                  : "grid-cols-[24px_minmax(0,1fr)] sm:grid-cols-[32px_minmax(0,1fr)]",
              )}
              key={post.slug}
            >
              <div className="pt-1.5 text-center text-sm font-semibold text-text-tertiary">
                {index + 1}
              </div>
              {post.coverUrl && (
                <Link
                  aria-label={post.title}
                  className="relative col-start-2 block aspect-[16/9] w-full overflow-hidden rounded-[8px] border border-border-default bg-subtle-bg sm:col-start-auto sm:w-[140px]"
                  href={`/${post.slug}`}
                >
                  <img
                    alt={post.coverAlt ?? post.title}
                    className="w-full h-full object-cover"
                    decoding="async"
                    loading="lazy"
                    src={(post.coverUrl || "").split("?")[0]}
                    style={getCoverStyle(post.coverUrl)}
                  />
                </Link>
              )}
              <div className={cn("min-w-0 py-0.5", post.coverUrl && "col-start-2 sm:col-start-auto")}>
                <div className="flex flex-wrap items-center gap-1.5">
                  {!post.coverUrl && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent" title="Bài viết không có ảnh bìa">
                      <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <Link
                    className="line-clamp-2 text-[15px] font-semibold leading-snug text-text-primary hover:text-accent sm:text-[17px]"
                    href={`/${post.slug}`}
                  >
                    {post.title}
                  </Link>
                  {post.category && (
                    <Link
                      className="rounded-[4px] bg-subtle-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-accent border border-border-default/50"
                      href={`/category/${post.category.slug}`}
                    >
                      {post.category.name}
                    </Link>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                  {post.publishedAt && <RelativeTime date={post.publishedAt} />}
                  <span>bởi {post.author.name}</span>
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <MessageSquare aria-hidden="true" className="h-3 w-3" />
                    {post._count.comments} bình luận
                  </span>
                </div>
                {post.excerpt && (
                  <p className="mt-1 break-words text-xs leading-relaxed text-text-secondary [overflow-wrap:anywhere]">
                    {post.excerpt}
                  </p>
                )}
                {tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tags.slice(0, 4).map((tag) => (
                      <Link
                        className="text-[11px] text-text-tertiary hover:text-accent"
                        href={`/tag/${tag.slug}`}
                        key={tag.slug}
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.article>
          )
        })}
      </motion.div>

      {pagination && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          query={pagination.query}
          total={pagination.total}
        />
      )}
    </div>
  )
}
