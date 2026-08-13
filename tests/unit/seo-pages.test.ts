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
vi.mock("@/lib/authz", () => ({
  getActiveSession: vi.fn(() => null),
}))
vi.mock("@/lib/queries", () => ({
  getCachedAuthorByUsername: mocks.getCachedAuthorByUsername,
  getCachedCategoryBySlug: mocks.getCachedCategoryBySlug,
  getCachedPublishedPost: mocks.getCachedPublishedPost,
  getCachedTagBySlug: mocks.getCachedTagBySlug,
}))

import { generateMetadata as postMetadata } from "@/app/(public)/[slug]/page"
import { generateMetadata as authorMetadata } from "@/app/(public)/authors/[username]/page"
import { generateMetadata as aboutMetadata } from "@/app/(public)/about/page"
import { generateMetadata as categoryMetadata } from "@/app/(public)/category/[slug]/page"
import { generateMetadata as contributorsMetadata } from "@/app/(public)/contributors/page"
import { generateMetadata as homeMetadata } from "@/app/(public)/page"
import { generateMetadata as introMetadata } from "@/app/(public)/nhap-mon-sakuga/page"
import { metadata as resourcesMetadata } from "@/app/(public)/resources/page"
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
      description: "Top 1 sakuku vi en",
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
      description: "Các bài viết gắn thẻ Sakuga.",
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
      description: "Gặp gỡ những cây bút đứng sau Eizou Blog.",
      title: "Người đóng góp",
    })
    await expect(aboutMetadata()).resolves.toMatchObject({
      description:
        "Kho lưu trữ các bài viết xịn xò bởi cộng đồng fan sakuku vi en",
      title: "Giới thiệu",
    })
    await expect(introMetadata()).resolves.toMatchObject({
      description:
        "Hướng dẫn và tài liệu tham khảo hoàn chỉnh dành cho người mới bắt đầu.",
      title: "Nhập môn Sakuga",
    })
    expect(resourcesMetadata).toMatchObject({
      description: "Tổng hợp nguồn tham khảo siu cấp uy tín",
      openGraph: {
        description: "Tổng hợp nguồn tham khảo siu cấp uy tín",
      },
      title: "Nguồn tham khảo",
      twitter: {
        description: "Tổng hợp nguồn tham khảo siu cấp uy tín",
      },
    })
    await expect(
      searchMetadata({ searchParams: Promise.resolve({ q: "frieren" }) }),
    ).resolves.toMatchObject({
      robots: { follow: false, index: false },
      title: "Tìm kiếm: frieren",
    })
  })

  it("uses Vietnamese fallbacks for category and author previews", async () => {
    mocks.getCachedCategoryBySlug.mockResolvedValue({
      description: null,
      id: "category-1",
      name: "Ghi chú sản xuất",
      slug: "ghi-chu-san-xuat",
    })
    mocks.getCachedAuthorByUsername.mockResolvedValue({
      avatarUrl: null,
      bio: null,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      id: "user-1",
      name: "Mina Writer",
      username: "mina",
    })

    await expect(
      categoryMetadata({
        params: Promise.resolve({ slug: "ghi-chu-san-xuat" }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      description: "Các bài viết thuộc chuyên mục Ghi chú sản xuất.",
    })
    await expect(
      authorMetadata({
        params: Promise.resolve({ username: "mina" }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      description: "Các bài viết của Mina Writer.",
    })
  })

  it("converts rich author bios to text and keeps avatar previews square", async () => {
    mocks.getCachedAuthorByUsername.mockResolvedValue({
      avatarUrl: "https://cdn.example.com/mina.jpg",
      bio: JSON.stringify({
        content: [
          {
            content: [{ text: "Đã lỡ yêu Chanh mất rồi", type: "text" }],
            type: "paragraph",
          },
          {
            content: [{ text: "#chucemhanhphuc", type: "text" }],
            type: "paragraph",
          },
        ],
        type: "doc",
      }),
      createdAt: new Date("2024-01-01T00:00:00Z"),
      id: "user-1",
      name: "Mina Writer",
      username: "mina",
    })

    const metadata = await authorMetadata({
      params: Promise.resolve({ username: "mina" }),
      searchParams: Promise.resolve({}),
    })

    expect(metadata.description).toBe(
      "Đã lỡ yêu Chanh mất rồi\n#chucemhanhphuc",
    )
    expect(metadata.openGraph).toHaveProperty("images", [
      {
        alt: "Mina Writer | Eizou Blog",
        height: 512,
        url: "https://cdn.example.com/mina.jpg",
        width: 512,
      },
    ])
  })
})
