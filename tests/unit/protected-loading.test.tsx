import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import AdminLoading from "@/app/(admin)/admin/loading"
import DashboardLoading from "@/app/(writer)/dashboard/loading"

describe("protected route loading states", () => {
  it("renders a centered admin panel loader", () => {
    const { container } = render(<AdminLoading />)

    expect(screen.getByRole("status")).toHaveTextContent("Loading admin panel")
    expect(container.querySelector(".loader")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveClass(
      "items-center",
      "justify-center",
    )
  })

  it("renders a centered dashboard loader", () => {
    const { container } = render(<DashboardLoading />)

    expect(screen.getByRole("status")).toHaveTextContent("Loading dashboard")
    expect(container.querySelector(".loader")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveClass(
      "items-center",
      "justify-center",
    )
  })
})
