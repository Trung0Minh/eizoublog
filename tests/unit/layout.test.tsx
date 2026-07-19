import { act, render, screen } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const themeMocks = vi.hoisted(() => ({
  pathname: "/",
  signOut: vi.fn(),
  setTheme: vi.fn(),
  theme: "light",
}))

vi.mock("next-auth/react", () => ({
  signOut: themeMocks.signOut,
}))
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    setTheme: themeMocks.setTheme,
    theme: themeMocks.theme,
  }),
}))
vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))
vi.mock("next/navigation", () => ({
  usePathname: () => themeMocks.pathname,
  useRouter: () => ({ push: vi.fn() }),
}))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  clearSessionUserCache()
})

import { Footer } from "@/components/layout/Footer"
import { MobileNav } from "@/components/layout/MobileNav"
import { MobileSettings } from "@/components/layout/MobileSettings"
import { Navbar } from "@/components/layout/Navbar"
import { NavbarWrapper } from "@/components/layout/NavbarWrapper"
import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar } from "@/components/layout/Sidebar"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { SeasonToggle } from "@/components/ui/SeasonToggle"
import { WriterMenu } from "@/components/layout/WriterMenu"
import { clearSessionUserCache } from "@/lib/clientSession"

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    themeMocks.theme = "light"
    document.cookie = "appearanceTheme=; Max-Age=0; Path=/"
  })

  it("switches from light to dark mode", async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(
      await screen.findByRole("button", { name: "Switch to dark mode" }),
    )

    expect(themeMocks.setTheme).toHaveBeenCalledWith("dark")
    expect(document.cookie).toContain("appearanceTheme=dark")
  })

  it("uses view transitions when supported by browser", async () => {
    const startTransitionSpy = vi.fn((cb) => {
      cb()
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document.startViewTransition = startTransitionSpy as any

    const animateSpy = vi.fn()
    document.documentElement.animate = animateSpy

    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = await screen.findByRole("button", { name: "Switch to dark mode" })
    await user.click(button)

    expect(startTransitionSpy).toHaveBeenCalled()
    expect(themeMocks.setTheme).toHaveBeenCalledWith("dark")
    
    // We wait for microtasks/promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(animateSpy).toHaveBeenCalled()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).startViewTransition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).documentElement.animate
  })

  it("switches immediately on coarse pointers so mobile taps are never covered", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        addEventListener: vi.fn(),
        matches: query === "(pointer: coarse)",
        media: query,
        removeEventListener: vi.fn(),
      })),
    )
    const startTransitionSpy = vi.fn()
    document.startViewTransition =
      startTransitionSpy as unknown as typeof document.startViewTransition

    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(
      await screen.findByRole("button", { name: "Switch to dark mode" }),
    )

    expect(themeMocks.setTheme).toHaveBeenCalledWith("dark")
    expect(startTransitionSpy).not.toHaveBeenCalled()
  })
})

describe("SeasonToggle", () => {
  beforeEach(() => {
    document.cookie = "appearanceSeason=; Max-Age=0; Path=/"
    document.documentElement.setAttribute("data-season", "spring")
  })

  it("keeps a manual season for the active browser session", async () => {
    const user = userEvent.setup()
    render(<SeasonToggle />)

    await user.click(
      await screen.findByRole("button", { name: "Toggle season" }),
    )

    expect(document.documentElement).toHaveAttribute("data-season", "summer")
    expect(document.cookie).toContain("appearanceSeason=summer")
  })
})

