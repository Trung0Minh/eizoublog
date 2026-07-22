import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes, ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}))

const queriesMocks = vi.hoisted(() => ({
  getCachedPublishedPosts: vi.fn(),
  getCachedSidebarData: vi.fn(),
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
  useRouter: () => routerMocks,
}))
vi.mock("@/lib/queries", () => ({
  getCachedPublishedPosts: queriesMocks.getCachedPublishedPosts,
  getCachedSidebarData: queriesMocks.getCachedSidebarData,
}))

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})
vi.mock("@/lib/seo", () => ({
  buildMetadata: vi.fn(),
  getAppUrl: vi.fn(() => "https://example.com"),
}))
vi.mock("@/components/editor/TiptapEditor", () => ({
  TiptapEditor: ({
    children,
    editable,
    ariaLabel,
    onChange,
  }: {
    ariaLabel?: string
    children?: ReactNode
    editable?: boolean
    onChange?: (json: Record<string, unknown>, text: string) => void
  }) => (
    <div>
      {children}
      <button
        data-editable={String(editable)}
        onClick={() => onChange?.({ content: [], type: "doc" }, "Plain body")}
        type="button"
      >
        {ariaLabel ? `Mock ${ariaLabel}` : "Mock editor"}
      </button>
    </div>
  ),
}))

import { CoverImageUpload } from "@/components/posts/CoverImageUpload"
import { Pagination } from "@/components/ui/Pagination"
import { PostBody } from "@/components/posts/PostBody"
import { PostCard } from "@/components/posts/PostCard"
import { PostEditor } from "@/components/posts/PostEditor"
import { PostHero } from "@/components/posts/PostHero"
import { TableOfContents } from "@/components/posts/TableOfContents"
import { TagInput, type TagOption } from "@/components/posts/TagInput"

const post = {
  id: "post-1",
  _count: { comments: 2 },
  author: {
    avatarUrl: null,
    name: "Mina",
    username: "mina",
  },
  coAuthors: [{ user: { avatarUrl: null, name: "Ken", username: "ken" } }],
  coverAlt: "Cover alt",
  coverUrl: "https://cdn.example.com/cover.jpg",
  excerpt: "A compact summary of the article.",
  publishedAt: new Date("2024-04-01T00:00:00Z"),
  slug: "frieren-animation",
  tags: [{ tag: { id: "tag-1", name: "Sakuga", slug: "sakuga" } }],
  title: "Frieren Animation",
  category: { id: "category-1", name: "Production", slug: "production" },
}

