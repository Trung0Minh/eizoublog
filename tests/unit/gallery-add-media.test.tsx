import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { GalleryAddMediaButton } from "@/components/editor/GalleryAddMediaButton"

describe("GalleryAddMediaButton", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("uploads multiple files and returns gallery-ready media", async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              files: [
                { url: "https://cdn.example.com/a.webp" },
                { url: "https://cdn.example.com/b.mp4" },
              ],
            },
          }),
          { status: 201 },
        ),
      ),
    )

    const { container } = render(<GalleryAddMediaButton onAdd={onAdd} />)
    await user.upload(container.querySelector('input[type="file"]')!, [
      new File(["a"], "a.webp", { type: "image/webp" }),
      new File(["b"], "b.mp4", { type: "video/mp4" }),
    ])

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith([
        {
          alt: "",
          caption: "",
          showCaption: false,
          url: "https://cdn.example.com/a.webp",
        },
        {
          alt: "",
          caption: "",
          showCaption: false,
          url: "https://cdn.example.com/b.mp4",
        },
      ])
    })
    expect(screen.getByRole("button", { name: "Add media" })).toBeEnabled()
  })
})