describe("Navbar", () => {
  it("renders publication navigation and search access", () => {
    render(<Navbar user={null} />)

    expect(screen.getByTestId("site-wordmark")).toHaveClass("bg-accent")
    expect(screen.getByTestId("site-wordmark")).toHaveClass(
      "animate-gradient-x",
    )
    expect(screen.getByTestId("site-wordmark").getAttribute("style")).toContain(
      "mask-image: url(\"/eizoublog-logo.svg\")",
    )
    expect(screen.getByTestId("site-wordmark").getAttribute("style")).toContain(
      "linear-gradient(105deg",
    )
    expect(screen.getByTestId("site-wordmark").getAttribute("style")).toContain(
      "--season-logo-secondary",
    )
    const contributors = screen.getByRole("link", { name: "Đóng góp" })
    expect(contributors).toHaveAttribute("href", "/contributors")
    expect(contributors).toHaveAttribute("data-prefetch", "undefined")
    expect(screen.getByRole("link", { name: "Giới thiệu" })).toHaveAttribute(
      "href",
      "/about",
    )
    expect(screen.getByRole("link", { name: "Nhập môn Sakuga" })).toHaveAttribute(
      "href",
      "/nhap-mon-sakuga",
    )
    expect(
      screen.getAllByRole("button", { name: /Tìm kiếm/i }).length
    ).toBeGreaterThan(0)
  })

  it("keeps the desktop writer menu hidden on mobile", () => {
    render(
      <Navbar
        user={{ avatarUrl: null, name: "Mina Writer", username: "mina" }}
      />,
    )

    expect(screen.getByTestId("desktop-writer-menu")).toHaveClass(
      "hidden",
      "md:block",
    )
  })

  it("keeps the homepage navbar visible while a nav menu is open", () => {
    const wrapperSource = readFileSync(
      join(process.cwd(), "components/layout/NavbarWrapper.tsx"),
      "utf8",
    )
    const menuSource = readFileSync(
      join(process.cwd(), "components/layout/WriterMenu.tsx"),
      "utf8",
    )

    expect(wrapperSource).toContain("isMenuOpen")
    expect(wrapperSource).toContain("navbar-menu:open-change")
    expect(wrapperSource).toContain("|| isMenuOpen")
    expect(menuSource).toContain("onOpenChange={handleOpenChange}")
  })

  it("does not let desktop hover state block mobile idle hiding", () => {
    const wrapperSource = readFileSync(
      join(process.cwd(), "components/layout/NavbarWrapper.tsx"),
      "utf8",
    )

    expect(wrapperSource).toContain(
      "? ((!isScrollingDown && !isIdle) || isMenuOpen)",
    )
    expect(wrapperSource).toContain(
      ": (!isHome || isScrolled || isHoveringTop || isMenuOpen)",
    )
  })

  it("keeps mobile navbar scroll work throttled and passive", () => {
    const wrapperSource = readFileSync(
      join(process.cwd(), "components/layout/NavbarWrapper.tsx"),
      "utf8",
    )

    expect(wrapperSource).toContain("requestAnimationFrame")
    expect(wrapperSource).toContain("cancelAnimationFrame")
    expect(wrapperSource).toContain('{ passive: true }')
  })

  it("keeps the homepage navbar visible while mobile settings are open", async () => {
    const events: boolean[] = []
    const handleOpenChange = (event: Event) => {
      events.push(event instanceof CustomEvent && event.detail === true)
    }
    window.addEventListener("navbar-menu:open-change", handleOpenChange)

    try {
      const user = userEvent.setup()
      render(<MobileSettings />)

      await user.click(
        screen.getByRole("button", { name: "Cài đặt giao diện" }),
      )

      expect(events).toContain(true)
    } finally {
      window.removeEventListener("navbar-menu:open-change", handleOpenChange)
    }
  })

  it("keeps mobile settings controlled and open during internal interactions", () => {
    const settingsSource = readFileSync(
      join(process.cwd(), "components/layout/MobileSettings.tsx"),
      "utf8",
    )

    expect(settingsSource).toContain("open={open}")
    expect(settingsSource).not.toContain("preserveOpenRef")
  })

  it("keeps mobile settings open across repeated theme toggles", async () => {
    let activeTheme = "light"
    themeMocks.setTheme.mockImplementation((nextTheme: string) => {
      activeTheme = nextTheme
      themeMocks.theme = activeTheme
    })
    const startTransitionSpy = vi.fn((cb: () => void) => {
      cb()
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
      }
    })
    document.startViewTransition =
      startTransitionSpy as unknown as typeof document.startViewTransition
    document.documentElement.animate = vi.fn()

    const user = userEvent.setup()
    const { rerender } = render(<MobileSettings />)

    const settings = screen.getByRole("button", {
      name: "Cài đặt giao diện",
    })
    await user.click(settings)

    for (let index = 0; index < 4; index += 1) {
      await user.click(
        await screen.findByRole("button", { name: /Switch to .* mode/ }),
      )
      rerender(<MobileSettings />)
      expect(settings).toHaveAttribute("aria-expanded", "true")
    }

    expect(startTransitionSpy).toHaveBeenCalledTimes(4)
  })

  it("does not recreate the mobile idle timer on every scroll frame", () => {
    const wrapperSource = readFileSync(
      join(process.cwd(), "components/layout/NavbarWrapper.tsx"),
      "utf8",
    )

    expect(wrapperSource).toContain("idleDeadlineRef")
    expect(wrapperSource).toContain("scheduleIdleCheck")
    expect(wrapperSource).not.toContain("resetIdle()")
  })

  it("keeps the mobile navbar visible briefly after settings close", () => {
    vi.useFakeTimers()
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    })
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 100,
    })

    const { container } = render(
      <NavbarWrapper>
        <div>Navigation</div>
      </NavbarWrapper>,
    )

    act(() => {
      vi.runOnlyPendingTimers()
      window.dispatchEvent(
        new CustomEvent("navbar-menu:open-change", { detail: true }),
      )
      window.dispatchEvent(
        new CustomEvent("navbar-menu:open-change", { detail: false }),
      )
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        value: 200,
      })
      window.dispatchEvent(new Event("scroll"))
      vi.advanceTimersByTime(16)
    })

    expect(container.firstElementChild).toHaveClass("translate-y-0")

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(container.firstElementChild).toHaveClass("-translate-y-full")
  })

  it("allows protected account menu destinations to prefetch", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ data: { counts: {} } })))

    try {
      render(
        <WriterMenu
          user={{
            avatarUrl: null,
            name: "Mina Writer",
            role: "ADMIN",
            username: "mina",
          }}
        />,
      )

      const user = userEvent.setup()
      await user.click(screen.getByRole("button", { name: "Mở menu tác giả" }))

      for (const name of [
        "Bài viết của tôi",
        "Sự kiện viết",
        "Thông báo",
        "Quản trị",
        "Sửa hồ sơ",
      ]) {
        expect(screen.getByRole("menuitem", { name })).toHaveAttribute(
          "data-prefetch",
          "undefined",
        )
      }
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("loads the writer session after a short delay without requiring a readable cookie", async () => {
    vi.useFakeTimers()
    Object.defineProperty(document, "cookie", {
      configurable: true,
      value: "",
      writable: true,
    })
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            user: {
              avatarUrl: null,
              name: "Mina Writer",
              username: "mina",
            },
          }),
        ),
      )

    try {
      render(<Navbar />)

      expect(fetchMock).not.toHaveBeenCalled()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })

      expect(
        screen.getByRole("button", { name: "Mở menu tác giả" }),
      ).toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      })
      expect(
        fetchMock.mock.calls.filter((call) => call[0] === "/api/auth/session"),
      ).toHaveLength(1)
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("does not render a writer menu when the deferred session is anonymous", async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ user: null })))

    try {
      render(<Navbar />)

      expect(fetchMock).not.toHaveBeenCalled()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(
        screen.queryByRole("button", { name: "Mở menu tác giả" }),
      ).not.toBeInTheDocument()
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("reuses the deferred writer session after navigation", async () => {
    vi.useFakeTimers()
    themeMocks.pathname = "/"
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ user: null })))

    try {
      const { rerender } = render(<Navbar />)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(
        screen.queryByRole("button", { name: "Mở menu tác giả" }),
      ).not.toBeInTheDocument()

      themeMocks.pathname = "/dashboard"
      rerender(<Navbar />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })

      expect(
        screen.queryByRole("button", { name: "Mở menu tác giả" }),
      ).not.toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("aligns navigation content with page containers", () => {
    const { container } = render(<Navbar user={null} />)

    expect(container.querySelector("header > div")).toHaveClass(
      "mx-auto",
      "max-w-[1440px]",
      "pl-6",
      "pr-3",
      "glass-navbar",
    )
    expect(container.querySelector("header")).toHaveClass(
      "bg-transparent",
      "px-4",
      "py-2",
      "md:px-0",
      "md:py-4",
    )
  })
})

