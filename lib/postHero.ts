import type { PostHeroPost } from "@/types/posts"

function pickAuthor(author: PostHeroPost["author"]) {
  return {
    avatarUrl: author.avatarUrl,
    name: author.name,
    username: author.username,
  }
}

// A type annotation alone cannot exclude extra fields from an RSC client prop.
export function pickPostHeroData(post: PostHeroPost): PostHeroPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    coverUrl: post.coverUrl,
    coverAlt: post.coverAlt,
    excerpt: post.excerpt,
    excerptContent: post.excerptContent,
    publishedAt: post.publishedAt,
    featuredAt: post.featuredAt,
    author: pickAuthor(post.author),
    coAuthors: post.coAuthors.map(({ user }) => ({ user: pickAuthor(user) })),
    category: post.category
      ? { name: post.category.name, slug: post.category.slug }
      : null,
    tags: post.tags.map(({ tag }) => ({ tag: { name: tag.name, slug: tag.slug } })),
    _count: post._count ? { comments: post._count.comments } : undefined,
  }
}
