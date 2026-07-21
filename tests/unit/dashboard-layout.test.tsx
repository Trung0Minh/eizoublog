import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: vi.fn(() => "/dashboard"),
}))
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      username: "mina",
    },
  })),
}))

import DashboardLayout from "@/app/(writer)/dashboard/layout"

describe("DashboardLayout", () => {
  it("renders the page body without duplicate dashboard navigation", async () => {
    render(await DashboardLayout({ children: <p>Dashboard body</p> }))

    expect(screen.getByText("Dashboard body")).toBeVisible()
    expect(
      screen.queryByRole("navigation", { name: "Dashboard navigation" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("Chỉnh sửa hồ sơ")).not.toBeInTheDocument()
    expect(screen.queryByText("Xem hồ sơ công khai")).not.toBeInTheDocument()
  })
})