describe("PageContainer", () => {
  it("applies the shared public page width and vertical rhythm", () => {
    const { container } = render(<PageContainer>Content</PageContainer>)

    expect(container.firstElementChild).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-5xl",
      "xl:max-w-6xl",
      "py-8",
      "md:py-12",
    )
  })

  it("supports narrow article and wide listing layouts", () => {
    const { container, rerender } = render(
      <PageContainer as="article" size="narrow">
        Article
      </PageContainer>,
    )

    expect(container.firstElementChild?.tagName).toBe("ARTICLE")
    expect(container.firstElementChild).toHaveClass(
      "max-w-[720px]",
    )

    rerender(<PageContainer size="wide">Listing</PageContainer>)

    expect(container.firstElementChild).toHaveClass(
      "max-w-[1440px]",
    )
  })
})

describe("WriterMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("opens writer links and signs out", async () => {
    const user = userEvent.setup()

    render(
      <WriterMenu
        user={{ avatarUrl: null, name: "Mina Writer", username: "mina" }}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Mở menu tác giả" }))

    expect(screen.getByRole("menuitem", { name: "Bài viết của tôi" })).toHaveAttribute(
      "href",
      "/dashboard",
    )
    expect(screen.getByRole("menuitem", { name: "Bài viết của tôi" })).toHaveAttribute(
      "data-prefetch",
      "undefined",
    )
    expect(
      screen.getByRole("menuitem", { name: "Sửa hồ sơ" }),
    ).toHaveAttribute("href", "/dashboard/profile")
    expect(
      screen.getByRole("menuitem", { name: "Sửa hồ sơ" }),
    ).toHaveAttribute("data-prefetch", "undefined")
    expect(
      screen.getByRole("menuitem", { name: "Hồ sơ công khai" }),
    ).toHaveAttribute("href", "/authors/mina")
    expect(
      screen.getByRole("menuitem", { name: "Hồ sơ công khai" }),
    ).toHaveAttribute("data-prefetch", "undefined")

    await user.click(screen.getByRole("menuitem", { name: "Đăng xuất" }))

    expect(themeMocks.signOut).toHaveBeenCalledWith({ callbackUrl: "/" })
  })

  it("shows an admin panel link for admin users", async () => {
    const user = userEvent.setup()

    render(
      <WriterMenu
        user={{
          avatarUrl: null,
          name: "Mina Admin",
          role: "ADMIN",
          username: "mina",
        }}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Mở menu tác giả" }))

    expect(screen.getByRole("menuitem", { name: "Quản trị" })).toHaveAttribute(
      "href",
      "/admin",
    )
    expect(screen.getByRole("menuitem", { name: "Quản trị" })).toHaveAttribute(
      "data-prefetch",
      "undefined",
    )
  })
})

