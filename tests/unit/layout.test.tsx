import { act, render, screen } from "@testing-library/react"
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
  clearSessionUserCache()
})

import { Footer } from "@/components/layout/Footer"
import { MobileNav } from "@/components/layout/MobileNav"
import { Navbar } from "@/components/layout/Navbar"
import { PageContainer } from "@/components/layout/PageContainer"
import { Sidebar } from "@/components/layout/Sidebar"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { WriterMenu } from "@/components/layout/WriterMenu"
import { clearSessionUserCache } from "@/lib/clientSession"

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    themeMocks.theme = "light"
  })

  it("switches from light to dark mode", async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(
      await screen.findByRole("button", { name: "Switch to dark mode" }),
    )

    expect(themeMocks.setTheme).toHaveBeenCalledWith("dark")
  })

  it("uses view transitions when supported by browser", async () => {
    const startTransitionSpy = vi.fn((cb) => {
      cb()
      return {
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
})

describe("Navbar", () => {
  it("renders publication navigation and search access", () => {
    render(<Navbar user={null} />)

    const contributors = screen.getByRole("link", { name: "Đóng góp" })
    expect(contributors).toHaveAttribute("href", "/contributors")
    expect(contributors).toHaveAttribute("data-prefetch", "undefined")
    expect(screen.getByRole("link", { name: "Giới thiệu" })).toHaveAttribute(
      "href",
      "/about",
    )
    expect(
      screen.getByRole("button", { name: /Tìm kiếm/i }),
    ).toBeInTheDocument()
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
    )
    expect(container.querySelector("header")).toHaveClass(
      "border-border",
      "bg-background/80",
      "backdrop-blur-md",
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
      "false",
    )
    expect(
      screen.getByRole("menuitem", { name: "Sửa hồ sơ" }),
    ).toHaveAttribute("href", "/dashboard/profile")
    expect(
      screen.getByRole("menuitem", { name: "Sửa hồ sơ" }),
    ).toHaveAttribute("data-prefetch", "false")
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
      "false",
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
            children: [{ id: "child-1", name: "Animation", slug: "animation" }],
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
    expect(sidebar).toHaveClass("lg:w-[240px]", "gap-12")
    expect(sidebar).not.toHaveClass("lg:sticky")
    expect(screen.getByRole("heading", { name: "Danh mục" })).toHaveClass(
      "text-[13px]",
      "text-accent",
    )
  })
})

describe("MobileNav", () => {
  it("opens a drawer containing navigation links and inline search", async () => {
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
    expect(screen.getByRole("searchbox", { name: "Tìm kiếm bài viết" })).toHaveAttribute(
      "placeholder",
      "Tìm kiếm bài viết...",
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
            children: [
              { id: "child-1", name: "Animation", slug: "animation" },
            ],
            id: "category-1",
            name: "Production",
            slug: "production",
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
    expect(
      screen.getByRole("link", { name: "Frieren and the passage of time" }),
    ).toHaveAttribute("href", "/frieren")
    expect(screen.getByRole("link", { name: /June 2026/ })).toHaveAttribute(
      "href",
      "/?archive=2026-06",
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
  })
})
