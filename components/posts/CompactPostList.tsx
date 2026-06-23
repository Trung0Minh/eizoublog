'use client'

import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { motion } from "motion/react"

import { getCoverStyle } from "@/lib/cover-style"
import { Pagination } from "@/components/ui/Pagination"
import { RelativeTime } from "@/components/ui/RelativeTime"
import type { PostCardPost } from "@/components/posts/PostCard"

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
  emptyMessage = "No posts found.",
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
        className="divide-y divide-border-default overflow-hidden rounded-[6px] border border-border-default bg-background"
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
              className="glass-card grid grid-cols-[34px_80px_minmax(0,1fr)] gap-2 px-2 py-2 transition-colors hover:bg-subtle-bg/60 sm:grid-cols-[42px_120px_minmax(0,1fr)] sm:gap-3"
              key={post.slug}
            >
              <div className="pt-1 text-center text-xs font-semibold text-text-tertiary">
                {index + 1}
              </div>
              <Link
                aria-label={post.title}
                className="block relative overflow-hidden rounded-[3px] border border-border-default bg-subtle-bg w-[80px] sm:w-[120px] aspect-[16/9]"
                href={`/${post.slug}`}
              >
                {post.coverUrl ? (
                  <img
                    alt={post.coverAlt ?? post.title}
                    className="w-full h-full object-cover"
                    decoding="async"
                    loading="lazy"
                    src={(post.coverUrl || "").split("?")[0]}
                    style={getCoverStyle(post.coverUrl)}
                  />
                ) : (
                  <div className="flex w-full h-full items-center justify-center text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                    Post
                  </div>
                )}
              </Link>
              <div className="min-w-0 py-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    className="line-clamp-2 text-[15px] font-semibold leading-snug text-text-primary hover:text-accent sm:text-[17px]"
                    href={`/${post.slug}`}
                  >
                    {post.title}
                  </Link>
                  {post.category && (
                    <Link
                      className="rounded-[3px] bg-subtle-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-accent"
                      href={`/category/${post.category.slug}`}
                    >
                      {post.category.name}
                    </Link>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                  {post.publishedAt && <RelativeTime date={post.publishedAt} />}
                  <span>by {post.author.name}</span>
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <MessageSquare aria-hidden="true" className="h-3 w-3" />
                    {post._count.comments} comments
                  </span>
                </div>
                {post.excerpt && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-secondary">
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
