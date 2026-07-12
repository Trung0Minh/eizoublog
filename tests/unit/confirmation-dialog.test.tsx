import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Archive } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"

describe("ConfirmationDialog", () => {
  it("renders contextual content and confirms accessibly", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmationDialog
        confirmLabel="Archive post"
        description="The post will no longer be public."
        icon={Archive}
        onConfirm={onConfirm}
        onOpenChange={vi.fn()}
        open
        title="Archive this post?"
        tone="warning"
      />,
    )

    expect(screen.getByRole("dialog", { name: "Archive this post?" })).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Archive post" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("disables both actions while an operation is pending", () => {
    render(
      <ConfirmationDialog
        confirmLabel="Remove"
        description="This cannot be undone."
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
        open
        pending
        title="Remove access?"
        tone="destructive"
      />,
    )

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled()
  })
})
