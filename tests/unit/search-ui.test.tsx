import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}))
vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))

import { SearchBar } from "@/components/search/SearchBar"

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it("debounces search requests and shows inline results", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            results: [
              {
                authorName: "Mina",
                id: "post-1",
                slug: "frieren-memory",
                title: "Frieren and memory",
              },
            ],
          },
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(<SearchBar />)

    await user.type(
      screen.getByRole("searchbox", { name: "Tìm kiếm bài viết" }),
      "frieren",
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/search?q=frieren&limit=5")
    })
    expect(
      await screen.findByRole("link", { name: /Frieren and memory/ }),
    ).toHaveAttribute("href", "/frieren-memory")
    expect(
      screen.getByRole("link", { name: /Xem tất cả kết quả cho/ }),
    ).toHaveAttribute("href", "/search?q=frieren")
  })

  it("navigates to the full search page on Enter", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { results: [] } }), {
          status: 200,
        }),
      ),
    )

    render(<SearchBar />)

    await user.type(
      screen.getByRole("searchbox", { name: "Tìm kiếm bài viết" }),
      "ufota{Enter}",
    )

    expect(routerMocks.push).toHaveBeenCalledWith("/search?q=ufota")
  })
})
