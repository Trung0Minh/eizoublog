import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AvatarUpload } from "@/components/profile/AvatarUpload"
import { ProfileForm } from "@/components/profile/ProfileForm"

vi.mock("@/components/editor/TiptapEditor", () => ({
  TiptapEditor: ({
    content,
    onChange,
    placeholder,
    ariaLabel,
  }: {
    content?: any
    onChange?: (json: any) => void
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

    expect(screen.getByRole("textbox", { name: "Tên người dùng" })).toBeDisabled()
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
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
    })
    expect(
      await screen.findByText("Cập nhật hồ sơ thành công."),
    ).toBeInTheDocument()
  })
})

describe("AvatarUpload", () => {
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
  })

  it("uploads avatar files to the avatars folder", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<AvatarUpload name="Mina Writer" onChange={onChange} value="" />)

    await user.upload(
      screen.getByLabelText("Tải ảnh đại diện lên"),
      new File(["png"], "avatar.png", { type: "image/png" }),
    )

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
