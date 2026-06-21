import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}))

import { CommandMenu } from "@/components/ui/CommandMenu"

describe("CommandMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Element.prototype.scrollIntoView = vi.fn()
  })

  it("defers category loading until the command menu opens", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ id: "category-1", name: "Production", slug: "production" }],
        }),
      ),
    )

    try {
      render(<CommandMenu />)

      expect(fetchMock).not.toHaveBeenCalled()

      await user.keyboard("{Control>}k{/Control}")

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/categories")
      })
      expect(await screen.findByText("Production")).toBeInTheDocument()
    } finally {
      fetchMock.mockRestore()
    }
  })
})
