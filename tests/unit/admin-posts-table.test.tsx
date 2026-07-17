import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/link", () => ({
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("status=REMOVED"),
}))

import { AdminPostsTable } from "@/components/admin/AdminPostsTable"

const removedPost = {
  _count: { comments: 3 },
  author: { name: "Mina", username: "mina" },
  id: "post-1",
  publishedAt: null,
  removedAt: new Date("2026-01-01T00:00:00.000Z"),
  slug: "frieren-animation",
  status: "REMOVED" as const,
  title: "Frieren Animation",
  updatedAt: new Date("2026-07-15T00:00:00.000Z"),
}

describe("AdminPostsTable permanent deletion", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("requires the exact post title before permanently deleting a removed post", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { message: "Post permanently deleted" } }), {
        status: 200,
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(<AdminPostsTable posts={[removedPost]} />)

    await user.click(screen.getByRole("button", { name: "Permanently delete post" }))
    const confirmButton = screen.getByRole("button", { name: "Permanently delete" })
    const confirmationInput = screen.getByLabelText("Type the post title to confirm")

    expect(confirmButton).toBeDisabled()
    await user.type(confirmationInput, "Wrong title")
    expect(confirmButton).toBeDisabled()

    await user.clear(confirmationInput)
    await user.type(confirmationInput, removedPost.title)
    expect(confirmButton).toBeEnabled()
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(`/api/posts/${removedPost.id}`, {
        body: JSON.stringify({ confirmation: removedPost.title }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      })
    })
    expect(screen.queryByText(removedPost.title)).not.toBeInTheDocument()
  })

  it("does not offer permanent deletion for active posts", () => {
    render(<AdminPostsTable posts={[{ ...removedPost, status: "PUBLISHED" }]} />)

    expect(
      screen.queryByRole("button", { name: "Permanently delete post" }),
    ).not.toBeInTheDocument()
  })

  it("keeps permanent deletion disabled during the 90-day recovery window", () => {
    render(
      <AdminPostsTable
        posts={[{ ...removedPost, removedAt: new Date(), updatedAt: new Date() }]}
      />,
    )

    expect(
      screen.getByRole("button", { name: "Permanently delete post" }),
    ).toBeDisabled()
  })
})
