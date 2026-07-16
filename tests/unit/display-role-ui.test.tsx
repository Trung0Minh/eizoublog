import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DisplayRoleBadge } from "@/components/profile/DisplayRoleBadge"
import { RoleBadges } from "@/components/profile/RoleBadges"

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

describe("RoleBadges", () => {
  it("keeps ADMIN authority visible beside an optional custom badge", () => {
    render(
      <RoleBadges
        displayRoleColor="#475569"
        displayRoleName="Editor-in-Chief"
        role="ADMIN"
      />,
    )

    expect(screen.getByText("ADMIN")).toBeVisible()
    expect(screen.getByText("Editor-in-Chief")).toBeVisible()
  })

  it("does not render an empty custom badge for admins", () => {
    render(
      <RoleBadges
        displayRoleColor={null}
        displayRoleName={null}
        role="ADMIN"
      />,
    )

    expect(screen.getByText("ADMIN")).toBeVisible()
    expect(screen.queryByText("Writer")).not.toBeInTheDocument()
  })
})
