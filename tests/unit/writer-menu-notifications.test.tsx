import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}))

vi.mock("next-auth/react", () => ({
  signOut: mocks.signOut,
}))
vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))

import { WriterMenu } from "@/components/layout/WriterMenu"

describe("WriterMenu notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches notification counts even when a user is provided", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input)
        if (url === "/api/user/pending-invites-count") {
          return new Response(JSON.stringify({ data: { count: 2 } }))
        }
        if (url === "/api/user/unread-comments-count") {
          return new Response(JSON.stringify({ data: { count: 3 } }))
        }
        return new Response(JSON.stringify({ data: { count: 0 } }))
      })

    try {
      render(
        <WriterMenu
          user={{
            avatarUrl: null,
            name: "Mina Writer",
            role: "WRITER",
            username: "mina",
          }}
        />,
      )

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/user/pending-invites-count",
        )
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/user/unread-comments-count",
        )
      })

      await userEvent.click(
        screen.getByRole("button", { name: "Mở menu tác giả" }),
      )

      expect(screen.getByRole("menuitem", { name: /Thông báo/ })).toHaveAttribute(
        "href",
        "/dashboard/notifications",
      )
      expect(screen.getByText("5")).toBeInTheDocument()
    } finally {
      fetchMock.mockRestore()
    }
  })
})
