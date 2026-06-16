import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    category: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    post: {
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    postTag: {
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    tag: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
  revalidateTag: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }))

import {
  GET as GET_CATEGORIES,
  POST as CREATE_CATEGORY,
} from "@/app/api/admin/content/categories/route"
import {
  DELETE as DELETE_CATEGORY,
  PATCH as UPDATE_CATEGORY,
} from "@/app/api/admin/content/categories/[id]/route"
import {
  GET as GET_TAGS,
  POST as CREATE_TAG,
} from "@/app/api/admin/content/tags/route"
import {
  DELETE as DELETE_TAG,
  PATCH as UPDATE_TAG,
} from "@/app/api/admin/content/tags/[id]/route"

const adminUser = {
  avatarUrl: null,
  email: "admin@example.com",
  id: "admin-1",
  name: "Admin",
  role: "ADMIN",
  username: "admin",
}

const writerUser = {
  avatarUrl: null,
  email: "writer@example.com",
  id: "writer-1",
  name: "Writer",
  role: "WRITER",
  username: "writer",
}

function jsonRequest(url: string, body: unknown, method = "POST") {
  return new Request(url, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
  })
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe("admin content API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
    mocks.prisma.user.findUnique.mockImplementation(async (query: unknown) => {
      const where =
        typeof query === "object" && query !== null && "where" in query
          ? query.where
          : null
      const id =
        typeof where === "object" &&
        where !== null &&
        "id" in where &&
        typeof where.id === "string"
          ? where.id
          : null

      if (id === "admin-1") return adminUser
      if (id === "writer-1") return writerUser
      return null
    })
    mocks.prisma.$transaction.mockImplementation(async (input) => {
      if (Array.isArray(input)) return Promise.all(input)
      if (typeof input === "function") return input(mocks.prisma)
      throw new Error("Unsupported transaction input")
    })
  })

  it("requires admin access", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "writer-1", role: "WRITER" } })

    const response = await CREATE_CATEGORY(
      jsonRequest("https://example.test/api/admin/content/categories", {
        name: "Analysis",
      }),
    )

    expect(response.status).toBe(401)
    expect(mocks.prisma.category.create).not.toHaveBeenCalled()
  })

  it("lists categories with usage counts and creates categories", async () => {
    mocks.prisma.category.findMany.mockResolvedValue([
      {
        _count: { children: 1, posts: 3 },
        children: [],
        description: "Long form",
        id: "category-1",
        name: "Analysis",
        parentId: null,
        slug: "analysis",
      },
    ])
    mocks.prisma.category.create.mockResolvedValue({
      id: "category-2",
      name: "Production Notes",
      slug: "production-notes",
    })

    const listResponse = await GET_CATEGORIES()
    const createResponse = await CREATE_CATEGORY(
      jsonRequest("https://example.test/api/admin/content/categories", {
        description: "Notes",
        name: "Production Notes",
        parentId: "category-1",
      }),
    )

    expect(listResponse.status).toBe(200)
    await expect(listResponse.json()).resolves.toEqual({
      data: [
        {
          _count: { children: 1, posts: 3 },
          children: [],
          description: "Long form",
          id: "category-1",
          name: "Analysis",
          parentId: null,
          slug: "analysis",
        },
      ],
    })
    expect(createResponse.status).toBe(201)
    expect(mocks.prisma.category.create).toHaveBeenCalledWith({
      data: {
        description: "Notes",
        name: "Production Notes",
        parent: { connect: { id: "category-1" } },
        slug: "production-notes",
      },
      select: expect.any(Object),
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("categories", "max")
  })

  it("updates categories and blocks deleting categories with children", async () => {
    mocks.prisma.category.findUnique.mockResolvedValue({
      _count: { children: 2, posts: 0 },
      id: "category-1",
      name: "Analysis",
    })
    mocks.prisma.category.update.mockResolvedValue({
      id: "category-1",
      name: "Episode Analysis",
      slug: "episode-analysis",
    })

    const updateResponse = await UPDATE_CATEGORY(
      jsonRequest(
        "https://example.test/api/admin/content/categories/category-1",
        { name: "Episode Analysis", parentId: null },
        "PATCH",
      ),
      routeContext("category-1"),
    )
    const deleteResponse = await DELETE_CATEGORY(
      new Request("https://example.test/api/admin/content/categories/category-1"),
      routeContext("category-1"),
    )

    expect(updateResponse.status).toBe(200)
    expect(mocks.prisma.category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Episode Analysis",
          parent: { disconnect: true },
          slug: "episode-analysis",
        }),
      }),
    )
    expect(deleteResponse.status).toBe(400)
    await expect(deleteResponse.json()).resolves.toEqual({
      error: "Move or delete child categories first",
    })
  })

  it("deletes used categories by detaching posts first", async () => {
    mocks.prisma.category.findUnique.mockResolvedValue({
      _count: { children: 0, posts: 12 },
      id: "category-1",
      name: "Analysis",
    })
    mocks.prisma.post.updateMany.mockResolvedValue({ count: 12 })
    mocks.prisma.category.delete.mockResolvedValue({ id: "category-1" })

    const response = await DELETE_CATEGORY(
      new Request("https://example.test/api/admin/content/categories/category-1"),
      routeContext("category-1"),
    )

    expect(response.status).toBe(200)
    expect(mocks.prisma.post.updateMany).toHaveBeenCalledWith({
      data: { categoryId: null },
      where: { categoryId: "category-1" },
    })
    expect(mocks.prisma.category.delete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: "category-1" },
    })
  })

  it("lists, creates, updates, and deletes tags", async () => {
    mocks.prisma.tag.findMany.mockResolvedValue([
      { _count: { posts: 2 }, id: "tag-1", name: "Sakuga", slug: "sakuga" },
    ])
    mocks.prisma.tag.create.mockResolvedValue({
      id: "tag-2",
      name: "Layout",
      slug: "layout",
    })
    mocks.prisma.tag.findUnique.mockResolvedValue({
      _count: { posts: 2 },
      id: "tag-1",
      name: "Sakuga",
    })
    mocks.prisma.tag.update.mockResolvedValue({
      id: "tag-1",
      name: "Key Animation",
      slug: "key-animation",
    })
    mocks.prisma.postTag.deleteMany.mockResolvedValue({ count: 2 })
    mocks.prisma.tag.delete.mockResolvedValue({ id: "tag-1" })

    const listResponse = await GET_TAGS()
    const createResponse = await CREATE_TAG(
      jsonRequest("https://example.test/api/admin/content/tags", {
        name: "Layout",
      }),
    )
    const updateResponse = await UPDATE_TAG(
      jsonRequest(
        "https://example.test/api/admin/content/tags/tag-1",
        { name: "Key Animation" },
        "PATCH",
      ),
      routeContext("tag-1"),
    )
    const deleteResponse = await DELETE_TAG(
      new Request("https://example.test/api/admin/content/tags/tag-1"),
      routeContext("tag-1"),
    )

    expect(listResponse.status).toBe(200)
    expect(createResponse.status).toBe(201)
    expect(updateResponse.status).toBe(200)
    expect(deleteResponse.status).toBe(200)
    expect(mocks.prisma.postTag.deleteMany).toHaveBeenCalledWith({
      where: { tagId: "tag-1" },
    })
    expect(mocks.prisma.tag.delete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: "tag-1" },
    })
  })
})
