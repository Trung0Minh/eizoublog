import { describe, expect, it } from "vitest"

import { getClipboardImageFiles } from "@/components/editor/clipboardImages"

describe("getClipboardImageFiles", () => {
  it("returns image files and ignores pasted text or non-image files", () => {
    const image = new File(["image"], "clipboard.png", { type: "image/png" })
    const video = new File(["video"], "clip.mp4", { type: "video/mp4" })
    const clipboard = {
      items: [
        { getAsFile: () => null, kind: "string", type: "text/plain" },
        { getAsFile: () => video, kind: "file", type: "video/mp4" },
        { getAsFile: () => image, kind: "file", type: "image/png" },
      ],
    } as unknown as DataTransfer

    expect(getClipboardImageFiles(clipboard)).toEqual([image])
  })
})