describe("PostCard", () => {
  it("renders post links, authors, category, tags, and comment count", () => {
    render(<PostCard post={post} />)

    expect(
      screen.getByRole("link", { name: "Frieren Animation" }),
    ).toHaveAttribute("href", "/frieren-animation")
    expect(
      screen.getByRole("link", { name: "Frieren Animation" }),
    ).toHaveAttribute("data-prefetch", "undefined")
    expect(screen.getByRole("img", { name: "Cover alt" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/cover.jpg",
    )
    expect(screen.getByRole("img", { name: "Cover alt" })).toHaveAttribute(
      "loading",
      "lazy",
    )
    expect(screen.getByRole("img", { name: "Cover alt" })).toHaveAttribute(
      "decoding",
      "async",
    )
    expect(screen.getByRole("link", { name: "Production" })).toHaveAttribute(
      "href",
      "/category/production",
    )
    expect(screen.getByRole("link", { name: "Production" })).toHaveAttribute(
      "data-prefetch",
      "undefined",
    )
    const minaLinks = screen.getAllByRole("link", { name: "Mina" })
    expect(minaLinks).toHaveLength(2)
    minaLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/authors/mina")
      expect(link).toHaveAttribute("data-prefetch", "undefined")
    })
    expect(screen.getByRole("link", { name: "Sakuga" })).toHaveAttribute(
      "href",
      "/tag/sakuga",
    )
    expect(screen.getByRole("link", { name: "Sakuga" })).toHaveAttribute(
      "data-prefetch",
      "undefined",
    )
    expect(screen.getByText("2 bình luận")).toBeVisible()
  })

  it("shows the complete excerpt with safe wrapping at every breakpoint", () => {
    render(<PostCard post={post} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "Frieren Animation" }),
    ).toHaveClass("text-[20px]")
    expect(screen.getByText("A compact summary of the article.")).not.toHaveClass(
      "hidden",
      "line-clamp-3",
    )
    expect(screen.getByText("A compact summary of the article.")).toHaveClass(
      "break-words",
    )
  })

  it("does not clamp compact list excerpts", () => {
    const source = readFileSync(
      join(process.cwd(), "components/posts/CompactPostList.tsx"),
      "utf8",
    )

    expect(source).not.toContain(
      "line-clamp-2 text-xs leading-relaxed text-text-secondary",
    )
  })

  it("keeps author credit bios compact", () => {
    const source = readFileSync(
      join(process.cwd(), "components/posts/AuthorBio.tsx"),
      "utf8",
    )

    expect(source).toContain("line-clamp-4")
    expect(source).toContain("getAuthorBioPreview")
  })

  it("reveals post cards once with an explicit transition", () => {
    const source = readFileSync(
      join(process.cwd(), "components/posts/PostCard.tsx"),
      "utf8",
    )

    expect(source).toContain('viewport={{ once: true, margin: "-50px" }}')
    expect(source).toContain('transition={{ duration: 0.5, ease: "easeOut" }}')
  })

  it("does not render fallback tags when a post has no tags", () => {
    render(<PostCard post={{ ...post, tags: [] }} />)

    expect(screen.queryByRole("link", { name: "Sakuga" })).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Animation Analysis" }),
    ).not.toBeInTheDocument()
  })

  it("does not render a fallback category when a post has no category", () => {
    render(<PostCard post={{ ...post, category: null }} />)

    expect(screen.queryByText("Animation Analysis")).not.toBeInTheDocument()
  })
})

describe("Post detail responsive components", () => {
  it("sizes the post detail title from mobile to desktop", () => {
    render(<PostHero post={post} />)

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Frieren\s*Animation/,
      }),
    ).toHaveClass("text-[28px]", "md:text-[44px]", "lg:text-[52px]")
    const cover = screen.getByRole("img", { name: "Cover alt" })
    expect(cover).toHaveAttribute("loading", "eager")
    expect(cover).toHaveAttribute("fetchpriority", "high")
    expect(cover).toHaveAttribute("decoding", "async")
  })

  it("uses a compact editorial hero when a post has no cover", () => {
    render(<PostHero post={{ ...post, coverAlt: null, coverUrl: null }} />)

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.queryByText("Bài viết chữ")).not.toBeInTheDocument()
    expect(screen.getByTestId("post-hero-no-cover")).not.toHaveClass(
      "min-h-[360px]",
      "bg-subtle-bg/35",
    )
    expect(screen.getByTestId("post-hero-content")).not.toHaveClass(
      "bg-gradient-to-t",
      "absolute",
    )
  })

  it("reserves the desktop table-of-contents lane in the hero when the article has headings", () => {
    render(<PostHero hasTableOfContents post={post} />)

    expect(screen.getByTestId("post-hero-main-column")).toHaveClass(
      "max-w-[1000px]",
    )
    expect(screen.getByTestId("post-hero-toc-spacer")).toHaveClass(
      "ml-10",
      "w-[200px]",
      "xl:block",
    )
  })

  it("centers the post body in a wider article lane", () => {
    const { container } = render(
      <PostBody content={{ content: [], type: "doc" }} />,
    )

    expect(container.querySelector(".post-content")).toHaveClass(
      "mx-auto",
      "w-full",
    )
  })
})

describe("Pagination", () => {
  it("renders previous and next links with the current page window", () => {
    render(<Pagination page={2} pageSize={10} total={35} />)

    const previous = screen.getByRole("link", { name: "Trang trước" })
    expect(previous).toHaveAttribute("href", "?page=1")
    expect(previous).toHaveClass("h-8", "w-auto")
    expect(screen.getByRole("link", { name: "Trang sau" })).toHaveAttribute(
      "href",
      "?page=3",
    )
    const pageFour = screen.getByRole("link", { name: "Page 4" })
    expect(pageFour).toHaveAttribute("href", "?page=4")
    expect(pageFour).toHaveClass("h-8", "w-8")
  })
})

