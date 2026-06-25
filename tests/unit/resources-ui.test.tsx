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
          contentText: null,
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
    const saveBtn = screen.getByRole("button", { name: /^Lưu$/ })
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
          contentText: null,
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

  it("uses PNG replacements for legacy duplicated logos and keeps Bluesky SVG", () => {
    render(
      <ResourcesClient
        appName="Anime Blog"
        initialPage={{
          contentText: null,
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
        initialPage={{ content: { resources: "invalid" }, contentText: null }}
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
})
