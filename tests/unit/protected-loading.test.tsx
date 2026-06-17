import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import AdminLoading from "@/app/(admin)/admin/loading"
import DashboardLoading from "@/app/(writer)/dashboard/loading"

describe("protected route loading states", () => {
  it("renders an admin panel loading skeleton", () => {
    const { container } = render(<AdminLoading />)

    expect(screen.getByRole("status")).toHaveTextContent("Loading admin panel")
    expect(container.querySelector(".loader")).toBeInTheDocument()
  })

  it("renders a dashboard loading skeleton", () => {
    const { container } = render(<DashboardLoading />)

    expect(screen.getByRole("status")).toHaveTextContent("Loading dashboard")
    expect(container.querySelector(".loader")).toBeInTheDocument()
  })
})
