import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("next-auth/react", () => ({
  signOut: signOutMock,
}))

import { AdminCommentsTable } from "@/components/admin/AdminCommentsTable"
import { AdminContentManager } from "@/components/admin/AdminContentManager"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminNav } from "@/components/admin/AdminNav"
import { AdminPostsTable } from "@/components/admin/AdminPostsTable"
import { InviteWriterForm } from "@/components/admin/InviteWriterForm"
import { NewsletterBroadcastForm } from "@/components/admin/NewsletterBroadcastForm"
import { PendingInvitesTable } from "@/components/admin/PendingInvitesTable"
import { WritersTable } from "@/components/admin/WritersTable"
import { AdminEventsManager } from "@/components/events/AdminEventsManager"
import { clearSessionUserCache } from "@/lib/clientSession"

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
    clearSessionUserCache()
  })

  it("renders admin navigation without overlaying desktop controls", () => {
    const { container } = render(<AdminNav />)

    expect(screen.getByRole("link", { name: /posts/i })).toHaveAttribute(
      "href",
      "/admin/posts",
    )
    expect(screen.queryByRole("link", { name: /analytics/i })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /content/i })).toHaveAttribute(
      "href",
      "/admin/content",
    )
    expect(screen.getByRole("link", { name: /backgrounds/i })).toHaveAttribute(
      "href",
      "/admin/settings/backgrounds",
    )
    expect(screen.queryByRole("link", { name: /^settings$/i })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /posts/i })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(screen.getByRole("link", { name: /posts/i })).toHaveStyle({
      backgroundColor: "color-mix(in srgb, var(--accent) 13%, transparent)",
    })
    expect(screen.getByRole("link", { name: /posts/i }).className).not.toContain(
      "ring-border-default",
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
    expect(container.querySelector("header > div")).toHaveClass("grid")
    expect(screen.getByRole("navigation", { name: "Admin navigation" })).not.toHaveClass(
      "absolute",
    )
    expect(screen.getByRole("navigation", { name: "Admin navigation" })).not.toHaveClass(
      "overflow-x-auto",
    )
    expect(screen.getByRole("link", { name: /blog/i })).toHaveClass(
      "rounded-full",
      "border",
    )
  })

  it("keeps theme, season, and particle controls available in the mobile admin header", () => {
    render(<AdminHeader />)

    expect(screen.getByTestId("mobile-admin-appearance-controls")).toHaveClass("flex")
    expect(screen.getByTestId("mobile-admin-appearance-controls")).not.toHaveClass("hidden")
    expect(screen.getByRole("button", { name: /particles/i })).toBeVisible()
    expect(screen.getByRole("button", { name: /mode/i })).toBeVisible()
  })

  it("opens the admin navigation as a compact anchored menu", async () => {
    const user = userEvent.setup()
    render(<AdminHeader />)

    await user.click(screen.getByRole("button", { name: /open admin menu/i }))
    expect(screen.getByRole("navigation", { name: "Mobile admin navigation" })).toBeVisible()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("navigation", { name: "Mobile admin navigation" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /open admin menu/i }))
    fireEvent.pointerDown(document.body)
    await waitFor(() => {
      expect(screen.queryByRole("navigation", { name: "Mobile admin navigation" })).not.toBeInTheDocument()
    })
  })

  it("shows categories and tags as separate independently scrollable sections", () => {
    render(
      <AdminContentManager
        categories={[
          {
            _count: { posts: 1 },
            description: null,
            id: "category-1",
            name: "Analysis",
            slug: "analysis",
          },
        ]}
        tags={[
          {
            _count: { posts: 1 },
            id: "tag-1",
            name: "Sakuga",
            slug: "sakuga",
          },
        ]}
      />,
    )

    expect(screen.getByRole("heading", { name: "Categories" })).toBeVisible()
    expect(screen.getByRole("heading", { name: "Tags" })).toBeVisible()
    expect(screen.getByTestId("category-management-scroll")).toHaveClass(
      "sm:overflow-x-auto",
    )
    expect(screen.getByTestId("tag-management-scroll")).toHaveClass(
      "sm:overflow-x-auto",
    )
    expect(screen.getByTestId("category-post-count-suffix")).toHaveClass("sm:hidden")
    expect(screen.getByTestId("tag-post-count-suffix")).toHaveClass("sm:hidden")
    expect(
      screen.getByTestId("category-management-scroll").parentElement?.parentElement,
    ).toHaveClass("lg:grid-cols-2")
    expect(screen.queryByRole("button", { name: /^Categories$/ })).not.toBeInTheDocument()
  })

  it("opens event management from the event name without a settings button", () => {
    render(
      <AdminEventsManager
        categories={[]}
        events={[
          {
            _count: { rooms: 2 },
            createdAt: new Date("2026-01-01T00:00:00Z"),
            id: "event-1",
            finalPost: { status: "PUBLISHED" },
            slug: "awards-2026",
            status: "OPEN",
            title: "Awards 2026",
            updatedAt: new Date("2026-01-02T00:00:00Z"),
          },
        ]}
        tags={[]}
      />,
    )

    expect(screen.getByRole("link", { name: "Awards 2026" })).toHaveAttribute(
      "href",
      "/admin/events/event-1",
    )
    expect(screen.queryByRole("link", { name: /Manage Awards 2026/i })).not.toBeInTheDocument()
    expect(screen.getByText("Published")).toHaveClass("bg-emerald-500/10")
    expect(screen.queryByText("Article: Published")).not.toBeInTheDocument()
  })

  it("deletes an event after explicit confirmation", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(okResponse())
    vi.stubGlobal("fetch", fetchMock)

    render(
      <AdminEventsManager
        categories={[]}
        events={[
          {
            _count: { rooms: 2 },
            createdAt: new Date("2026-01-01T00:00:00Z"),
            finalPost: null,
            id: "event-1",
            slug: "awards-2026",
            status: "OPEN",
            title: "Awards 2026",
            updatedAt: new Date("2026-01-02T00:00:00Z"),
          },
        ]}
        tags={[]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Delete Awards 2026" }))
    const dialog = screen.getByRole("dialog", { name: "Delete event?" })
    expect(dialog).toBeVisible()
    await user.type(within(dialog).getByRole("textbox"), "Awards 2026")
    await user.click(within(dialog).getByRole("button", { name: "Delete event" }))

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/events/event-1", {
      body: JSON.stringify({ confirmation: "Awards 2026" }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    })
    await waitFor(() => expect(routerMocks.refresh).toHaveBeenCalled())
  })

  it("uses the server-provided admin user without fetching the session again", () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    render(
      <AdminNav
        user={{
          avatarUrl: null,
          name: "Nun",
          role: "ADMIN",
          username: "admin",
        }}
      />,
    )

    expect(
      screen.getByRole("button", { name: "Mở menu tác giả" }),
    ).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalledWith("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
    })
  })

  it("soft-removes posts with a required reason and removes the row locally", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(okResponse()))
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

    await user.click(screen.getByRole("button", { name: /take down post/i }))
    expect(screen.getByRole("heading", { name: "Take down post?" })).toBeVisible()
    const confirm = within(screen.getByRole("dialog", { name: "Take down post?" }))
      .getByRole("button", { name: "Take down post" })
    expect(confirm).toBeDisabled()
    await user.type(screen.getByRole("textbox", { name: "Reason" }), "Policy violation")
    await user.click(confirm)

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/posts/post-1/moderation", {
      body: JSON.stringify({ action: "REMOVE", reason: "Policy violation" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    await waitFor(() => expect(screen.getByText("Removed")).toBeVisible())
    expect(screen.getByRole("button", { name: "Restore removed post" })).toBeVisible()
    expect(routerMocks.refresh).not.toHaveBeenCalled()
  })

  it("renders admin posts as mobile cards without a forced desktop-width table", () => {
    render(
      <AdminPostsTable
        posts={[
          {
            _count: { comments: 2 },
            author: { name: "Mina", username: "mina" },
            id: "post-mobile",
            publishedAt: null,
            slug: "mobile-post",
            status: "DRAFT",
            title: "Mobile post",
            updatedAt: new Date("2026-01-02T00:00:00Z"),
          },
        ]}
      />,
    )

    expect(screen.getByTestId("admin-posts-list")).toHaveClass(
      "min-w-0",
      "md:min-w-[750px]",
    )
    expect(screen.getByTestId("admin-post-row-post-mobile")).toHaveClass(
      "flex-col",
      "md:flex-row",
    )
  })

  it("archives and restores posts from the admin posts table without a full refresh", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(okResponse()))
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
    await user.type(screen.getByRole("textbox", { name: "Reason" }), "Needs review")
    await user.click(
      within(screen.getByRole("heading", { name: "Archive post?" }).closest("div")!)
        .getByRole("button", { name: "Archive post" }),
    )
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/posts/post-1/moderation", {
      body: JSON.stringify({ action: "ARCHIVE", reason: "Needs review" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    await waitFor(() => {
      expect(screen.getAllByText("Archived")).toHaveLength(2)
    })

    await user.click(
      screen.getAllByRole("button", { name: /restore post to draft/i })[0],
    )
    expect(screen.getByRole("heading", { name: "Restore post?" })).toBeVisible()
    await user.type(screen.getByRole("textbox", { name: "Reason" }), "Review complete")
    await user.click(
      within(screen.getByRole("heading", { name: "Restore post?" }).closest("div")!)
        .getByRole("button", { name: "Restore post" }),
    )
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/posts/post-1/moderation", {
      body: JSON.stringify({ action: "RESTORE_ARCHIVED", reason: "Review complete" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    await waitFor(() => {
      expect(screen.getAllByText("Archived")).toHaveLength(1)
    })
    expect(routerMocks.refresh).not.toHaveBeenCalled()
  })

  it("unpublishes and republishes posts with moderation reasons", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(okResponse()))
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
        ]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Unpublish post" }))
    await user.type(screen.getByRole("textbox", { name: "Reason" }), "Add citations")
    await user.click(screen.getByRole("button", { name: "Unpublish" }))
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/admin/posts/post-1/moderation",
      expect.objectContaining({
        body: JSON.stringify({ action: "UNPUBLISH", reason: "Add citations" }),
      }),
    )

    await waitFor(() => expect(screen.getByText("Draft")).toBeVisible())
    await user.click(screen.getByRole("button", { name: "Publish post" }))
    await user.type(screen.getByRole("textbox", { name: "Reason" }), "Citations verified")
    await user.click(screen.getByRole("button", { name: "Publish" }))
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/admin/posts/post-1/moderation",
      expect.objectContaining({
        body: JSON.stringify({ action: "PUBLISH", reason: "Citations verified" }),
      }),
    )
  })

  it("sends bulk moderation as one atomic server request", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({
        data: { posts: [{ id: "post-1", status: "REMOVED" }] },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(
      <AdminPostsTable
        posts={[
          {
            _count: { comments: 0 },
            author: { name: "Mina", username: "mina" },
            id: "post-1",
            publishedAt: null,
            slug: "draft-post",
            status: "DRAFT",
            title: "Draft post",
            updatedAt: new Date("2026-01-02T00:00:00Z"),
          },
        ]}
      />,
    )

    await user.click(screen.getAllByRole("checkbox")[1])
    await user.click(screen.getByRole("button", { name: "Take down selected posts" }))
    await user.type(screen.getByRole("textbox", { name: "Reason" }), "Bulk policy review")
    await user.click(
      within(screen.getByRole("dialog", { name: "Take down selected posts?" }))
        .getByRole("button", { name: "Take down posts" }),
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith("/api/posts/bulk", {
      body: JSON.stringify({
        action: "REMOVE",
        postIds: ["post-1"],
        reason: "Bulk policy review",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    await waitFor(() => expect(screen.getByText("Removed")).toBeVisible())
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
            displayRoleColor: null,
            displayRoleLocked: false,
            displayRoleName: null,
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
    await user.click(
      within(screen.getByRole("dialog", { name: "Remove writer access?" }))
        .getByRole("button", { name: "Remove writer access" }),
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
            displayRoleColor: null,
            displayRoleLocked: false,
            displayRoleName: null,
            email: "admin@example.com",
            id: "admin-1",
            name: "Admin",
            role: "ADMIN",
            username: "admin",
          },
          {
            _count: { posts: 0 },
            createdAt: new Date("2026-01-02T00:00:00Z"),
            displayRoleColor: null,
            displayRoleLocked: false,
            displayRoleName: null,
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

  it("uses direct compact profile actions without the invite plus icon", () => {
    const { container } = render(
      <WritersTable
        writers={[
          {
            _count: { posts: 0 },
            createdAt: new Date("2026-01-01T00:00:00Z"),
            displayRoleColor: null,
            displayRoleLocked: false,
            displayRoleName: null,
            email: "writer@example.com",
            id: "writer-1",
            name: "Mina",
            role: "WRITER",
            username: "mina",
          },
        ]}
      />,
    )

    expect(screen.getByRole("button", { name: "Invite Writer" })).not.toContainHTML("lucide-plus")
    expect(screen.getByRole("link", { name: "View public profile for Mina" })).toHaveAttribute(
      "href",
      "/authors/mina",
    )
    expect(screen.queryByRole("button", { name: "More options" })).not.toBeInTheDocument()
    expect(container.querySelector("article > div:last-child")).toHaveClass("w-fit")
  })

  it("lets admins edit and lock a writer display role", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(okResponse())
    vi.stubGlobal("fetch", fetchMock)

    render(
      <WritersTable
        writers={[
          {
            _count: { posts: 1 },
            createdAt: new Date("2026-01-01T00:00:00Z"),
            displayRoleColor: null,
            displayRoleLocked: false,
            displayRoleName: null,
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
      screen.getByRole("button", { name: "Manage display role for Mina" }),
    )
    const dialog = screen.getByRole("dialog", { name: "Manage display role" })
    const roleName = within(dialog).getByRole("textbox", {
      name: "Display role for Mina",
    })
    await user.clear(roleName)
    await user.type(roleName, "Archive Curator")
    fireEvent.change(
      within(dialog).getByLabelText("Role color for Mina"),
      { target: { value: "#475569" } },
    )
    await user.click(within(dialog).getByRole("checkbox", { name: /lock/i }))
    await user.click(within(dialog).getByRole("button", { name: "Save role" }))

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/writers/writer-1", {
      body: expect.any(String),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const requestBody = JSON.parse(
      String((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body),
    ) as Record<string, unknown>
    expect(requestBody).toEqual({
      displayRoleColor: "#475569",
      displayRoleLocked: true,
      displayRoleName: "Archive Curator",
    })
    await waitFor(() => {
      expect(routerMocks.refresh).toHaveBeenCalled()
    })
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
    await user.click(
      within(screen.getByRole("dialog", { name: "Mark comment as spam?" }))
        .getByRole("button", { name: "Mark as spam" }),
    )

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
      okResponse({
        data: { broadcastId: "broadcast-1", queued: 5, total: 5 },
      }),
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
    await user.click(
      within(screen.getByRole("dialog", { name: "Send newsletter now?" }))
        .getByRole("button", { name: "Send newsletter" }),
    )

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
      "Queued for 5 of 5 subscribers",
    )
    expect(routerMocks.refresh).toHaveBeenCalled()
  })
})
