import Link from "next/link"

import { formatDate } from "@/lib/utils"

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
    <article className="group flex flex-col rounded-xl border border-border-default/60 bg-subtle-bg/20 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:border-border-default hover:bg-subtle-bg/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] sm:p-5">
      {post.coverUrl && (
        <Link className="mb-4 block overflow-hidden rounded-[6px] border border-border-default/40" href={`/${post.slug}`}>
          <div className="relative aspect-video w-full overflow-hidden bg-subtle-bg dark:brightness-[0.9]">
            <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.02]">
              <img
                alt={post.coverAlt ?? post.title}
                className="h-full w-full object-cover"
                style={{
                  transform: `scale(${new URLSearchParams((post.coverUrl || "").split("?")[1] || "").get("zoom") || "1"}) translate(${new URLSearchParams((post.coverUrl || "").split("?")[1] || "").get("tx") || "0"}%, ${new URLSearchParams((post.coverUrl || "").split("?")[1] || "").get("ty") || "0"}%)`,
                }}
                decoding="async"
                loading="lazy"
                src={(post.coverUrl || "").split("?")[0]}
              />
            </div>
          </div>
        </Link>
      )}

      {post.category ? (
        <Link
          className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-accent transition-colors hover:text-accent/80"
          href={`/category/${post.category.slug}`}
        >
          {post.category.name}
        </Link>
      ) : (
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
          Animation Analysis
        </div>
      )}

      <Link href={`/${post.slug}`}>
        <h2 className="mb-3 line-clamp-2 text-[20px] font-bold leading-[1.3] text-text-primary transition-colors duration-200 group-hover:text-accent">
          {post.title}
        </h2>
      </Link>

      {post.excerpt && (
        <p className="mb-4 hidden font-serif text-[14px] leading-[1.65] text-text-secondary line-clamp-3 md:block">
          {post.excerpt}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between text-[13px] text-text-secondary">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex -space-x-1.5">
            {authors.slice(0, 3).map((author) => (
              <AuthorAvatar
                avatarUrl={author.avatarUrl}
                key={author.username}
                name={author.name}
              />
            ))}
          </div>
          <span className="truncate">
            {authors.map((author, index) => (
              <span key={author.username}>
                {index > 0 && ", "}
                <Link
                  className="transition-colors hover:text-text-primary"
                  href={`/authors/${author.username}`}
                >
                  {author.name}
                </Link>
              </span>
            ))}
          </span>
          <span className="opacity-50">·</span>
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span>
            {post._count.comments} bình luận
          </span>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              className="cursor-pointer rounded-full bg-subtle-bg px-3 py-1 text-[11px] text-text-secondary transition-colors hover:bg-border-default"
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
