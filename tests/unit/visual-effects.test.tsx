import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("motion/react", async () => {
  const React = await import("react")

  return {
    motion: {
      div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
        function MotionDiv(props, ref) {
          const { children, ...rest } = props
          return <div ref={ref} {...rest}>{children}</div>
        },
      ),
    },
    useMotionValue: (value: number) => ({ set: vi.fn(), value }),
    useSpring: (value: unknown) => value,
  }
})

import { AmbientBackground } from "@/components/ui/AmbientBackground"
import { CustomCursor } from "@/components/ui/CustomCursor"
import { NoiseOverlay } from "@/components/ui/NoiseOverlay"
import { SeasonalEffects } from "@/components/ui/SakuraFalling"

function setMedia({ coarse = false, reduced = false } = {}) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      matches:
        (query.includes("pointer: coarse") && coarse) ||
        (query.includes("prefers-reduced-motion") && reduced) ||
        (query.includes("pointer: fine") && !coarse),
      media: query,
      removeEventListener: vi.fn(),
    })),
  )
}

describe("responsive visual effects", () => {
  beforeEach(() => {
    setMedia()
    document.documentElement.setAttribute("data-season", "summer")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("keeps mobile ambient decoration static", async () => {
    setMedia({ coarse: true })
    render(<AmbientBackground />)

    await waitFor(() => {
      expect(screen.queryByTestId("ambient-motion-layer")).not.toBeInTheDocument()
    })
    expect(screen.getByTestId("ambient-grid")).toBeInTheDocument()
  })

  it("caps desktop seasonal particles", async () => {
    render(<SeasonalEffects />)

    await waitFor(() => {
      expect(screen.getAllByTestId("seasonal-particle")).toHaveLength(16)
    })
  })

  it("removes seasonal particles and the custom cursor on touch devices", async () => {
    setMedia({ coarse: true })
    const { container, rerender } = render(<SeasonalEffects />)

    await waitFor(() => {
      expect(
        container.querySelectorAll(
          ".sakura-petal,.summer-firefly,.autumn-leaf,.winter-snow",
        ),
      ).toHaveLength(0)
    })

    rerender(<CustomCursor />)
    await waitFor(() => {
      expect(container.innerHTML).toBe("")
    })
  })

  it("does not paint the noise overlay below the desktop breakpoint", () => {
    render(<NoiseOverlay />)

    expect(screen.getByTestId("noise-overlay")).toHaveClass("hidden", "md:block")
  })
})
