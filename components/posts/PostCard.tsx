import Link from "next/link"

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
  const fallbackTags = [
    { name: "Animation Analysis", slug: "animation-analysis" },
    { name: "Sakuga", slug: "sakuga" },
  ]
  const tags =
    post.tags.length > 0 ? post.tags.map(({ tag }) => tag) : fallbackTags

  return (
    <article className="group flex flex-col bg-subtle-bg/30 p-4 border-[2px] border-transparent hover:border-border-default hover:shadow-lg rounded-[16px] transition-all duration-300">
      {post.coverUrl && (
        <Link className="mb-4 block overflow-hidden rounded-[8px]" href={`/${post.slug}`}>
          <div className="relative w-full aspect-video isolate bg-subtle-bg rounded-[8px] overflow-hidden border-2 border-dashed border-border-default group-hover:border-accent/40 transition-colors">
            <img
              alt={post.coverAlt ?? post.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              style={getCoverStyle(post.coverUrl)}
              decoding="async"
              loading="lazy"
              src={(post.coverUrl || "").split("?")[0]}
            />
          </div>
        </Link>
      )}

      {post.category ? (
        <Link
          className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-accent transition-colors hover:text-accent/80"
          href={`/category/${post.category.slug}`}
        >
          {post.category.name}
        </Link>
      ) : (
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
          Animation Analysis
        </div>
      )}

      <Link className="group-hover:text-accent transition-colors block" href={`/${post.slug}`}>
        <h2 className="text-[20px] font-display font-bold text-text-primary leading-[1.3] line-clamp-2">
          {post.title}
        </h2>
      </Link>

      <Link href={`/${post.slug}`} className="block">
        <p className="mt-2 text-[14px] text-text-secondary font-serif leading-[1.65] line-clamp-3 hidden md:block">
          {post.excerpt}
        </p>
      </Link>

      <div className="mt-4 flex items-center justify-between text-[13px] text-text-primary/80">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {authors.map((author, i) => (
            <div className="flex items-center gap-2" key={author.username}>
              {i > 0 && <span className="text-text-tertiary">·</span>}
              <AuthorAvatar
                avatarUrl={author.avatarUrl}
                name={author.name}
              />
              <span className="font-semibold text-text-primary">
                {author.name}
              </span>
            </div>
          ))}
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
              className="px-3 py-1 bg-subtle-bg text-text-primary text-[11px] rounded-full hover:bg-border-default transition-colors"
              href={`/tag/${tag.slug}`}
              key={tag.slug}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}
