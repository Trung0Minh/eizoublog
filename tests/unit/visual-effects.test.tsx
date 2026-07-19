import { render, screen, waitFor } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const navigationMocks = vi.hoisted(() => ({
  pathname: "/",
}))

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
}))

vi.mock("motion/react", async () => {
  const React = await import("react")

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
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

vi.mock("next-themes", () => ({
  useTheme: () => ({ systemTheme: "light", theme: "light" }),
}))

import { AmbientBackground } from "@/components/ui/AmbientBackground"
import { CustomCursor } from "@/components/ui/CustomCursor"
import { DynamicBackground } from "@/components/ui/DynamicBackground"
import { GlobalEffects } from "@/components/ui/GlobalEffects"
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
    navigationMocks.pathname = "/"
    document.cookie = "particleEffects=; path=/; max-age=0"
    document.documentElement.setAttribute("data-season", "summer")
  })

  afterEach(() => {
    document.cookie = "particleEffects=; path=/; max-age=0"
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

  it("keeps seasonal particles on admin routes without the heavier global effects", async () => {
    navigationMocks.pathname = "/admin"

    render(<GlobalEffects />)

    await waitFor(() => {
      expect(screen.getAllByTestId("seasonal-particle")).toHaveLength(16)
    })
    expect(screen.queryByTestId("ambient-motion-layer")).not.toBeInTheDocument()
    expect(screen.queryByTestId("ambient-grid")).not.toBeInTheDocument()
    expect(screen.queryByTestId("noise-overlay")).not.toBeInTheDocument()
    expect(screen.queryByTestId("custom-cursor")).not.toBeInTheDocument()
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

  it("allows touch devices to opt particles back in", async () => {
    setMedia({ coarse: true })
    document.cookie = "particleEffects=on; path=/"
    render(<SeasonalEffects />)

    await waitFor(() => {
      expect(screen.getAllByTestId("seasonal-particle")).toHaveLength(16)
    })
  })

  it("keeps full-screen grain off public foreground content", () => {
    render(<GlobalEffects />)

    expect(screen.queryByTestId("noise-overlay")).not.toBeInTheDocument()
  })

  it("keeps glass surfaces free of fractal noise textures", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")
    const glassRules = ["glass-navbar", "glass-card"].map((className) =>
      css.match(new RegExp(`\\.${className}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`))?.[1] ?? "",
    )

    glassRules.forEach((rule) => {
      expect(rule).not.toMatch(/fractalNoise|background-image/)
    })
  })

  it("tints the navbar with the active seasonal accent", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")
    const navbarRule =
      css.match(/\.glass-navbar\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? ""

    expect(navbarRule).toContain("var(--accent)")
    expect(navbarRule).toContain("color-mix")
  })

  it("keeps the shared subtle background utility cheap to paint", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")
    const subtleBgRule = css.match(/\.bg-subtle-bg\s*\{([\s\S]*?)\n\s*\}/)

    expect(subtleBgRule?.[1] ?? "").not.toMatch(/backdrop-filter/)
  })

  it("updates the homepage background only when crossing a throttled section boundary", () => {
    const source = readFileSync(
      join(process.cwd(), "components/ui/DynamicBackground.tsx"),
      "utf8",
    )

    expect(source).toContain("requestAnimationFrame")
    expect(source).toContain('addEventListener("scroll"')
    expect(source).toContain("homeContentActiveRef.current !== nextActive")
    expect(source).not.toContain("useScroll")
    expect(source).not.toContain("useTransform")
  })

  it("avoids full-screen image filters on coarse pointer devices", () => {
    const source = readFileSync(
      join(process.cwd(), "components/ui/DynamicBackground.tsx"),
      "utf8",
    )

    expect(source).toContain("useReducedVisualEffects")
    expect(source).toMatch(
      /shouldReduce\s*\?\s*"none"\s*:\s*"blur\(6px\)"/,
    )
    expect(source).not.toContain('willChange: "opacity, transform"')
  })

  it("isolates particle paint work from page scrolling", () => {
    const source = readFileSync(
      join(process.cwd(), "components/ui/SakuraFalling.tsx"),
      "utf8",
    )
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")

    expect(source).toContain("containPaint")
    expect(css).toContain("will-change: transform, opacity")
    expect(css).toContain("backface-visibility: hidden")
  })

  it("shows the seasonal background immediately above the page fallback", () => {
    const source = readFileSync(
      join(process.cwd(), "components/ui/DynamicBackground.tsx"),
      "utf8",
    )

    expect(source).not.toContain("-z-50")
    expect(source).toContain('className="fixed inset-0 z-0')
    expect(source).toContain("initial={false}")
  })

  it("renders separate desktop and mobile background crops with a mobile vignette", () => {
    const source = readFileSync(
      join(process.cwd(), "components/ui/DynamicBackground.tsx"),
      "utf8",
    )

    expect(source).toContain('getCoverStyle(bgUrl, "desktop")')
    expect(source).toContain('getCoverStyle(bgUrl, "mobile")')
    expect(source).toMatch(/hidden[^"]*md:block/)
    expect(source).toContain("md:hidden")
    expect(source).toContain('data-testid="mobile-background-vignette"')
  })

  it("keeps the last valid custom background during a transient reload failure", async () => {
    const { container, rerender } = render(
      <DynamicBackground
        customBackgrounds={{ summer_light: "https://cdn.example.com/summer.jpg" }}
        initialSeason="summer"
        initialTheme="light"
      />,
    )

    await waitFor(() => {
      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        "https://cdn.example.com/summer.jpg",
      )
    })

    rerender(
      <DynamicBackground
        customBackgrounds={null}
        initialSeason="summer"
        initialTheme="light"
      />,
    )

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://cdn.example.com/summer.jpg",
    )

    rerender(
      <DynamicBackground
        customBackgrounds={{}}
        initialSeason="summer"
        initialTheme="light"
      />,
    )

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/bg/summer_light.jpg",
    )
  })
})