describe("Sidebar", () => {
  it("uses the Figma fixed-width sidebar without sticky positioning", () => {
    const { container } = render(
      <Sidebar
        categories={[
          {
            _count: { posts: 3 },
            id: "category-1",
            name: "Analysis",
            slug: "analysis",
          },
        ]}
        recentPosts={[
          {
            publishedAt: new Date("2024-04-01T00:00:00Z"),
            slug: "recent-post",
            title: "Recent Post",
          },
        ]}
      />,
    )

    const sidebar = container.querySelector("aside")
    expect(sidebar).toHaveClass("lg:w-[240px]", "gap-6")
    expect(sidebar).not.toHaveClass("lg:sticky")
    expect(screen.getByRole("heading", { name: "Danh mục" })).toHaveClass(
      "text-[13px]",
      "text-accent",
    )
  })
})

describe("MobileNav", () => {
  it("opens a drawer containing navigation links and community link", async () => {
    const user = userEvent.setup()
    render(
      <MobileNav
        links={[
          { href: "/contributors", label: "Contributors" },
          { href: "/about", label: "About" },
        ]}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Mở menu điều hướng" }),
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      screen.getByText("Duyệt các trang ấn phẩm và tìm kiếm bài viết."),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Contributors" })).toHaveAttribute(
      "href",
      "/contributors",
    )
    expect(screen.getByRole("link", { name: "Tham gia Discord" })).toHaveAttribute(
      "href",
      "https://discord.gg/wgCr86Cdb",
    )
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "h-8",
      "w-8",
    )
  })

  it("shows writer links in the mobile drawer for signed-in writers", async () => {
    const user = userEvent.setup()
    render(
      <MobileNav
        links={[
          { href: "/contributors", label: "Contributors" },
          { href: "/about", label: "About" },
        ]}
        user={{ avatarUrl: null, name: "Mina Writer", username: "mina" }}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Mở menu điều hướng" }),
    )

    expect(screen.getByRole("link", { name: "Bài viết của tôi" })).toHaveAttribute(
      "href",
      "/dashboard",
    )
    expect(screen.getByRole("link", { name: "Bài viết của tôi" })).toHaveAttribute(
      "data-prefetch",
      "false",
    )
    expect(screen.getByRole("link", { name: "Sửa hồ sơ" })).toHaveAttribute(
      "href",
      "/dashboard/profile",
    )
    expect(screen.getByRole("link", { name: "Sửa hồ sơ" })).toHaveAttribute(
      "data-prefetch",
      "false",
    )

    await user.click(screen.getByRole("button", { name: "Đăng xuất" }))

    expect(themeMocks.signOut).toHaveBeenCalledWith({ callbackUrl: "/" })
  })

  it("shows admin links in the mobile drawer for signed-in admins", async () => {
    const user = userEvent.setup()
    render(
      <MobileNav
        links={[
          { href: "/contributors", label: "Contributors" },
          { href: "/about", label: "About" },
        ]}
        user={{
          avatarUrl: null,
          name: "Mina Admin",
          role: "ADMIN",
          username: "mina",
        }}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Mở menu điều hướng" }),
    )

    expect(screen.getByRole("link", { name: "Quản trị" })).toHaveAttribute(
      "href",
      "/admin",
    )
    expect(screen.getByRole("link", { name: "Quản trị" })).toHaveAttribute(
      "data-prefetch",
      "false",
    )
  })
})

