import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Link from "next/link"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useWarnUnsaved } from "@/hooks/useWarnUnsaved"

function Harness() {
  useWarnUnsaved(true)
  return <Link href="/dashboard">Leave editor</Link>
}

describe("useWarnUnsaved", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("guards internal links while the editor has unsaved work", async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
    render(<Harness />)

    await user.click(screen.getByRole("link", { name: "Leave editor" }))

    expect(confirm).toHaveBeenCalledWith(
      "Your latest changes have not been saved. Leave the editor anyway?",
    )
    expect(window.location.pathname).not.toBe("/dashboard")
  })
})
