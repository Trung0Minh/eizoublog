import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCachedAuthorByUsername: vi.fn(),
  getCachedCategoryBySlug: vi.fn(),
  getCachedPublishedPost: vi.fn(),
  getCachedTagBySlug: vi.fn(),
  prisma: {
    category: {
      findUnique: vi.fn(),
    },
    post: {
      findUnique: vi.fn(),
    },
    tag: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("@/lib/queries", () => ({
  getCachedAuthorByUsername: mocks.getCachedAuthorByUsername,
  getCachedCategoryBySlug: mocks.getCachedCategoryBySlug,
  getCachedPublishedPost: mocks.getCachedPublishedPost,
  getCachedTagBySlug: mocks.getCachedTagBySlug,
}))

import { generateMetadata as postMetadata } from "@/app/(public)/[slug]/page"
import { generateMetadata as authorMetadata } from "@/app/(public)/authors/[username]/page"
import { generateMetadata as categoryMetadata } from "@/app/(public)/category/[slug]/page"
import { generateMetadata as contributorsMetadata } from "@/app/(public)/contributors/page"
import { generateMetadata as homeMetadata } from "@/app/(public)/page"
import { generateMetadata as searchMetadata } from "@/app/(public)/search/page"
import { generateMetadata as tagMetadata } from "@/app/(public)/tag/[slug]/page"

describe("public page metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_NAME = "Eizou Blog"
    process.env.NEXT_PUBLIC_APP_URL = "https://eizou.example"
  })

  it("sets homepage canonical URLs and noindexes paginated pages", async () => {
    await expect(
      homeMetadata({ searchParams: Promise.resolve({}) }),
    ).resolves.toMatchObject({
      alternates: { canonical: "https://eizou.example" },
      title: { absolute: "Eizou Blog" },
    })

    await expect(
      homeMetadata({ searchParams: Promise.resolve({ page: "2" }) }),
    ).resolves.toMatchObject({
      alternates: { canonical: "https://eizou.example?page=2" },
      robots: { follow: true, index: false },
    })
  })

  it("builds article metadata for published posts", async () => {
    mocks.getCachedPublishedPost.mockResolvedValue({
      author: { name: "Mina Writer" },
      coverUrl: "https://cdn.example.com/frieren.jpg",
      excerpt: "A close read of memory.",
      publishedAt: new Date("2026-01-02T03:04:05.000Z"),
      tags: [{ tag: { name: "Sakuga" } }, { tag: { name: "Fantasy" } }],
      title: "Frieren and memory",
    })

    const metadata = await postMetadata({
      params: Promise.resolve({ slug: "frieren-memory" }),
    })

    expect(mocks.getCachedPublishedPost).toHaveBeenCalledWith("frieren-memory")
    expect(metadata).toMatchObject({
      alternates: { canonical: "https://eizou.example/frieren-memory" },
      description: "A close read of memory.",
      title: "Frieren and memory",
    })
    expect(metadata.openGraph).toMatchObject({
      authors: ["Mina Writer"],
      publishedTime: "2026-01-02T03:04:05.000Z",
      tags: ["Sakuga", "Fantasy"],
      title: "Frieren and memory | Eizou Blog",
      type: "article",
    })
  })

  it("noindexes missing post metadata", async () => {
    mocks.getCachedPublishedPost.mockResolvedValue(null)

    await expect(
      postMetadata({ params: Promise.resolve({ slug: "missing" }) }),
    ).resolves.toMatchObject({
      robots: { follow: false, index: false },
    })
  })

  it("builds category, tag, author, contributors, and search metadata", async () => {
    mocks.getCachedCategoryBySlug.mockResolvedValue({
      description: "Production-focused essays.",
      id: "category-1",
      name: "Analysis",
      slug: "analysis",
    })
    mocks.getCachedTagBySlug.mockResolvedValue({
      id: "tag-1",
      name: "Sakuga",
      slug: "sakuga",
    })
    mocks.getCachedAuthorByUsername.mockResolvedValue({
      avatarUrl: "https://cdn.example.com/mina.jpg",
      bio: "Production notes and layout analysis.",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      id: "user-1",
      name: "Mina Writer",
      username: "mina",
    })

    await expect(
      categoryMetadata({
        params: Promise.resolve({ slug: "analysis" }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      description: "Production-focused essays.",
      title: "Analysis",
    })
    await expect(
      tagMetadata({
        params: Promise.resolve({ slug: "sakuga" }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      description: "Posts tagged with Sakuga",
      title: "#Sakuga",
    })
    await expect(
      authorMetadata({
        params: Promise.resolve({ username: "mina" }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      description: "Production notes and layout analysis.",
      title: "Mina Writer",
    })
    await expect(contributorsMetadata()).resolves.toMatchObject({
      description: "Meet the writers behind Eizou Blog.",
      title: "Người đóng góp",
    })
    await expect(
      searchMetadata({ searchParams: Promise.resolve({ q: "frieren" }) }),
    ).resolves.toMatchObject({
      robots: { follow: false, index: false },
      title: "Tìm kiếm: frieren",
    })
  })
})