describe("TableOfContents", () => {
  let intersectionCallback: IntersectionObserverCallback

  beforeEach(() => {
    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback
      }
      disconnect() {}
      observe() {}
      unobserve() {}
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)
  })

  it("extracts heading links from Tiptap JSON", () => {
    render(
      <TableOfContents
        content={{
          content: [
            {
              attrs: { level: 2 },
              content: [{ text: "Opening Cuts", type: "text" }],
              type: "heading",
            },
            {
              attrs: { level: 3 },
              content: [{ text: "Đạo diễn tập", type: "text" }],
              type: "heading",
            },
          ],
          type: "doc",
        }}
      />,
    )

    expect(screen.getByRole("link", { name: "Opening Cuts" })).toHaveAttribute(
      "href",
      "#opening-cuts",
    )
    expect(screen.getByRole("link", { name: "Đạo diễn tập" })).toHaveAttribute(
      "href",
      "#dao-dien-tap",
    )
  })

  it("wraps mobile contents in a collapsible card", () => {
    render(
      <TableOfContents
        collapsible
        content={{
          content: [
            {
              attrs: { level: 2 },
              content: [{ text: "Opening Cuts", type: "text" }],
              type: "heading",
            },
          ],
          type: "doc",
        }}
      />,
    )

    const button = screen.getByRole("button", { name: "Mục lục" })
    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("heading", { name: "Nội dung" })).not.toBeInTheDocument()

    fireEvent.click(button)

    expect(button).toHaveAttribute("aria-expanded", "true")
    expect(screen.queryByRole("heading", { name: "Nội dung" })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Opening Cuts" })).toBeVisible()
  })

  it("selects the topmost intersecting heading regardless of callback order", () => {
    render(
      <>
        <h2 id="first-heading">First heading target</h2>
        <h2 id="second-heading">Second heading target</h2>
        <TableOfContents
          content={{
            content: [
              {
                attrs: { level: 2 },
                content: [{ text: "First heading", type: "text" }],
                type: "heading",
              },
              {
                attrs: { level: 2 },
                content: [{ text: "Second heading", type: "text" }],
                type: "heading",
              },
            ],
            type: "doc",
          }}
        />
      </>,
    )

    const firstHeading = document.getElementById("first-heading")
    const secondHeading = document.getElementById("second-heading")

    expect(firstHeading).not.toBeNull()
    expect(secondHeading).not.toBeNull()

    act(() => {
      intersectionCallback(
        [
          {
            boundingClientRect: { top: 120 },
            isIntersecting: true,
            target: firstHeading!,
          },
          {
            boundingClientRect: { top: 260 },
            isIntersecting: true,
            target: secondHeading!,
          },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      )
    })

    expect(screen.getByRole("link", { name: "First heading" })).toHaveClass(
      "text-accent",
    )
  })
})

