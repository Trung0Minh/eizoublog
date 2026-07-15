'use client'

import Link from "next/link"
import { motion } from "motion/react"

import { RelativeTime } from "@/components/ui/RelativeTime"
import { getCoverStyle } from "@/lib/cover-style"

export interface PostCardPost {
  _count: { comments: number }
  author: {
    avatarUrl: string | null
    name: string
    username: string
  }
  category: { id?: string; name: string; slug: string } | null
  coAuthors: {
    user: {
      avatarUrl?: string | null
      name: string
      username: string
    }
  }[]
  coverAlt: string | null
  coverUrl: string | null
  excerpt: string | null
  publishedAt: Date | string | null
  slug: string
  tags: { tag: { id?: string; name: string; slug: string } }[]
  title: string
}

interface PostCardProps {
  post: PostCardPost
}

function AuthorAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl?: string | null
  name: string
}) {
  if (avatarUrl) {
    return (
      <img
        alt={name}
        className="h-6 w-6 rounded-full border border-border-default bg-subtle-bg object-cover"
        decoding="async"
        loading="lazy"
        src={avatarUrl}
      />
    )
  }

  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border-default bg-subtle-bg text-[10px] font-medium text-text-primary">
      {name.charAt(0)}
    </span>
  )
}

export function PostCard({ post }: PostCardProps) {
  const authors = [post.author, ...post.coAuthors.map(({ user }) => user)]
  const tags = post.tags.map(({ tag }) => tag)

  return (
    <motion.article 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-card w-full group flex flex-col p-4"
    >
      {post.coverUrl && (
        <Link className="mb-4 block overflow-hidden rounded-[8px]" href={`/${post.slug}`}>
          <div className="relative w-full aspect-video isolate bg-subtle-bg rounded-[8px] overflow-hidden border-2 border-border-default group-hover:border-accent/40 transition-colors">
            <img
              alt={post.coverAlt ?? post.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] group-hover:-rotate-1"
              style={getCoverStyle(post.coverUrl)}
              decoding="async"
              loading="lazy"
              src={(post.coverUrl || "").split("?")[0]}
            />
          </div>
        </Link>
      )}

      {post.category && (
        <Link
          className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-accent transition-colors hover:text-accent/80"
          href={`/category/${post.category.slug}`}
        >
          {post.category.name}
        </Link>
      )}

      <Link className="group-hover:text-accent transition-colors block" href={`/${post.slug}`}>
        <h2 className="text-[20px] font-display font-bold text-text-primary leading-[1.3] line-clamp-2">
          {post.title}
        </h2>
      </Link>

      <Link href={`/${post.slug}`} className="block">
        <p className="mt-2 break-words text-[14px] leading-[1.65] text-text-secondary [overflow-wrap:anywhere]">
          {post.excerpt}
        </p>
      </Link>

      <div className="mt-4 flex items-center justify-between text-[13px] text-text-primary/80">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {authors.map((author, index) => (
                <Link
                  aria-label={author.name}
                  className="relative hover:z-20"
                  href={`/authors/${author.username}`}
                  key={author.username}
                  style={{
                    marginLeft: index === 0 ? 0 : -8,
                    zIndex: index + 1,
                  }}
                >
                  <AuthorAvatar
                    avatarUrl={author.avatarUrl}
                    name={author.name}
                  />
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {authors.map((author, i) => (
                <Link
                  className="font-semibold text-text-primary hover:text-accent transition-colors"
                  href={`/authors/${author.username}`}
                  key={author.username}
                >
                  {i > 0 && <span className="mr-1 text-text-tertiary">·</span>}
                  {author.name}
                </Link>
              ))}
            </div>
          </div>
          <span className="text-text-tertiary px-1">&middot;</span>
          {post.publishedAt ? (
            <RelativeTime
              className="text-[12px] text-text-secondary"
              date={post.publishedAt}
            />
          ) : (
            <span className="text-[12px] text-text-secondary">Bản nháp</span>
          )}
        </div>
        <div className="text-text-secondary text-[12px]">
          {post._count.comments} bình luận
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <Link
              className="glass-badge"
              href={`/tag/${tag.slug}`}
              key={tag.slug}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </motion.article>
  )
}
