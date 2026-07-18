import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  prisma: {
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
    comment: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    invite: {
      findMany: vi.fn(),
    },
    newsletterBroadcast: {
      aggregate: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    newsletterSubscriber: {
      count: vi.fn(),
    },
    post: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
  unstableCache: vi.fn((callback: unknown) => callback),
}))

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }))
vi.mock("next/cache", () => ({ unstable_cache: mocks.unstableCache }))
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  usePathname: () => "/admin",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@/components/admin/AdminHeader", () => ({
  AdminHeader: () => <header aria-label="Admin mobile controls">Admin controls</header>,
}))
vi.mock("@/components/admin/AdminSidebar", () => ({
  AdminSidebar: () => <nav aria-label="Admin navigation">Admin navigation</nav>,
}))
vi.mock("@/components/admin/AdminPostSearch", () => ({
  AdminPostSearch: () => <input aria-label="Search posts" />,
}))
vi.mock("@/components/admin/AdminPostsTable", () => ({
  AdminPostsTable: ({ posts }: { posts: unknown[] }) => (
    <div data-testid="admin-posts-table">{posts.length} posts</div>
  ),
}))
vi.mock("@/components/admin/WritersTable", () => ({
  WritersTable: ({ writers }: { writers: unknown[] }) => (
    <div data-testid="writers-table">{writers.length} writers</div>
  ),
}))
vi.mock("@/components/admin/PendingInvitesTable", () => ({
  PendingInvitesTable: ({ invites }: { invites: unknown[] }) => (
    <div data-testid="pending-invites-table">{invites.length} invites</div>
  ),
}))
vi.mock("@/components/admin/InviteWriterForm", () => ({
  InviteWriterForm: () => <form aria-label="Invite writer form" />,
}))
vi.mock("@/components/admin/AdminCommentsTable", () => ({
  AdminCommentsTable: ({ comments }: { comments: unknown[] }) => (
    <div data-testid="admin-comments-table">{comments.length} comments</div>
  ),
}))
vi.mock("@/components/admin/NewsletterBroadcastForm", () => ({
  NewsletterBroadcastForm: ({ recentPosts }: { recentPosts: unknown[] }) => (
    <div data-testid="newsletter-broadcast-form">
      {recentPosts.length} recent posts
    </div>
  ),
}))
vi.mock("@/components/admin/AnalyticsWidget", () => ({
  AnalyticsWidget: () => <div data-testid="analytics-widget">Analytics widget</div>,
}))

import AdminCommentsPage from "@/app/(admin)/admin/comments/page"
import AdminLayout, { metadata } from "@/app/(admin)/admin/layout"
import AdminDashboardPage from "@/app/(admin)/admin/page"
import AdminPostsPage from "@/app/(admin)/admin/posts/page"
import AdminNewsletterPage from "@/app/(admin)/admin/newsletter/page"
import AdminWritersPage from "@/app/(admin)/admin/writers/page"

function renderAsync(node: React.ReactNode) {
  render(<>{node}</>)
}

describe("admin layout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } })
  })

  it("prevents indexing admin routes", () => {
    expect(metadata).toMatchObject({
      robots: { follow: false, index: false },
    })
  })

  it("redirects non-admin users", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "writer-1", role: "WRITER" } })

    await expect(
      AdminLayout({ children: <p>Secret admin content</p> }),
    ).rejects.toThrow("redirect:/login")
    expect(mocks.redirect).toHaveBeenCalledWith("/login")
  })

  it("renders admin navigation for admins", async () => {
    render(<>{await AdminLayout({ children: <p>Secret admin content</p> })}</>)

    expect(
      screen.getByRole("navigation", { name: "Admin navigation" }),
    ).toBeVisible()
    expect(screen.getByText("Secret admin content")).toBeVisible()
  })
})

