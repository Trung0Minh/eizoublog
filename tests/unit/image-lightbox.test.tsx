import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ImageLightbox } from "@/components/posts/ImageLightbox"

vi.mock("react-zoom-pan-pinch", () => ({
  TransformComponent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TransformWrapper: ({
    children,
  }: {
    children: (controls: {
      zoomIn: () => void
      zoomOut: () => void
    }) => React.ReactNode
  }) => <div>{children({ zoomIn: vi.fn(), zoomOut: vi.fn() })}</div>,
}))

describe("ImageLightbox", () => {
  beforeEach(() => {
    vi.mocked(Element.prototype.scrollIntoView).mockClear()
  })

  it("keeps the thumbnail strip mounted and follows arrow navigation", async () => {
    render(
      <ImageLightbox
        images={[
          { alt: "First", src: "/first.jpg" },
          { alt: "Second", src: "/second.jpg" },
          { alt: "Third", src: "/third.jpg" },
        ]}
        initialIndex={0}
        onClose={vi.fn()}
      />,
    )

    const thumbnailList = await screen.findByRole("list", {
      name: "Image thumbnails",
    })
    vi.mocked(Element.prototype.scrollIntoView).mockClear()

    fireEvent.click(screen.getByRole("button", { name: "Next image" }))

    expect(
      screen.getByRole("list", { name: "Image thumbnails" }),
    ).toBe(thumbnailList)
    expect(
      screen.getByRole("button", { name: "View image 2" }),
    ).toHaveAttribute("aria-current", "true")
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    })
  })
})
