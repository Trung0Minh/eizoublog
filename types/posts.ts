interface PostHeroAuthor {
  avatarUrl: string | null
  bio?: string | null
  name: string
  username: string
}

export interface PostHeroPost {
  id: string
  _count?: { comments: number }
  author: PostHeroAuthor
  category: { name: string; slug: string } | null
  coAuthors: { user: PostHeroAuthor }[]
  coverAlt: string | null
  coverUrl: string | null
  excerpt: string | null
  publishedAt: Date | string | null
  tags: { tag: { name: string; slug: string } }[]
  title: string
}