describe("CoverImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string | URL) => {
        if (url === "/api/upload") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: { url: "https://cdn.example.com/covers/cover.jpg" },
              }),
              { status: 201 },
            ),
          )
        }

        return Promise.resolve(new Response(null, { status: 200 }))
      }),
    )
  })

  it("uploads cover images to the covers folder", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CoverImageUpload onChange={onChange} value="" />)

    await user.upload(
      screen.getByLabelText("Tải lên ảnh bìa"),
      new File(["jpg"], "cover.jpg", { type: "image/jpeg" }),
    )

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        "https://cdn.example.com/covers/cover.jpg",
      )
    })
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/upload", {
      body: expect.any(FormData),
      method: "POST",
    })
    const form = vi.mocked(fetch).mock.calls[0]?.[1]?.body as FormData
    expect(form.get("folder")).toBe("covers")
    expect(form.get("file")).toBeInstanceOf(File)
  })

  it("advertises the 20 MB cover limit", () => {
    render(<CoverImageUpload onChange={vi.fn()} value="" />)

    expect(screen.getByText(/Tối đa 20MB/)).toBeVisible()
  })

  it("shows a readable error when the upload endpoint returns plain text", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Request Entity Too Large", { status: 413 }),
      ),
    )
    render(<CoverImageUpload onChange={vi.fn()} value="" />)

    await user.upload(
      screen.getByLabelText("Tải lên ảnh bìa"),
      new File(["large"], "cover.gif", { type: "image/gif" }),
    )

    expect(
      await screen.findByText("Tệp quá lớn. Vui lòng chọn ảnh dưới 20MB."),
    ).toBeVisible()
  })

  it("matches the Figma dashed upload target and hover-replace cover state", () => {
    const { rerender } = render(<CoverImageUpload onChange={vi.fn()} value="" />)

    expect(screen.getByText("Thêm ảnh bìa").closest("button")).toHaveClass(
      "aspect-video",
      "border-dashed",
      "bg-subtle-bg",
    )

    rerender(
      <CoverImageUpload
        onChange={vi.fn()}
        value="https://cdn.example.com/covers/cover.jpg"
      />,
    )

    expect(screen.getByRole("img", { name: "Ảnh bìa đã chọn" })).toHaveClass(
      "h-full",
      "w-full",
    )
    expect(screen.getByRole("button", { name: "Thay đổi ảnh bìa" })).toBeVisible()
  })

  it("can preview uploaded covers without forcing a crop aspect ratio", () => {
    const { container } = render(
      <CoverImageUpload
        onChange={vi.fn()}
        preserveAspectRatio
        value="https://cdn.example.com/covers/portrait.jpg"
      />,
    )

    const image = screen.getByRole("img", { name: "Ảnh bìa đã chọn" })

    expect(image).toHaveClass("h-auto", "w-full")
    expect(image).not.toHaveClass("h-full")
    expect(image.closest(".group")).not.toHaveClass("aspect-video")
    expect(container.querySelector('[aria-label="Cắt ảnh bìa"]')).toBeNull()
    expect(
      container.querySelector('[aria-label="Mở công cụ cắt ảnh"]'),
    ).toBeNull()
  })
})

describe("TagInput", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("searches and selects an existing tag", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [{ id: "tag-1", name: "Sakuga", slug: "sakuga" }],
          }),
          { status: 200 },
        ),
      ),
    )

    render(<TagInput onChange={onChange} selectedTags={[]} />)

    await user.type(screen.getByLabelText("Thẻ"), "saku")
    await user.click(await screen.findByRole("button", { name: "Sakuga" }))

    expect(onChange).toHaveBeenCalledWith([
      { id: "tag-1", name: "Sakuga", slug: "sakuga" },
    ])
  })

  it("uses an expanded tap area for removing selected tags", () => {
    render(
      <TagInput
        onChange={vi.fn()}
        selectedTags={[{ id: "tag-1", name: "Sakuga", slug: "sakuga" }]}
      />,
    )

    expect(screen.getByRole("button", { name: "Xóa thẻ Sakuga" })).toHaveClass(
      "-m-1.5",
      "p-1.5",
    )
  })

  it("creates a new tag when no exact match exists", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: [] }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              data: { id: "tag-2", name: "Layout", slug: "layout" },
            }),
            { status: 201 },
          ),
        ),
    )

    render(<TagInput onChange={onChange} selectedTags={[]} />)

    await user.type(screen.getByLabelText("Thẻ"), "Layout")
    await user.click(
      await screen.findByRole("button", { name: 'Tạo thẻ "Layout"' }),
    )

    expect(onChange).toHaveBeenCalledWith([
      { id: "tag-2", name: "Layout", slug: "layout" },
    ])
  })
})

