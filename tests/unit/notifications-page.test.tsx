import { render, screen } from "@testing-library/react"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  getNotifications: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/lib/authz", () => ({ getActiveSession: mocks.getActiveSession }))
vi.mock("@/lib/notifications", () => ({
  getNotifications: mocks.getNotifications,
}))
vi.mock("@/components/notifications/MarkCommentsReadButton", () => ({
  MarkCommentsReadButton: ({ disabled }: { disabled?: boolean }) => (
    <button disabled={disabled} type="button">
      Đánh dấu tất cả đã đọc
    </button>
  ),
}))
vi.mock("@/components/posts/CoAuthorInviteActions", () => ({
  CoAuthorInviteActions: () => <div>Invite actions</div>,
}))

import NotificationsPage from "@/app/(writer)/dashboard/notifications/page"

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveSession.mockResolvedValue({
      user: {
        email: "writer@example.com",
        id: "writer-1",
        role: "WRITER",
      },
    })
    mocks.getNotifications.mockResolvedValue({
      pendingInvites: [],
      responseEvents: [],
      unreadComments: [],
    })
  })

  it("links co-author response notifications to the editor instead of the public post", async () => {
    mocks.getNotifications.mockResolvedValue({
      pendingInvites: [],
      responseEvents: [
        {
          createdAt: new Date("2026-06-16T05:00:00Z"),
          data: {
            actorName: "Anh Đức",
            postId: "post-1",
            postSlug: "draft-only-post",
            postTitle: "Draft only post",
          },
          id: "notification-1",
          type: "COAUTHOR_ACCEPTED",
        },
      ],
      unreadComments: [],
    })

    render(await NotificationsPage())

    const responseLink = screen.getByRole("link", { name: "Draft only post" })
    const viewLink = screen.getByRole("link", { name: "Xem" })

    expect(responseLink).toHaveAttribute("href", "/dashboard/edit/post-1")
    expect(viewLink).toHaveAttribute("href", "/dashboard/edit/post-1")
    expect(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }))
      .toBeEnabled()
  })

  it("disables the global read button when only pending invites remain", async () => {
    mocks.getNotifications.mockResolvedValue({
      pendingInvites: [
        {
          post: {
            author: { name: "Mina", username: "mina" },
            id: "post-2",
            slug: "shared-draft",
            title: "Shared Draft",
            updatedAt: new Date("2026-06-16T03:00:00Z"),
          },
          postId: "post-2",
        },
      ],
      responseEvents: [],
      unreadComments: [],
    })

    render(await NotificationsPage())

    expect(screen.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }))
      .toBeDisabled()
  })
})
