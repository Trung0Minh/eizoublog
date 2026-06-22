import { fireEvent, render, screen } from "@testing-library/react"
import type { CSSProperties, HTMLAttributes, ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const zoomMocks = vi.hoisted(() => ({
  resetTransform: vi.fn(),
  wrapperProps: vi.fn(),
}))

vi.mock("react-zoom-pan-pinch", () => ({
  TransformWrapper: ({
    children,
    ...props
  }: {
    children: (controls: {
      resetTransform: typeof zoomMocks.resetTransform
      zoomIn: () => void
      zoomOut: () => void
    }) => ReactNode
    [key: string]: unknown
  }) => {
    zoomMocks.wrapperProps(props)

    return children({
      resetTransform: zoomMocks.resetTransform,
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
    })
  },
  TransformComponent: ({
    children,
    contentStyle,
    wrapperProps,
    wrapperStyle,
  }: {
    children: ReactNode
    contentStyle?: CSSProperties
    wrapperProps?: HTMLAttributes<HTMLDivElement>
    wrapperStyle?: CSSProperties
  }) => (
    <div data-testid="zoom-wrapper" style={wrapperStyle} {...wrapperProps}>
      <div data-testid="zoom-content" style={contentStyle}>
        {children}
      </div>
    </div>
  ),
}))

import { ImageLightbox } from "@/components/posts/ImageLightbox"

describe("ImageLightbox gestures", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("uses image-sized transform content and deterministic gesture settings", async () => {
    render(
      <ImageLightbox
        images={[{ alt: "Animation frame", src: "/frame.webp" }]}
        initialIndex={0}
        onClose={vi.fn()}
      />,
    )

    const content = await screen.findByTestId("zoom-content")

    expect(content.style.width).toBe("")
    expect(content.style.height).toBe("")
    expect(zoomMocks.wrapperProps).toHaveBeenCalledWith(
      expect.objectContaining({
        panning: { velocityDisabled: true },
        smooth: false,
        wheel: { step: 0.1 },
      }),
    )
  })

  it("recovers the transform state when a mobile gesture is canceled", async () => {
    render(
      <ImageLightbox
        images={[{ alt: "Animation frame", src: "/frame.webp" }]}
        initialIndex={0}
        onClose={vi.fn()}
      />,
    )

    fireEvent.touchCancel(await screen.findByTestId("zoom-wrapper"))

    expect(zoomMocks.resetTransform).toHaveBeenCalledWith(0)
  })
})
