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
    onChange,
  }: {
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
        Mock editor
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
    expect(screen.getByRole("link", { name: /Mina/ })).toHaveAttribute(
      "href",
      "/authors/mina",
    )
    expect(screen.getByRole("link", { name: /Mina/ })).toHaveAttribute(
      "data-prefetch",
      "undefined",
    )
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

  it("uses mobile-first title sizing and hides excerpts below small screens", () => {
    render(<PostCard post={post} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "Frieren Animation" }),
    ).toHaveClass("text-[20px]")
    expect(screen.getByText("A compact summary of the article.")).toHaveClass(
      "hidden",
      "md:block",
      "line-clamp-3",
    )
  })

  it("reveals post cards once with an explicit transition", () => {
    const source = readFileSync(
      join(process.cwd(), "components/posts/PostCard.tsx"),
      "utf8",
    )

    expect(source).toContain('viewport={{ once: true, margin: "-50px" }}')
    expect(source).toContain('transition={{ duration: 0.5, ease: "easeOut" }}')
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
  beforeEach(() => {
    class MockIntersectionObserver {
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
})

describe("CoverImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { url: "https://cdn.example.com/covers/cover.jpg" },
          }),
          { status: 201 },
        ),
      ),
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
    const formData = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]
      ?.body as FormData
    expect(formData.get("folder")).toBe("covers")
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
            children: [],
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
            children: [],
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
      "left-4",
      "top-1/2",
      "z-[100]",
      "flex-col",
    )
    expect(screen.getByRole("link", { name: /Bảng điều khiển/ })).toHaveAttribute(
      "href",
      "/dashboard",
    )
    expect(screen.getByTestId("editor-writing-surface")).toHaveClass(
      "rounded-[8px]",
      "sm:border",
    )
    expect(screen.getByLabelText("Danh mục")).toBeVisible()
    expect(screen.getByLabelText("Thêm đồng tác giả")).toBeVisible()
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

  it("renders homepage sorting tabs correctly and passes sort parameter to query", async () => {
    const elementLatest = await HomePostList({ page: 1, sort: "latest" })
    const { unmount } = render(elementLatest)

    expect(screen.getByRole("tab", { name: "Mới nhất" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: "Cũ nhất" })).toHaveAttribute("aria-selected", "false")
    expect(screen.getByRole("tab", { name: "Nhiều bình luận" })).toHaveAttribute("aria-selected", "false")
    
    expect(queriesMocks.getCachedPublishedPosts).toHaveBeenCalledWith(
      1,
      10,
      "latest",
      undefined,
    )

    unmount()

    const elementComments = await HomePostList({ page: 2, sort: "comments" })
    render(elementComments)

    expect(screen.getByRole("tab", { name: "Mới nhất" })).toHaveAttribute("aria-selected", "false")
    expect(screen.getByRole("tab", { name: "Nhiều bình luận" })).toHaveAttribute("aria-selected", "true")
    
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
      screen.getByRole("heading", { name: "Bài viết June 2026" }),
    ).toBeVisible()
    expect(screen.getByRole("tab", { name: "Mới nhất" })).toHaveAttribute(
      "href",
      "/?archive=2026-06",
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
