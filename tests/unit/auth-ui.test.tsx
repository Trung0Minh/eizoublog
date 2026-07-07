import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  push: vi.fn(),
  signIn: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock("next-auth/react", () => ({ signIn: mocks.signIn }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: mocks.useSearchParams,
}))

import { LoginForm } from "@/components/auth/LoginForm"
import { InviteForm } from "@/components/auth/InviteForm"

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useSearchParams.mockReturnValue(new URLSearchParams())
    mocks.signIn.mockResolvedValue(undefined)
  })

  it("submits the credentials sign-in with the site password", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "writer@example.com"
    )
    await user.type(screen.getByLabelText("Site password"), "secret-password")
    await user.click(screen.getByRole("button", { name: "Log in" }))

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
        email: "writer@example.com",
        password: "secret-password",
        callbackUrl: "/dashboard",
        redirect: false,
      })
    })
  })

  it("links to forgot password and warns against Gmail passwords", () => {
    render(<LoginForm />)

    expect(
      screen.getByText(/not your Gmail password/i)
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password"
    )
  })

  it("uses an opaque login panel over the seasonal background", () => {
    render(<LoginForm />)

    const panel = screen.getByRole("heading", { name: "Writer login" }).closest("section")

    expect(panel).toHaveClass("bg-background")
    expect(panel).not.toHaveClass("bg-subtle-bg/30")
  })

  it("shows a generic invalid credentials error", async () => {
    const user = userEvent.setup()
    mocks.signIn.mockResolvedValue({ error: "CredentialsSignin" })

    render(<LoginForm />)

    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "writer@example.com"
    )
    await user.type(screen.getByLabelText("Site password"), "wrong-password")
    await user.click(screen.getByRole("button", { name: "Log in" }))

    expect(
      await screen.findByText("Invalid email or site password.")
    ).toBeInTheDocument()
  })
})

describe("InviteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", mocks.fetch)
    mocks.signIn.mockResolvedValue(undefined)
  })

  it("creates the account with a site password then signs in with credentials", async () => {
    const user = userEvent.setup()
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { message: "Account created successfully" } }),
        { status: 201 }
      )
    )
    render(<InviteForm token="invite-token" email="writer@example.com" />)

    await user.type(screen.getByRole("textbox", { name: "Display Name" }), "Writer")
    await user.type(screen.getByRole("textbox", { name: "Username" }), "New_Writer")
    await user.type(screen.getByLabelText("Site password"), "secret-password")
    await user.type(screen.getByLabelText("Confirm site password"), "secret-password")
    await user.click(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "invite-token",
          name: "Writer",
          username: "new_writer",
          password: "secret-password",
        }),
      })
    })
    expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
      email: "writer@example.com",
      password: "secret-password",
      callbackUrl: "/dashboard",
      redirect: true,
    })
  })

  it("explains that invite passwords are separate from Gmail", () => {
    render(<InviteForm token="invite-token" email="writer@example.com" />)

    expect(
      screen.getByText(/Create a separate Anime Blog password/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Do not use your Gmail password/i)).toBeInTheDocument()
  })

  it("shows an API error and does not sign in", async () => {
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ error: "Username is already taken" }), {
        status: 400,
      })
    )
    render(<InviteForm token="invite-token" email="writer@example.com" />)

    fireEvent.change(screen.getByRole("textbox", { name: "Display Name" }), {
      target: { value: "Writer" },
    })
    fireEvent.change(screen.getByRole("textbox", { name: "Username" }), {
      target: { value: "existing" },
    })
    fireEvent.change(screen.getByLabelText("Site password"), {
      target: { value: "secret-password" },
    })
    fireEvent.change(screen.getByLabelText("Confirm site password"), {
      target: { value: "secret-password" },
    })
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Username is already taken")).toBeInTheDocument()
    expect(mocks.signIn).not.toHaveBeenCalled()
  })

  it("blocks submission when the password confirmation does not match", async () => {
    const user = userEvent.setup()
    render(<InviteForm token="invite-token" email="writer@example.com" />)

    await user.type(screen.getByRole("textbox", { name: "Display Name" }), "Writer")
    await user.type(screen.getByRole("textbox", { name: "Username" }), "writer")
    await user.type(screen.getByLabelText("Site password"), "secret-password")
    await user.type(screen.getByLabelText("Confirm site password"), "different-password")
    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument()
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.signIn).not.toHaveBeenCalled()
  })
})
