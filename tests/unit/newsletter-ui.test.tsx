import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const analyticsMocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
}))

vi.mock("@/lib/analytics", () => ({
  trackEvent: analyticsMocks.trackEvent,
}))

import { NewsletterForm } from "@/components/newsletter/NewsletterForm"

describe("NewsletterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("renders an accessible email signup form", () => {
    render(<NewsletterForm />)

    expect(
      screen.getByText("Nhận thông báo khi có bài viết mới."),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: "Địa chỉ email" }),
    ).toBeRequired()
    expect(
      screen.getByRole("button", { name: "Đăng ký" }),
    ).toBeInTheDocument()
  })

  it("subscribes an email and shows the success message", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { message: "Subscribed successfully." } }),
        { status: 201 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(<NewsletterForm />)

    await user.type(
      screen.getByRole("textbox", { name: "Địa chỉ email" }),
      "Reader@Example.com",
    )
    await user.click(screen.getByRole("button", { name: "Đăng ký" }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/newsletter/subscribe", {
        body: JSON.stringify({ email: "Reader@Example.com" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
    })
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Subscribed successfully.",
    )
    expect(analyticsMocks.trackEvent).toHaveBeenCalledWith(
      "newsletter_subscribed",
    )
    expect(screen.getByRole("textbox", { name: "Địa chỉ email" })).toHaveValue(
      "",
    )
  })

  it("shows API errors without clearing the email", async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Email service unavailable" }), {
        status: 400,
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    render(<NewsletterForm />)

    await user.type(
      screen.getByRole("textbox", { name: "Địa chỉ email" }),
      "reader@example.com",
    )
    await user.click(screen.getByRole("button", { name: "Đăng ký" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email service unavailable",
    )
    expect(screen.getByRole("textbox", { name: "Địa chỉ email" })).toHaveValue(
      "reader@example.com",
    )
  })
})