describe("PostEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { id: "post-1", slug: "new-post", status: "PUBLISHED" },
          }),
          { status: 201 },
        ),
      ),
    )
  })

  it("posts editor content and redirects to the published slug", async () => {
    const user = userEvent.setup()
    const selectedTag: TagOption = {
      id: "tag-1",
      name: "Sakuga",
      slug: "sakuga",
    }

    render(
      <PostEditor
        categories={[
          {
            id: "category-1",
            name: "Production",
            slug: "production",
          },
        ]}
        currentUserId="writer-1"
        initialTags={[selectedTag]}
        writers={[{ id: "writer-2", name: "Ken", username: "ken" }]}
      />,
    )

    await user.type(screen.getByLabelText("Tiêu đề"), "New Post")
    await user.click(screen.getByRole("button", { name: "Mock editor" }))
    await user.click(screen.getByRole("button", { name: "Cài đặt bài viết" }))
    fireEvent.keyDown(screen.getByLabelText("Danh mục"), { key: "ArrowDown" })
    await user.click(screen.getByRole("option", { name: "Production" }))
    fireEvent.keyDown(screen.getByLabelText("Thêm đồng tác giả"), { key: "ArrowDown" })
    await user.click(screen.getByRole("option", { name: "Ken" }))
    await user.click(screen.getByRole("button", { name: "Xuất bản bài viết" }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/posts",
        expect.objectContaining({ method: "POST" }),
      )
    })
    const request = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as {
      body: string
    }
    expect(JSON.parse(request.body) as Record<string, unknown>).toMatchObject({
      categoryId: "category-1",
      coAuthorIds: ["writer-2"],
      content: { content: [], type: "doc" },
      contentText: "Plain body",
      status: "PUBLISHED",
      tagIds: ["tag-1"],
      title: "New Post",
    })
    expect(routerMocks.push).toHaveBeenCalledWith("/new-post")
  })

  it("uses a fullscreen writing shell with a left action rail and right settings", async () => {
    const user = userEvent.setup()
    render(
      <PostEditor
        categories={[
          {
            id: "category-1",
            name: "Production",
            slug: "production",
          },
        ]}
        currentUserId="writer-1"
        writers={[{ id: "writer-2", name: "Ken", username: "ken" }]}
      />,
    )

    expect(screen.getByTestId("post-editor-shell")).toHaveClass(
      "fixed",
      "inset-0",
      "h-dvh",
      "min-h-dvh",
      "z-50",
    )
    expect(screen.getByLabelText("Tiêu đề")).toHaveClass(
      "text-[32px]",
      "md:text-[40px]",
    )

    const saveDraftButton = screen.getByRole("button", { name: /Lưu nháp/ })
    const actionRail = screen.getByTestId("editor-action-rail")
    expect(actionRail).toHaveClass(
      "fixed",
      "bottom-3",
      "left-1/2",
      "z-[100]",
      "flex-row",
      "lg:left-4",
      "lg:top-1/2",
      "lg:flex-col",
    )
    expect(screen.getByRole("link", { name: /Bảng điều khiển/ })).toHaveAttribute(
      "href",
      "/dashboard",
    )
    expect(screen.getByTestId("editor-writing-surface")).toHaveClass(
      "rounded-[8px]",
      "border",
      "bg-background/45",
      "backdrop-blur-xl",
    )
    await user.click(screen.getByRole("button", { name: "Cài đặt bài viết" }))
    expect(screen.getByLabelText("Danh mục")).toBeInTheDocument()
    expect(screen.getByLabelText("Thêm đồng tác giả")).toBeInTheDocument()
    expect(screen.getByRole("complementary", { name: "Cài đặt bài viết" })).toHaveClass(
      "border-l",
      "right-0",
      "xl:w-[360px]",
    )
    fireEvent.keyDown(screen.getByLabelText("Thêm đồng tác giả"), { key: "ArrowDown" })
    await user.click(screen.getByRole("option", { name: "Ken" }))
    expect(screen.getByRole("button", { name: "Xóa Ken" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Ẩn cài đặt bài viết" })).toBeVisible()
    expect(saveDraftButton).toHaveClass("h-9")
    expect(screen.getByRole("button", { name: "Xuất bản bài viết" })).toHaveClass(
      "h-9",
    )
  })

  it("autosaves existing post content after the debounce delay", async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              id: "post-1",
              slug: "existing-post",
              status: "DRAFT",
              updatedAt: "2024-04-01T00:00:00.000Z",
            },
          }),
          { status: 200 },
        ),
      ),
    )

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        initialData={{
          categoryId: null,
          coAuthorIds: [],
          content: { content: [], type: "doc" },
          contentText: null,
          coverAlt: null,
          coverUrl: null,
          excerpt: "Initial excerpt",
          id: "post-1",
          status: "DRAFT",
          tags: [],
          title: "Existing post",
        }}
        writers={[]}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mock editor" }))
    expect(fetch).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(fetch).toHaveBeenCalledWith(
      "/api/posts/post-1",
      expect.objectContaining({ method: "PATCH" }),
    )
    const request = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as {
      body: string
    }
    expect(JSON.parse(request.body) as Record<string, unknown>).toMatchObject({
      content: { content: [], type: "doc" },
      contentText: "Plain body",
      excerpt: "Initial excerpt",
      title: "Existing post",
    })
    expect(JSON.parse(request.body) as Record<string, unknown>).not.toHaveProperty(
      "status",
    )

    vi.useRealTimers()
  })

  it("queues manual saves behind an in-flight autosave version", async () => {
    vi.useFakeTimers()
    let resolveAutosave: ((response: Response) => void) | undefined
    const autosaveResponse = new Promise<Response>((resolve) => {
      resolveAutosave = resolve
    })
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockReturnValueOnce(autosaveResponse)
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              data: {
                id: "post-1",
                slug: "existing-post",
                status: "DRAFT",
                version: 3,
              },
            }),
            { status: 200 },
          ),
        ),
    )

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        initialData={{
          categoryId: null,
          coAuthorIds: [],
          content: { content: [], type: "doc" },
          contentText: null,
          coverAlt: null,
          coverUrl: null,
          excerpt: "Initial excerpt",
          id: "post-1",
          status: "DRAFT",
          tags: [],
          title: "Existing post",
          version: 1,
        }}
        writers={[]}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mock editor" }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(fetch).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: "Lưu nháp" }))
    expect(fetch).toHaveBeenCalledTimes(1)
    await act(async () => {
      resolveAutosave?.(
        new Response(
          JSON.stringify({
            data: {
              id: "post-1",
              slug: "existing-post",
              status: "DRAFT",
              version: 2,
            },
          }),
          { status: 200 },
        ),
      )
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(fetch).toHaveBeenCalledTimes(2)
    const manualRequest = (fetch as ReturnType<typeof vi.fn>).mock.calls[1]?.[1] as {
      body: string
    }
    expect(JSON.parse(manualRequest.body) as Record<string, unknown>).toMatchObject({
      baseVersion: 2,
      saveKind: "MANUAL",
      status: "DRAFT",
    })

    vi.useRealTimers()
  })

  it("does not resend an over-limit legacy excerpt when autosaving other fields", async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              id: "post-legacy",
              slug: "legacy-post",
              status: "DRAFT",
              updatedAt: "2024-04-01T00:00:00.000Z",
              version: 2,
            },
          }),
          { status: 200 },
        ),
      ),
    )
    const legacyExcerpt = "Legacy event introduction ".repeat(30)

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        initialData={{
          categoryId: null,
          coAuthorIds: [],
          content: { content: [], type: "doc" },
          contentText: null,
          coverAlt: null,
          coverUrl: null,
          excerpt: legacyExcerpt,
          id: "post-legacy",
          status: "DRAFT",
          tags: [],
          title: "Legacy post",
          version: 1,
        }}
        writers={[]}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mock editor" }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    const request = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as {
      body: string
    }
    expect(JSON.parse(request.body) as Record<string, unknown>).not.toHaveProperty(
      "excerpt",
    )

    vi.useRealTimers()
  })

  it("periodically autosaves existing posts during continuous editing", async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              id: "post-1",
              slug: "existing-post",
              status: "DRAFT",
              updatedAt: "2024-04-01T00:00:00.000Z",
            },
          }),
          { status: 200 },
        ),
      ),
    )

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        initialData={{
          categoryId: null,
          coAuthorIds: [],
          content: { content: [], type: "doc" },
          contentText: null,
          coverAlt: null,
          coverUrl: null,
          excerpt: "Initial excerpt",
          id: "post-1",
          status: "DRAFT",
          tags: [],
          title: "Existing post",
        }}
        writers={[]}
      />,
    )

    for (let second = 0; second < 35; second += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Mock editor" }))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
    }

    expect(fetch).toHaveBeenCalledWith(
      "/api/posts/post-1",
      expect.objectContaining({ method: "PATCH" }),
    )

    vi.useRealTimers()
  })

  it("does not autosave new posts before the first manual save", async () => {
    vi.useFakeTimers()

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        writers={[{ id: "writer-2", name: "Ken", username: "ken" }]}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mock editor" }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(35_000)
    })

    expect(fetch).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("shares drafts with co-authors automatically without a visibility toggle", async () => {
    const user = userEvent.setup()

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        writers={[{ id: "writer-2", name: "Ken", username: "ken" }]}
      />,
    )

    await user.type(screen.getByLabelText("Tiêu đề"), "Shared Draft")
    await user.click(screen.getByRole("button", { name: "Cài đặt bài viết" }))
    fireEvent.keyDown(screen.getByLabelText("Thêm đồng tác giả"), { key: "ArrowDown" })
    await user.click(screen.getByRole("option", { name: "Ken" }))

    expect(screen.queryByText("Quyền truy cập bản nháp")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Hiển thị với đồng tác giả" }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Lưu nháp" }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/posts",
        expect.objectContaining({ method: "POST" }),
      )
    })
    const request = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as {
      body: string
    }
    expect(JSON.parse(request.body) as Record<string, unknown>).toMatchObject({
      coAuthorIds: ["writer-2"],
      draftVisibility: "CO_AUTHORS",
      status: "DRAFT",
    })
  })

  it("shows an error and prevents publishing if contentText is empty", async () => {
    const user = userEvent.setup()

    render(
      <PostEditor
        categories={[]}
        currentUserId="writer-1"
        writers={[]}
      />,
    )

    await user.type(screen.getByLabelText("Tiêu đề"), "Test Post")
    await user.click(screen.getByRole("button", { name: "Xuất bản bài viết" }))

    await screen.findByText("Nội dung bài viết không được để trống khi đăng.")
    expect(fetch).not.toHaveBeenCalled()
  })
})

