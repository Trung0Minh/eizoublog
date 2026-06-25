import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect, useRef } from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-easy-crop", () => ({
  default: function MockCropper({
    aspect,
    onCropComplete,
  }: {
    aspect: number
    onCropComplete: (area: {
      x: number
      y: number
      width: number
      height: number
    }) => void
  }) {
    const onCropCompleteRef = useRef(onCropComplete)
    onCropCompleteRef.current = onCropComplete

    useEffect(() => {
      onCropCompleteRef.current(
        aspect > 1
          ? { x: 10, y: 20, width: 80, height: 70 }
          : { x: 30, y: 5, width: 40, height: 90 },
      )
    }, [aspect])

    return <div data-aspect={aspect} data-testid="mock-cropper" />
  },
}))

import { CoverImageUpload } from "@/components/posts/CoverImageUpload"

describe("responsive background crop", () => {
  it("edits desktop and mobile crops from one crop action", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <CoverImageUpload
        onChange={onChange}
        responsiveCrop
        value="https://cdn.example.com/background.jpg"
      />,
    )

    expect(
      screen.getAllByRole("button", { name: "Cắt ảnh bìa" }),
    ).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Cắt ảnh bìa" }))

    expect(
      screen.getByRole("button", { name: "Desktop 16:9" }),
    ).toHaveAttribute("aria-pressed", "true")
    expect(
      screen.getByRole("button", { name: "Mobile 9:16" }),
    ).toHaveAttribute("aria-pressed", "false")

    await user.click(screen.getByRole("button", { name: "Mobile 9:16" }))

    expect(screen.getByTestId("mock-cropper")).toHaveAttribute(
      "data-aspect",
      String(9 / 16),
    )

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Mobile 9:16" }),
      ).toHaveAttribute("aria-pressed", "true")
    })
    await user.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(onChange).toHaveBeenCalledWith(
      expect.stringContaining("mcx=30.00"),
    )
    expect(onChange).toHaveBeenCalledWith(
      expect.stringContaining("mch=90.00"),
    )
  })

  it("keeps ordinary post covers on the single desktop cropper", async () => {
    const user = userEvent.setup()

    render(
      <CoverImageUpload
        onChange={vi.fn()}
        value="https://cdn.example.com/cover.jpg"
      />,
    )

    await user.click(screen.getByRole("button", { name: "Cắt ảnh bìa" }))

    expect(
      screen.queryByRole("button", { name: "Mobile 9:16" }),
    ).not.toBeInTheDocument()
  })
})
