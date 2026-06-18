import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import { describe, expect, it, vi } from "vitest"

const navigationState = vi.hoisted(() => ({
  pathname: "/",
  searchParams: "",
}))

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
  useSearchParams: () => new URLSearchParams(navigationState.searchParams),
}))

import { NavigationProgress } from "@/components/layout/NavigationProgress"

describe("NavigationProgress", () => {
  it("shows progress for internal page navigation and clears after route change", async () => {
    const user = userEvent.setup()
    window.history.pushState(null, "", "/")
    navigationState.pathname = "/"
    navigationState.searchParams = ""
    const { rerender } = render(
      <>
        <a href={`${window.location.origin}/about`} onClick={(event) => event.preventDefault()}>
          Giới thiệu
        </a>
        <NavigationProgress />
      </>,
    )
    await act(async () => undefined)

    await user.click(screen.getByRole("link", { name: "Giới thiệu" }))

    expect(screen.getByRole("status")).toBeVisible()

    navigationState.pathname = "/about"
    rerender(
      <>
        <a href={`${window.location.origin}/about`} onClick={(event) => event.preventDefault()}>
          Giới thiệu
        </a>
        <NavigationProgress />
      </>,
    )

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument()
    })
  })

  it("does not show progress for same-page hash links", async () => {
    const user = userEvent.setup()
    window.history.pushState(null, "", "/about")
    navigationState.pathname = "/about"
    navigationState.searchParams = ""

    render(
      <>
        <a href={`${window.location.origin}/about#team`} onClick={(event) => event.preventDefault()}>
          Team
        </a>
        <NavigationProgress />
      </>,
    )

    await user.click(screen.getByRole("link", { name: "Team" }))

    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})