import { HomePostList } from "@/app/(public)/HomePostList"

describe("HomePage sorting UI", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queriesMocks.getCachedSidebarData.mockResolvedValue({
      archives: [],
      categories: [],
      recentPosts: [],
    })
    queriesMocks.getCachedPublishedPosts.mockResolvedValue({
      posts: [],
      total: 0,
    })
  })

  it("renders the homepage sorting dropdown and navigates to the selected sort", async () => {
    const elementLatest = await HomePostList({ page: 1, sort: "latest" })
    const { unmount } = render(elementLatest)

    expect(screen.getByRole("combobox", { name: "Sắp xếp bài viết" })).toHaveValue(
      "latest",
    )
    expect(screen.getByRole("option", { name: "Cũ nhất" })).toBeVisible()
    expect(screen.getByRole("option", { name: "Nhiều bình luận" })).toBeVisible()

    fireEvent.change(screen.getByRole("combobox", { name: "Sắp xếp bài viết" }), {
      target: { value: "comments" },
    })
    expect(routerMocks.push).toHaveBeenCalledWith("/?sort=comments", {
      scroll: false,
    })
    
    expect(queriesMocks.getCachedPublishedPosts).toHaveBeenCalledWith(
      1,
      10,
      "latest",
      undefined,
    )

    unmount()

    const elementComments = await HomePostList({ page: 2, sort: "comments" })
    render(elementComments)

    expect(screen.getByRole("combobox", { name: "Sắp xếp bài viết" })).toHaveValue(
      "comments",
    )
    
    expect(queriesMocks.getCachedPublishedPosts).toHaveBeenCalledWith(
      2,
      10,
      "comments",
      undefined,
    )
  })

  it("passes archive month through homepage sorting and pagination", async () => {
    queriesMocks.getCachedPublishedPosts.mockResolvedValue({
      posts: Array.from({ length: 10 }, (_, index) => ({
        ...post,
        slug: `post-${index}`,
      })),
      total: 11,
    })

    const element = await HomePostList({
      archiveMonth: "2026-06",
      page: 1,
      sort: "oldest",
    })
    render(element)

    expect(
      screen.getByRole("heading", { name: "Bài viết 06/2026" }),
    ).toBeVisible()
    expect(screen.getByRole("combobox", { name: "Sắp xếp bài viết" })).toHaveValue(
      "oldest",
    )
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute(
      "href",
      "?archive=2026-06&sort=oldest&page=2",
    )
    expect(queriesMocks.getCachedPublishedPosts).toHaveBeenCalledWith(
      1,
      10,
      "oldest",
      "2026-06",
    )
  })
})
