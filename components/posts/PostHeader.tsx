import Link from "next/link"

import { formatDate } from "@/lib/utils"
import { getCoverStyle } from "@/lib/cover-style"

interface HeaderAuthor {
  avatarUrl: string | null
  bio?: string | null
  name: string
  username: string
}

export interface PostHeaderPost {
  _count?: { comments: number }
  author: HeaderAuthor
  category: { name: string; slug: string } | null
  coAuthors: { user: HeaderAuthor }[]
  coverAlt: string | null
  coverUrl: string | null
  excerpt: string | null
  publishedAt: Date | string | null
  tags: { tag: { name: string; slug: string } }[]
  title: string
}

interface PostHeaderProps {
  post: PostHeaderPost
}

function Avatar({ author }: { author: HeaderAuthor }) {
  if (author.avatarUrl) {
    return (
      <img
        alt={author.name}
        className="h-9 w-9 rounded-full border-2 border-background object-cover"
        decoding="async"
        src={author.avatarUrl}
      />
    )
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-[#2d6e7e] text-sm font-semibold text-white">
      {author.name.charAt(0)}
    </span>
  )
}

export function PostHeader({ post }: PostHeaderProps) {
  const authors = [post.author, ...post.coAuthors.map(({ user }) => user)]
  const fallbackTags = [
    { name: "Animation Analysis", slug: "animation-analysis" },
    { name: "Sakuga", slug: "sakuga" },
  ]
  const tags =
    post.tags.length > 0 ? post.tags.map(({ tag }) => tag) : fallbackTags

  return (
    <header className="mb-10 md:mb-12">
      {post.category ? (
        <Link
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent transition-colors hover:text-accent/80"
          href={`/category/${post.category.slug}`}
        >
          {post.category.name}
        </Link>
      ) : (
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          Animation Analysis
        </div>
      )}

      <h1 className="mb-5 mt-[10px] text-[26px] font-bold leading-[1.25] tracking-[-0.02em] text-text-primary md:text-[36px] md:leading-[1.2]">
        {post.title}
      </h1>

      {post.excerpt && (
        <p className="mt-[-10px] mb-5 text-[17px] leading-[1.5] text-text-secondary md:text-[19px]">
          {post.excerpt}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3 text-[13px] text-text-secondary">
        <div className="flex -space-x-2.5">
          {authors.slice(0, 3).map((author) => (
            <Avatar author={author} key={author.username} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            {authors.map((author, index) => (
              <span key={author.username}>
                {index > 0 && ", "}
                <Link
                  className="text-[14px] font-medium text-text-primary transition-colors hover:text-accent"
                  href={`/authors/${author.username}`}
                >
                  {author.name}
                </Link>
              </span>
            ))}
          </span>
          {post.publishedAt && (
            <>
              <span className="hidden md:inline" aria-hidden="true">·</span>
              <time className="w-full md:w-auto text-text-secondary" dateTime={new Date(post.publishedAt).toISOString()}>
                {formatDate(post.publishedAt)}
              </time>
            </>
          )}
          {post._count && (
            <>
              <span className="hidden md:inline" aria-hidden="true">·</span>
              <span className="text-text-tertiary">
                {post._count.comments} bình luận
              </span>
            </>
          )}
        </div>
      </div>

      {post.coverUrl && (
        <div className="mt-7">
          <div className="relative -ml-4 w-screen overflow-hidden md:ml-0 md:w-full md:rounded-[8px]">
            <div className="aspect-video w-full bg-subtle-bg">
            <div className="absolute inset-0 overflow-hidden">
              <img
                alt={post.coverAlt ?? post.title}
                className="h-full w-full"
                style={getCoverStyle(post.coverUrl)}
                decoding="async"
                fetchPriority="high"
                loading="eager"
                src={(post.coverUrl || "").split("?")[0]}
              />
            </div>
            </div>
          </div>
          <div className="px-4 md:px-0">
            <div className="mt-1.5 text-right text-[11px] italic text-text-tertiary">
              {post.coverAlt ?? "Anime Blog archive"}
            </div>
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="no-scrollbar mt-4 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {tags.map((tag) => (
            <Link
              className="shrink-0 rounded-full border border-border-default bg-subtle-bg px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-border-default"
              href={`/tag/${tag.slug}`}
              key={tag.slug}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
