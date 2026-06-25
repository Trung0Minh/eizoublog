import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes } from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))

import { EditorTopBar } from "@/components/editor/EditorTopBar"

describe("EditorTopBar", () => {
  it("shows exit, save status, and save/publish actions", async () => {
    const user = userEvent.setup()
    const onPublish = vi.fn()
    const onSaveDraft = vi.fn()

    render(
      <EditorTopBar
        canSave
        exitHref="/dashboard"
        isPending={false}
        isPublished={false}
        onPublish={onPublish}
        onSaveDraft={onSaveDraft}
        
      />,
    )

    expect(screen.getByRole("link", { name: /Bảng điều khiển/ })).toHaveAttribute(
      "href",
      "/dashboard",
    )
    expect(screen.getByText("Đã lưu")).toBeVisible()

    await user.click(screen.getByRole("button", { name: /Lưu nháp/ }))
    await user.click(screen.getByRole("button", { name: "Xuất bản" }))

    expect(onSaveDraft).toHaveBeenCalledTimes(1)
    expect(onPublish).toHaveBeenCalledTimes(1)
  })

  it("uses update copy for published posts and disables actions without a title", () => {
    render(
      <EditorTopBar
        canSave={false}
        exitHref="/dashboard"
        isPending={false}
        isPublished
        onPublish={vi.fn()}
        onSaveDraft={vi.fn()}
        
      />,
    )

    expect(screen.getByRole("button", { name: /Lưu nháp/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cập nhật" })).toBeDisabled()
    expect(
      screen.getByText("Thêm tiêu đề để có thể lưu và xuất bản."),
    ).toBeVisible()
  })

  it("uses a current-color spinner inside pending publish actions", () => {
    render(
      <EditorTopBar
        canSave
        exitHref="/dashboard"
        isPending
        isPublished
        onPublish={vi.fn()}
        onSaveDraft={vi.fn()}
        pendingAction="publish"
        
      />,
    )

    const updateButton = screen.getByRole("button", { name: /Đang cập nhật/ })
    const spinner = updateButton.querySelector("[data-button-spinner='true']")

    expect(spinner).not.toBeNull()
    expect(spinner).toHaveClass("text-current")
    expect(spinner).not.toHaveClass("loader")
  })
})
