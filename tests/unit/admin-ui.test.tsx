import { render, screen, waitFor } from "@testing-library/react"
import { within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const routerMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}))

const signOutMock = vi.hoisted(() => vi.fn())

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/posts",
  useRouter: () => routerMocks,
}))
vi.mock("next-auth/react", () => ({
  signOut: signOutMock,
}))

import { AdminCommentsTable } from "@/components/admin/AdminCommentsTable"
import { AdminNav } from "@/components/admin/AdminNav"
import { AdminPostsTable } from "@/components/admin/AdminPostsTable"
import { InviteWriterForm } from "@/components/admin/InviteWriterForm"
import { NewsletterBroadcastForm } from "@/components/admin/NewsletterBroadcastForm"
import { PendingInvitesTable } from "@/components/admin/PendingInvitesTable"
import { WritersTable } from "@/components/admin/WritersTable"

function okResponse(body: unknown = { data: { message: "OK" } }) {
  return new Response(JSON.stringify(body), { status: 200 })
}

function errorResponse(error: string, status = 400) {
  return new Response(JSON.stringify({ error }), { status })
}

describe("admin client components", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("confirm", vi.fn(() => true))
    vi.stubGlobal("alert", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("renders admin navigation", () => {
    render(<AdminNav />)

    expect(screen.getByRole("link", { name: /posts/i })).toHaveAttribute(
      "href",
      "/admin/posts",
    )
    expect(screen.getByRole("link", { name: /analytics/i })).toHaveAttribute(
      "href",
      "/admin/analytics",
    )
    expect(screen.getByRole("link", { name: /content/i })).toHaveAttribute(
      "href",
      "/admin/content",
    )
    expect(screen.getByRole("link", { name: /posts/i })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/admin",
    )
    expect(screen.getByRole("link", { name: /blog/i })).toHaveAttribute(
      "href",
      "/",
    )

    expect(screen.getByRole("button", { name: /open admin menu/i })).toBeVisible()
  })

  it("deletes posts through the shared posts API and refreshes", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(okResponse())
    vi.stubGlobal("fetch", fetchMock)

    render(
      <AdminPostsTable
        posts={[
          {
            _count: { comments: 2 },
            author: { name: "Mina", username: "mina" },
            id: "post-1",
            publishedAt: new Date("2026-01-01T00:00:00Z"),
            slug: "published-post",
            status: "PUBLISHED",
            title: "Published post",
            updatedAt: new Date("2026-01-02T00:00:00Z"),
          },
        ]}
      />,
    )

    expect(screen.getByRole("link", { name: /view/i })).toHaveAttribute(
      "href",
      "/published-post",
    )

    await user.click(screen.getByRole("button", { name: /delete/i }))
    expect(screen.getByRole("heading", { name: "Delete post?" })).toBeVisible()
    await user.click(
      within(screen.getByRole("heading", { name: "Delete post?" }).closest("div")!)
        .getByRole("button", { name: "Delete post" }),
    )

    expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1", {
      method: "DELETE",
    })
    await waitFor(() => {
      expect(routerMocks.refresh).toHaveBeenCalled()
    })
  })

  it("archives and restores posts from the admin posts table", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(okResponse())
    vi.stubGlobal("fetch", fetchMock)

    render(
      <AdminPostsTable
        posts={[
          {
            _count: { comments: 0 },
            author: { name: "Mina", username: "mina" },
            id: "post-1",
            publishedAt: new Date("2026-01-01T00:00:00Z"),
            slug: "published-post",
            status: "PUBLISHED",
            title: "Published post",
            updatedAt: new Date("2026-01-02T00:00:00Z"),
          },
          {
            _count: { comments: 0 },
            author: { name: "Ken", username: "ken" },
            id: "post-2",
            publishedAt: null,
            slug: "archived-post",
            status: "ARCHIVED" as never,
            title: "Archived post",
            updatedAt: new Date("2026-01-03T00:00:00Z"),
          },
        ]}
      />,
    )

    expect(screen.getByText("Archived")).toBeVisible()

    await user.click(screen.getByRole("button", { name: /archive post/i }))
    expect(screen.getByRole("heading", { name: "Archive post?" })).toBeVisible()
    await user.click(
      within(screen.getByRole("heading", { name: "Archive post?" }).closest("div")!)
        .getByRole("button", { name: "Archive post" }),
    )
    expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1/archive", {
      method: "POST",
    })

    await user.click(
      screen.getByRole("button", { name: /restore post to draft/i }),
    )
    expect(screen.getByRole("heading", { name: "Restore post?" })).toBeVisible()
    await user.click(
      within(screen.getByRole("heading", { name: "Restore post?" }).closest("div")!)
        .getByRole("button", { name: "Restore post" }),
    )
    expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-2/archive", {
      method: "DELETE",
    })
    await waitFor(() => {
      expect(routerMocks.refresh).toHaveBeenCalled()
    })
  })

  it("sends writer invites and resets the email on success", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { message: "Invite sent successfully" } }),
        { status: 201 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(<InviteWriterForm />)

    await user.type(
      screen.getByRole("textbox", { name: /writer email/i }),
      "Writer@Example.com",
    )
    await user.click(screen.getByRole("button", { name: /send invite/i }))

    expect(fetchMock).toHaveBeenCalledWith("/api/invite", {
      body: JSON.stringify({ email: "Writer@Example.com" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Invite sent successfully",
    )
    expect(screen.getByRole("textbox", { name: /writer email/i })).toHaveValue(
      "",
    )
  })

  it("shows invite errors without clearing the email", async () => {
    const user = userEvent.setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse("Duplicate invite")))

    render(<InviteWriterForm />)

    await user.type(
      screen.getByRole("textbox", { name: /writer email/i }),
      "writer@example.com",
    )
    await user.click(screen.getByRole("button", { name: /send invite/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Duplicate invite",
    )
    expect(screen.getByRole("textbox", { name: /writer email/i })).toHaveValue(
      "writer@example.com",
    )
  })

  it("removes writer access through the admin writer API", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(okResponse())
    vi.stubGlobal("fetch", fetchMock)

    render(
      <WritersTable
        writers={[
          {
            _count: { posts: 3 },
            createdAt: new Date("2026-01-01T00:00:00Z"),
            email: "writer@example.com",
            id: "writer-1",
            name: "Mina",
            role: "WRITER",
            username: "mina",
          },
        ]}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: /remove writer access/i }),
    )

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/writers/writer-1", {
      method: "DELETE",
    })
    await waitFor(() => {
      expect(routerMocks.refresh).toHaveBeenCalled()
    })
  })

  it("shows real admin and writer roles in the writers table", () => {
    render(
      <WritersTable
        writers={[
          {
            _count: { posts: 1 },
            createdAt: new Date("2026-01-01T00:00:00Z"),
            email: "admin@example.com",
            id: "admin-1",
            name: "Admin",
            role: "ADMIN",
            username: "admin",
          },
          {
            _count: { posts: 0 },
            createdAt: new Date("2026-01-02T00:00:00Z"),
            email: "writer@example.com",
            id: "writer-1",
            name: "Writer",
            role: "WRITER",
            username: "writer",
          },
        ]}
      />,
    )

    expect(screen.getAllByText("Admin")).toHaveLength(2)
    expect(screen.getAllByText("Writer")).toHaveLength(2)
    expect(screen.queryByText("Editor")).not.toBeInTheDocument()
  })

  it("renders pending invites with creator and expiry dates", () => {
    render(
      <PendingInvitesTable
        invites={[
          {
            createdAt: new Date("2026-01-01T00:00:00Z"),
            createdBy: { name: "Admin" },
            email: "new@example.com",
            expiresAt: new Date("2026-01-08T00:00:00Z"),
            id: "invite-1",
          },
        ]}
      />,
    )

    expect(screen.getByText("new@example.com")).toBeVisible()
    expect(screen.getByText(/Admin/)).toBeVisible()
    expect(screen.getByText(/Expires/)).toBeVisible()
  })

  it("marks comments as spam and renders comment text as plain text", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(okResponse())
    vi.stubGlobal("fetch", fetchMock)

    render(
      <AdminCommentsTable
        comments={[
          {
            authorName: "Reader",
            content: "<script>alert(1)</script>",
            createdAt: new Date("2026-01-01T00:00:00Z"),
            id: "comment-1",
            post: { slug: "post", title: "Post title" },
            status: "APPROVED",
          },
        ]}
      />,
    )

    expect(screen.getByText("<script>alert(1)</script>")).toBeVisible()

    await user.click(screen.getByRole("button", { name: /mark as spam/i }))

    expect(fetchMock).toHaveBeenCalledWith("/api/comments/comment-1", {
      method: "DELETE",
    })
    await waitFor(() => {
      expect(routerMocks.refresh).toHaveBeenCalled()
    })
  })

  it("validates and sends newsletter broadcasts", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({ data: { sent: 4, total: 5 } }),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(
      <NewsletterBroadcastForm
        recentPosts={[{ id: "post-1", title: "Recent essay" }]}
      />,
    )

    await user.type(screen.getByRole("textbox", { name: /subject/i }), "Issue")
    await user.click(screen.getByRole("button", { name: /send broadcast/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Select a featured post or write a custom message.",
    )

    await user.type(
      screen.getByRole("textbox", { name: /custom message/i }),
      "Hello readers",
    )
    await user.click(screen.getByRole("button", { name: /send broadcast/i }))

    expect(fetchMock).toHaveBeenCalledWith("/api/newsletter/broadcast", {
      body: JSON.stringify({
        customBody: "Hello readers",
        postId: undefined,
        previewText: undefined,
        subject: "Issue",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sent to 4 of 5 subscribers",
    )
  })
})
