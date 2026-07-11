import { useEffect, useState } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AvatarUpload } from "@/components/profile/AvatarUpload"
import { ProfileForm } from "@/components/profile/ProfileForm"

const navigationMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: navigationMocks.refresh }),
}))

interface CropArea {
  height: number
  width: number
  x: number
  y: number
}

vi.mock("react-easy-crop", () => ({
  __esModule: true,
  default: function MockCropper({
    image,
    onCropComplete,
  }: {
    image: string
    onCropComplete: (area: CropArea, pixels: CropArea) => void
  }) {
    useEffect(() => {
      onCropComplete(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 0, y: 0, width: 100, height: 100 }
      )
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return <div data-image={image} data-testid="mock-cropper" />
  },
}))

vi.mock("@/components/editor/TiptapEditor", () => ({
  TiptapEditor: ({
    content,
    onChange,
    placeholder,
    ariaLabel,
  }: {
    content?: unknown
    onChange?: (json: unknown) => void
    placeholder?: string
    ariaLabel?: string
  }) => (
    <textarea
      aria-label={ariaLabel}
      placeholder={placeholder}
      defaultValue={content ? (typeof content === "string" ? content : JSON.stringify(content)) : ""}
      onChange={(e) => onChange?.({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: e.target.value
              }
            ]
          }
        ]
      })}
      role="textbox"
    />
  ),
}))

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              avatarUrl: null,
              bio: "Production notes and layout analysis.",
              email: "mina@example.com",
              id: "writer-1",
              name: "Mina Revised",
              username: "mina",
            },
          }),
          { status: 200 },
        ),
      ),
    )
  })

  it("submits editable fields and keeps username/email read-only", async () => {
    const user = userEvent.setup()

    render(
      <ProfileForm
        user={{
          avatarUrl: null,
          bio: "Initial bio",
          email: "mina@example.com",
          name: "Mina",
          username: "mina",
        }}
      />,
    )

    expect(screen.getByRole("textbox", { name: "Tên người dùng" })).not.toBeDisabled()
    expect(screen.getByRole("textbox", { name: "Email" })).toBeDisabled()

    await user.clear(screen.getByRole("textbox", { name: "Tên hiển thị" }))
    await user.type(
      screen.getByRole("textbox", { name: "Tên hiển thị" }),
      "Mina Revised",
    )
    await user.clear(screen.getByRole("textbox", { name: "Giới thiệu" }))
    await user.type(
      screen.getByRole("textbox", { name: "Giới thiệu" }),
      "Production notes and layout analysis.",
    )
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/profile", {
        body: JSON.stringify({
          avatarUrl: null,
          bio: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Production notes and layout analysis.",
                  },
                ],
              },
            ],
          }),
          name: "Mina Revised",
          username: "mina",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
    })
    expect(
      await screen.findByText("Cập nhật hồ sơ thành công."),
    ).toBeInTheDocument()
    expect(navigationMocks.refresh).toHaveBeenCalledTimes(1)
  })
})

describe("AvatarUpload", () => {
  let OriginalImage: typeof Image

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { url: "https://cdn.example.com/avatars/avatar.png" },
          }),
          { status: 201 },
        ),
      ),
    )

    OriginalImage = global.Image
    const MockImage = class extends OriginalImage {
      constructor() {
        super()
        setTimeout(() => {
          if (this.onload) {
            this.onload(new Event("load"))
          }
        }, 10)
      }
    }
    global.Image = MockImage as typeof Image

    // Stub canvas.getContext to return mock 2d context
    const getContextMock: HTMLCanvasElement["getContext"] = function (
      this: HTMLCanvasElement,
      contextId: string,
    ) {
      if (contextId === "2d") {
        return {
          beginPath: () => {},
          arc: () => {},
          clip: () => {},
          drawImage: () => {},
        } as unknown as CanvasRenderingContext2D
      }
      return null
    } as HTMLCanvasElement["getContext"]
    HTMLCanvasElement.prototype.getContext = getContextMock

    // Stub canvas.toBlob to invoke the callback with a mock Blob
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      setTimeout(() => callback?.(new Blob(["mock-cropped-image"], { type: "image/webp" })), 0)
    }
  })

  afterEach(() => {
    global.Image = OriginalImage
  })

  it("uploads avatar files to the avatars folder", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<AvatarUpload name="Mina Writer" onChange={onChange} value="" />)

    await user.upload(
      screen.getByLabelText("Tải ảnh đại diện lên"),
      new File(["png"], "avatar.png", { type: "image/png" }),
    )

    // Click confirmation button in crop modal
    await user.click(screen.getByRole("button", { name: "Xác nhận" }))

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        "https://cdn.example.com/avatars/avatar.png",
      )
    })
    const request = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as {
      body: FormData
      method: string
    }
    expect(request.method).toBe("POST")
    expect(request.body.get("folder")).toBe("avatars")
  })

  it("reopens the cropper with the original upload after saving a crop", async () => {
    const user = userEvent.setup()
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:original-avatar")
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined)

    function AvatarHarness() {
      const [value, setValue] = useState("")
      return <AvatarUpload name="Mina Writer" onChange={setValue} value={value} />
    }

    render(<AvatarHarness />)

    await user.upload(
      screen.getByLabelText("Tải ảnh đại diện lên"),
      new File(["original"], "avatar.png", { type: "image/png" }),
    )
    expect(screen.getByTestId("mock-cropper")).toHaveAttribute(
      "data-image",
      "blob:original-avatar",
    )

    await user.click(screen.getByRole("button", { name: "Xác nhận" }))
    await screen.findByRole("button", { name: "Căn chỉnh ảnh đại diện" })
    await user.click(screen.getByRole("button", { name: "Căn chỉnh ảnh đại diện" }))

    expect(screen.getByTestId("mock-cropper")).toHaveAttribute(
      "data-image",
      "blob:original-avatar",
    )
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).not.toHaveBeenCalled()
  })

  it("stacks avatar controls on mobile and aligns them on wider screens", () => {
    const { container } = render(
      <AvatarUpload name="Mina Writer" onChange={vi.fn()} value="" />,
    )

    expect(container.firstElementChild).toHaveClass(
      "flex-col",
      "sm:flex-row",
    )
  })
})
