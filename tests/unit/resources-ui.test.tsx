import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))

import { ResourcesClient } from "@/app/(public)/resources/ResourcesClient"

describe("ResourcesClient", () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "resources" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
    vi.stubGlobal("fetch", mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("reorders resources by dragging before saving", async () => {
    const user = userEvent.setup()
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => undefined)
    const dataTransfer = {
      effectAllowed: "",
    }

    render(
      <ResourcesClient
        appName="Anime Blog"
        initialPage={{
          content: {
            description: "Useful links",
            resources: [
              { description: "First", domain: "First", logo: "", url: "https://first.test" },
              { description: "Second", domain: "Second", logo: "", url: "https://second.test" },
              { description: "Third", domain: "Third", logo: "", url: "https://third.test" },
            ],
            title: "Nguồn tham khảo",
          },
        }}
        isAdmin
      />,
    )

    await user.click(screen.getByRole("button", { name: "Chỉnh sửa trang" }))
    expect(screen.queryByRole("button", { name: /Di chuyển/ })).not.toBeInTheDocument()

    fireEvent.dragStart(screen.getByRole("button", { name: "Kéo Second để sắp xếp" }), {
      dataTransfer,
    })
    const dragOverEvent = new Event("dragover", { bubbles: true, cancelable: true })
    Object.defineProperty(dragOverEvent, "clientY", {
      value: window.innerHeight - 8,
    })
    Object.defineProperty(dragOverEvent, "dataTransfer", {
      value: dataTransfer,
    })
    fireEvent(screen.getByTestId("resource-editor-card-First"), dragOverEvent)
    expect(scrollBy).toHaveBeenCalledWith({ top: 18 })
    fireEvent.drop(screen.getByTestId("resource-editor-card-First"), {
      dataTransfer,
    })
    fireEvent.dragStart(screen.getByRole("button", { name: "Kéo First để sắp xếp" }), {
      dataTransfer,
    })
    fireEvent.drop(screen.getByTestId("resource-editor-card-Third"), {
      dataTransfer,
    })
    const saveBtn = screen.getByRole("button", { name: "Lưu trang" })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]
      expect(lastCall[0]).toBe("/api/admin/site-pages/resources")
      const options = lastCall[1]
      expect(options.method).toBe("PATCH")
      const parsedBody = JSON.parse(options.body)
      expect(parsedBody.content).toEqual({
        title: "Nguồn tham khảo",
        description: "Useful links",
        resources: [
          { description: "Second", domain: "Second", logo: "", url: "https://second.test" },
          { description: "Third", domain: "Third", logo: "", url: "https://third.test" },
          { description: "First", domain: "First", logo: "", url: "https://first.test" },
        ],
      })
    })
    scrollBy.mockRestore()
  })

  it("adds new default sources to saved default-like resources", () => {
    render(
      <ResourcesClient
        appName="Anime Blog"
        initialPage={{
          content: {
            description: "Useful links",
            resources: [
              {
                category: "Blog",
                description: "Sakuga source",
                domain: "Sakugabooru Blog",
                logo: "/logos/sakuga-blog.png",
                url: "https://blog.sakugabooru.com/",
              },
            ],
            title: "Nguồn tham khảo",
          },
        }}
        isAdmin={false}
      />,
    )

    expect(screen.getByRole("link", { name: /Washi's Blog/i })).toHaveAttribute(
      "href",
      "https://washiblog.wordpress.com/",
    )
    expect(screen.getByRole("link", { name: /Animétudes/i })).toHaveAttribute(
      "href",
      "https://animetudes.com/",
    )
    expect(screen.getByRole("link", { name: /Sakuga Wiki/i })).toHaveAttribute(
      "href",
      "https://sakuga.fandom.com/wiki/Sakuga_Wiki",
    )
    expect(screen.getByRole("link", { name: /Ghibli Blog/i })).toHaveAttribute(
      "href",
      "https://ghiblicon.blogspot.com/",
    )
    expect(screen.getByRole("link", { name: /Settei Dreams/i })).toHaveAttribute(
      "href",
      "https://setteidreams.net/",
    )
    expect(screen.getByRole("link", { name: /Archipel/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/@ArchipelDocumentaries",
    )
    expect(
      screen.getByRole("link", { name: /NHK World Anime Manga Explosion/i }),
    ).toHaveAttribute(
      "href",
      "https://www3.nhk.or.jp/nhkworld/en/shows/anime_manga/",
    )
  })

  it("adds a new source with a new category from the editor panel", async () => {
    const user = userEvent.setup()

    render(
      <ResourcesClient
        appName="Anime Blog"
        initialPage={{
          content: {
            description: "Useful links",
            resources: [
              {
                category: "Blog",
                description: "First",
                domain: "First",
                logo: "",
                url: "https://first.test",
              },
            ],
            title: "Nguồn tham khảo",
          },
        }}
        isAdmin
      />,
    )

    await user.click(screen.getByRole("button", { name: "Chỉnh sửa trang" }))
    await user.click(screen.getByRole("button", { name: "Nguồn mới" }))
    await user.clear(screen.getByLabelText("URL"))
    await user.type(screen.getByLabelText("URL"), "https://podcast.test")
    await user.clear(screen.getByLabelText("Tên nguồn"))
    await user.type(screen.getByLabelText("Tên nguồn"), "Anime Podcast")
    await user.click(screen.getByRole("button", { name: "Chọn phân loại" }))
    await user.type(screen.getByLabelText("Tạo phân loại từ menu"), "Podcast")
    await user.click(screen.getByRole("button", { name: "Tạo phân loại" }))
    await user.type(screen.getByLabelText("Mô tả"), "Nguồn audio mới")
    await user.click(screen.getByRole("button", { name: "Thêm vào danh sách" }))
    await user.click(screen.getByRole("button", { name: "Lưu trang" }))

    await waitFor(() => {
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]
      const parsedBody = JSON.parse(lastCall[1].body)
      expect(parsedBody.content.resources).toContainEqual({
        category: "Podcast",
        description: "Nguồn audio mới",
        domain: "Anime Podcast",
        logo: "",
        url: "https://podcast.test",
      })
    })
  })

  it("filters the editor list by category chips", async () => {
    const user = userEvent.setup()

    render(
      <ResourcesClient
        appName="Anime Blog"
        initialPage={{
          content: {
            description: "Useful links",
            resources: [
              {
                category: "Blog",
                description: "Blog source",
                domain: "Blog Source",
                logo: "",
                url: "https://blog-source.test",
              },
              {
                category: "Database",
                description: "Database source",
                domain: "Database Source",
                logo: "",
                url: "https://database-source.test",
              },
            ],
            title: "Nguồn tham khảo",
          },
        }}
        isAdmin
      />,
    )

    await user.click(screen.getByRole("button", { name: "Chỉnh sửa trang" }))
    await user.click(screen.getByRole("button", { name: "Database1" }))

    expect(screen.getByTestId("resource-editor-card-Database Source")).toBeVisible()
    expect(screen.queryByTestId("resource-editor-card-Blog Source")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Tất cả2" }))

    expect(screen.getByTestId("resource-editor-card-Database Source")).toBeVisible()
    expect(screen.getByTestId("resource-editor-card-Blog Source")).toBeVisible()
  })

  it("moves resources within the visible filtered category before saving", async () => {
    const user = userEvent.setup()

    render(
      <ResourcesClient
        appName="Anime Blog"
        initialPage={{
          content: {
            description: "Useful links",
            resources: [
              {
                category: "Blog",
                description: "First blog",
                domain: "First Blog",
                logo: "",
                url: "https://first-blog.test",
              },
              {
                category: "Database",
                description: "Database",
                domain: "Database",
                logo: "",
                url: "https://database.test",
              },
              {
                category: "Blog",
                description: "Second blog",
                domain: "Second Blog",
                logo: "",
                url: "https://second-blog.test",
              },
            ],
            title: "Nguồn tham khảo",
          },
        }}
        isAdmin
      />,
    )

    await user.click(screen.getByRole("button", { name: "Chỉnh sửa trang" }))
    await user.click(screen.getByRole("button", { name: "Blog2" }))
    await user.click(screen.getByRole("button", { name: "Đưa First Blog xuống" }))
    await user.click(screen.getByRole("button", { name: "Lưu trang" }))

    await waitFor(() => {
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]
      const parsedBody = JSON.parse(lastCall[1].body)
      expect(parsedBody.content.resources).toEqual([
        {
          category: "Database",
          description: "Database",
          domain: "Database",
          logo: "",
          url: "https://database.test",
        },
        {
          category: "Blog",
          description: "Second blog",
          domain: "Second Blog",
          logo: "",
          url: "https://second-blog.test",
        },
        {
          category: "Blog",
          description: "First blog",
          domain: "First Blog",
          logo: "",
          url: "https://first-blog.test",
        },
      ])
    })
  })

  it("uses PNG replacements for legacy duplicated logos and keeps Bluesky SVG", () => {
    render(
      <ResourcesClient
        appName="Anime Blog"
        initialPage={{
          content: {
            description: "Useful links",
            resources: [
              {
                description: "Blog",
                domain: "Sakugabooru Blog",
                logo: "/logos/sakuga-blog.svg",
                url: "https://blog.sakugabooru.com/",
              },
              {
                description: "Database",
                domain: "Settei Dreams",
                logo: "/logos/settei-dreams.svg",
                url: "https://setteidreams.net/",
              },
              {
                description: "Documentaries",
                domain: "Archipel",
                logo: "/logos/archipel.svg",
                url: "https://www.youtube.com/@ArchipelDocumentaries",
              },
              {
                description: "Social",
                domain: "Bluesky",
                logo: "/logos/bluesky.svg",
                url: "https://bsky.app/",
              },
            ],
            title: "Nguồn tham khảo",
          },
        }}
        isAdmin={false}
      />,
    )

    expect(screen.getByAltText("Sakugabooru Blog logo")).toHaveAttribute(
      "src",
      "/logos/sakuga-blog.png",
    )
    expect(screen.getByAltText("Settei Dreams logo")).toHaveAttribute(
      "src",
      "/logos/settei-dreams.png",
    )
    expect(screen.getByAltText("Archipel logo")).toHaveAttribute(
      "src",
      "/logos/archipel.png",
    )
    expect(screen.getByAltText("Bluesky logo")).toHaveAttribute(
      "src",
      "/logos/bluesky.svg",
    )
  })

  it("falls back to default content when persisted page data is malformed", () => {
    render(
      <ResourcesClient
        appName="Anime Blog"
        initialPage={{ content: { resources: "invalid" } }}
        isAdmin={false}
      />,
    )

    expect(
      screen.getByRole("heading", { level: 1, name: /Nguồn\s*tham\s*khảo/ }),
    ).toBeVisible()
    expect(
      screen.getByRole("link", { name: /Sakugabooru Blog/i }),
    ).toHaveAttribute("href", "https://blog.sakugabooru.com/")
  })

  it("keeps the admin editing actions in the page flow", async () => {
    const user = userEvent.setup()

    render(
      <ResourcesClient
        appName="Anime Blog"
        initialPage={null}
        isAdmin
      />,
    )

    await user.click(screen.getByRole("button", { name: "Chỉnh sửa trang" }))

    const toolbar = screen
      .getByRole("heading", { name: "Đang chỉnh sửa Nguồn tham khảo" })
      .parentElement

    expect(toolbar).toHaveClass(
      "mb-6",
      "flex",
      "sm:flex-row",
      "sm:justify-between",
    )
  })
})