describe("Sidebar", () => {
  it("renders newsletter content, categories, and recent posts", () => {
    render(
      <Sidebar
        archives={[
          {
            count: 2,
            month: "2026-06",
          },
        ]}
        categories={[
          {
            _count: { posts: 2 },
            id: "category-1",
            name: "Production",
            slug: "production",
          },
          {
            _count: { posts: 0 },
            id: "category-empty",
            name: "Empty category",
            slug: "empty-category",
          },
        ]}
        newsletter={<form aria-label="Newsletter signup" />}
        recentPosts={[
          {
            publishedAt: new Date("2024-04-01T00:00:00Z"),
            slug: "frieren",
            title: "Frieren and the passage of time",
          },
        ]}
      />,
    )

    expect(screen.getByRole("form", { name: "Newsletter signup" })).toBeVisible()
    expect(screen.getByRole("link", { name: /Production/ })).toHaveAttribute(
      "href",
      "/category/production",
    )
    expect(screen.queryByText("Empty category")).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Frieren and the passage of time" }),
    ).toHaveAttribute("href", "/frieren")
    expect(screen.getByRole("link", { name: /tháng 6 năm 2026/ })).toHaveAttribute(
      "href",
      "/archive/2026-06",
    )
  })

  it("uses zoom-friendly responsive sidebar widths", () => {
    const { container } = render(
      <Sidebar categories={[]} recentPosts={[]} />,
    )

    expect(container.firstElementChild).toHaveClass(
      "lg:w-[240px]",
    )
  })
})

describe("Footer", () => {
  it("renders publication links", () => {
    render(<Footer />)

    expect(screen.getByRole("link", { name: "Giới thiệu" })).toHaveAttribute(
      "href",
      "/about",
    )
    expect(screen.getByRole("link", { name: "Đóng góp" })).toHaveAttribute(
      "href",
      "/contributors",
    )
    expect(screen.getByRole("link", { name: "Nhập môn Sakuga" })).toHaveAttribute(
      "href",
      "/nhap-mon-sakuga",
    )
  })
})
