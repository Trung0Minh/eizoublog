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
  it("uses a compact mobile action dock and restores the left rail on larger screens", async () => {
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
        previewHref="/dashboard/preview/post-1"
      />,
    )

    const dashboardLink = screen.getByRole("link", { name: /Bảng điều khiển/ })
    expect(dashboardLink).toHaveAttribute("href", "/dashboard")
    expect(dashboardLink).toHaveClass("rounded-full", "border")
    expect(screen.getByRole("link", { name: "Xem trước bài viết" })).toHaveAttribute(
      "href",
      "/dashboard/preview/post-1",
    )
    expect(screen.getByTestId("editor-action-rail")).toHaveClass(
      "bottom-3",
      "left-1/2",
      "flex-row",
      "lg:left-4",
      "lg:top-1/2",
      "lg:flex-col",
    )
    expect(screen.queryByText("✨")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Lưu nháp/ }))
    await user.click(screen.getByRole("button", { name: "Xuất bản bài viết" }))

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
    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeDisabled()
    expect(
      screen.queryByText("Thêm tiêu đề để có thể lưu và xuất bản."),
    ).not.toBeInTheDocument()
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

    const updateButton = screen.getByRole("button", { name: /Cập nhật bài viết/ })
    const spinner = updateButton.querySelector("[data-button-spinner='true']")

    expect(spinner).not.toBeNull()
    expect(spinner).toHaveClass("text-current")
    expect(spinner).not.toHaveClass("loader")
  })

  it("hides publish controls when the editor cannot publish", () => {
    render(
      <EditorTopBar
        canPublish={false}
        canSave
        exitHref="/dashboard"
        isPending={false}
        isPublished={false}
        onPublish={vi.fn()}
        onSaveDraft={vi.fn()}
      />,
    )

    expect(screen.queryByRole("button", { name: "Xuất bản bài viết" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Lưu nháp/ })).toBeVisible()
  })
})
