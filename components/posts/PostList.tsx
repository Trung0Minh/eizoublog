"use client"

import { motion } from "motion/react"

import { PostCard, type PostCardPost } from "@/components/posts/PostCard"
import { Pagination } from "@/components/ui/Pagination"

interface PostListProps {
  emptyMessage?: string
  pagination?: {
    page: number
    pageSize: number
    query?: Record<string, number | string | undefined>
    total: number
  }
  posts: PostCardPost[]
}

export function PostList({
  emptyMessage = "No posts found.",
  pagination,
  posts,
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-border-default p-8 text-center text-sm text-text-secondary">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <motion.div 
        className="flex flex-col gap-6 md:gap-8"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
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