describe("admin server pages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.prisma.$queryRaw.mockReset()
    mocks.prisma.$transaction.mockImplementation(async (input) => {
      if (Array.isArray(input)) {
        return Promise.all(input)
      }

      throw new Error("Unsupported transaction input")
    })
  })

  it("renders dashboard counts and uses active subscriber count", async () => {
    mocks.prisma.$queryRaw.mockResolvedValue([
      {
        activeSubscribers: BigInt(21),
        approvedComments: BigInt(12),
        archivedPosts: BigInt(1),
        draftPosts: BigInt(2),
        publishedPosts: BigInt(8),
        removedPosts: BigInt(0),
        writers: BigInt(3),
      },
    ])
    mocks.prisma.post.findMany.mockResolvedValue([
      {
        _count: { comments: 4 },
        author: { name: "Mina", username: "mina" },
        id: "recent-post-id",
        publishedAt: new Date("2026-01-01T00:00:00Z"),
        slug: "recent-post",
        status: "PUBLISHED",
        title: "Recent post",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ])
    mocks.prisma.comment.findMany.mockResolvedValue([
      {
        authorName: "Reader",
        content: "Thoughtful comment",
        createdAt: new Date("2026-01-03T00:00:00Z"),
        id: "comment-1",
        post: { slug: "recent-post", title: "Recent post" },
      },
    ])

    renderAsync(await AdminDashboardPage())

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeVisible()
    expect(screen.getByText(/Published posts/i)).toBeVisible()
    expect(screen.getAllByText(/Drafts/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Subscribers/i)).toBeVisible()
    expect(screen.getByTestId("analytics-widget")).toBeVisible()
    expect(screen.queryByText("Recent Posts")).not.toBeInTheDocument()
    expect(screen.queryByText("Recent Comments")).not.toBeInTheDocument()
    expect(mocks.prisma.post.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.comment.findMany).not.toHaveBeenCalled()
    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(1)
  })

  it("lists all posts with explicit safe selects and status filtering", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          authorName: "Mina",
          authorUsername: "mina",
          commentCount: BigInt(2),
          id: "post-1",
          publishedAt: null,
          slug: "draft",
          status: "DRAFT",
          title: "Draft",
          totalCount: BigInt(1),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
        },
      ])
      .mockResolvedValueOnce([
        {
          activeSubscribers: BigInt(0),
          approvedComments: BigInt(0),
          archivedPosts: BigInt(0),
          draftPosts: BigInt(1),
          publishedPosts: BigInt(0),
          removedPosts: BigInt(0),
          writers: BigInt(0),
        },
      ])

    renderAsync(
      await AdminPostsPage({
        searchParams: Promise.resolve({ page: "2", status: "DRAFT" }),
      }),
    )

    expect(screen.getByTestId("admin-posts-table")).toHaveTextContent("1 posts")
    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(2)
  })

  it("adds an archived posts filter for admins", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          authorName: null,
          authorUsername: null,
          commentCount: null,
          id: null,
          publishedAt: null,
          slug: null,
          status: null,
          title: null,
          totalCount: BigInt(0),
          updatedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          activeSubscribers: BigInt(0),
          approvedComments: BigInt(0),
          archivedPosts: BigInt(0),
          draftPosts: BigInt(0),
          publishedPosts: BigInt(0),
          removedPosts: BigInt(0),
          writers: BigInt(0),
        },
      ])

    renderAsync(
      await AdminPostsPage({
        searchParams: Promise.resolve({ status: "ARCHIVED" }),
      }),
    )

    expect(screen.getByRole("link", { name: /Archived/ })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(2)
  })

  it("loads active writers and pending invites for writer management", async () => {
    mocks.prisma.user.findMany.mockResolvedValue([
      {
        _count: { posts: 1 },
        createdAt: new Date("2026-01-01T00:00:00Z"),
        email: "writer@example.com",
        id: "writer-1",
        name: "Mina",
        username: "mina",
      },
    ])
    mocks.prisma.invite.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-01-01T00:00:00Z"),
        createdBy: { name: "Admin" },
        email: "new@example.com",
        expiresAt: new Date("2026-01-08T00:00:00Z"),
        id: "invite-1",
      },
    ])

    renderAsync(await AdminWritersPage())

    expect(screen.getByTestId("writers-table")).toHaveTextContent("1 writers")
    expect(screen.getByTestId("pending-invites-table")).toHaveTextContent(
      "1 invites",
    )
    expect(mocks.prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "WRITER" },
      }),
    )
  })

  it("lists approved comments without selecting private author emails", async () => {
    mocks.prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          approvedComments: BigInt(1),
          spamComments: BigInt(0),
        },
      ])
      .mockResolvedValueOnce([
        {
          authorName: "Reader",
          content: "Good note",
          createdAt: new Date("2026-01-01T00:00:00Z"),
          id: "comment-1",
          postSlug: "post",
          postTitle: "Post",
          status: "APPROVED",
          totalCount: BigInt(1),
        },
      ])

    renderAsync(
      await AdminCommentsPage({
        searchParams: Promise.resolve({ page: "1" }),
      }),
    )

    expect(screen.getByTestId("admin-comments-table")).toHaveTextContent(
      "1 comments",
    )
    expect(screen.getByRole("link", { name: /Approved/ })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(mocks.prisma.$queryRaw).toHaveBeenCalledTimes(2)
  })

  it("loads active subscriber count and recent posts for newsletter broadcasts", async () => {
    mocks.prisma.newsletterSubscriber.count.mockResolvedValue(42)
    mocks.prisma.newsletterBroadcast.count.mockResolvedValue(2)
    mocks.prisma.newsletterBroadcast.aggregate.mockResolvedValue({
      _sum: { sentCount: 18 },
    })
    mocks.prisma.newsletterBroadcast.findMany.mockResolvedValue([
      {
        completedAt: new Date("2026-01-04T00:00:00Z"),
        createdAt: new Date("2026-01-03T00:00:00Z"),
        failedCount: 1,
        id: "broadcast-1",
        sentCount: 11,
        status: "PARTIAL",
        subject: "January issue",
        totalCount: 12,
      },
    ])
    mocks.prisma.post.findMany.mockResolvedValue([
      { id: "post-1", title: "Recent essay" },
    ])

    renderAsync(await AdminNewsletterPage())

    expect(screen.getByText("Newsletter")).toBeVisible()
    expect(screen.getByText("TOTAL SUBSCRIBERS")).toBeVisible()
    expect(screen.getAllByText("42").length).toBeGreaterThan(0)
    expect(screen.getByText("Recent Broadcasts")).toBeVisible()
    expect(screen.getByText("January issue")).toBeVisible()
    expect(screen.getByText("TOTAL BROADCASTS")).toBeVisible()
    expect(screen.getByText("EMAILS DELIVERED")).toBeVisible()
    expect(screen.queryByPlaceholderText("Search emails...")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "New email" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument()
    expect(screen.getByTestId("newsletter-broadcast-form")).toHaveTextContent(
      "1 recent posts",
    )
    expect(mocks.prisma.post.findMany).toHaveBeenCalledWith({
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true },
      take: 10,
      where: { status: "PUBLISHED" },
    })
  })
})
