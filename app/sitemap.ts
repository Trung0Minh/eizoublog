import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"
import { getAppUrl } from "@/lib/seo"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl()
  const now = new Date()
  const staticPages: MetadataRoute.Sitemap = [
    {
      changeFrequency: "daily",
      lastModified: now,
      priority: 1,
      url: appUrl,
    },
    {
      changeFrequency: "weekly",
      lastModified: now,
      priority: 0.5,
      url: `${appUrl}/about`,
    },
    {
      changeFrequency: "weekly",
      lastModified: now,
      priority: 0.5,
      url: `${appUrl}/contributors`,
    },
  ]

  const [posts, categories, tags, authors] = await Promise.all([
    prisma.post.findMany({
      orderBy: { publishedAt: "desc" },
      select: { slug: true, updatedAt: true },
      where: { status: "PUBLISHED" },
    }),
    prisma.category.findMany({
      select: { slug: true },
    }),
    prisma.tag.findMany({
      select: { slug: true },
    }),
    prisma.user.findMany({
      select: { username: true },
      where: { role: { in: ["ADMIN", "WRITER"] } },
    }),
  ])

  return [
    ...staticPages,
    ...posts.map((post) => ({
      changeFrequency: "weekly" as const,
      lastModified: post.updatedAt,
      priority: 0.8,
      url: `${appUrl}/${post.slug}`,
    })),
    ...categories.map((category) => ({
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: 0.6,
      url: `${appUrl}/category/${category.slug}`,
    })),
    ...tags.map((tag) => ({
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: 0.5,
      url: `${appUrl}/tag/${tag.slug}`,
    })),
    ...authors.map((author) => ({
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: 0.6,
      url: `${appUrl}/authors/${author.username}`,
    })),
  ]
}
