import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DisplayRoleBadge } from "@/components/profile/DisplayRoleBadge"

describe("DisplayRoleBadge", () => {
  it("uses the Writer default when no custom role exists", () => {
    render(
      <DisplayRoleBadge displayRoleColor={null} displayRoleName={null} />,
    )

    expect(screen.getByText("Writer")).toBeVisible()
  })

  it("renders the custom name and accessible colors", () => {
    render(
      <DisplayRoleBadge
        displayRoleColor="#F4F4F5"
        displayRoleName="Seasonal Analyst"
      />,
    )

    expect(screen.getByText("Seasonal Analyst")).toHaveStyle({
      backgroundColor: "#F4F4F5",
      color: "#18181B",
    })
  })
})
