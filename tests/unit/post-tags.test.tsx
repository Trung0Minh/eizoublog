import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PostTags } from "@/components/posts/PostTags"

afterEach(() => vi.restoreAllMocks())

describe("PostTags", () => {
  it("counts tags beyond two rows and expands and collapses them", () => {
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return Number(this.textContent?.replace("Tag ", "")) * 44
    })
    render(<PostTags tags={Array.from({ length: 5 }, (_, index) => ({
      name: `Tag ${index}`, slug: `tag-${index}`,
    }))} />)

    const toggle = screen.getByRole("button", { name: "+3 thẻ khác" })
    const lastTag = screen.getByText("Tag 4").closest("a")
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(lastTag).toHaveClass("invisible")
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(toggle).toHaveTextContent("Thu gọn")
    expect(lastTag).not.toHaveClass("invisible")
    expect(lastTag).toHaveAttribute("href", "/tag/tag-4")
    fireEvent.click(toggle)
    expect(lastTag).toHaveClass("invisible")
  })

  it("does not offer expansion when all tags fit", () => {
    render(<PostTags tags={[{ name: "Anime", slug: "anime" }]} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
