import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DisplayRoleBadge } from "@/components/profile/DisplayRoleBadge"
import { RoleBadges } from "@/components/profile/RoleBadges"

describe("DisplayRoleBadge", () => {
  it("uses the Writer default when no custom role exists", () => {
    render(
      <DisplayRoleBadge displayRoleColor={null} displayRoleName={null} />,
    )

    expect(screen.getByText("Writer")).toHaveClass(
      "rounded-[4px]",
      "px-1.5",
      "text-[10px]",
      "uppercase",
    )
    expect(screen.getByText("Writer")).not.toHaveClass(
      "rounded-full",
      "shadow-sm",
    )
  })

  it("renders the custom name with the original tinted badge treatment", () => {
    render(
      <DisplayRoleBadge
        displayRoleColor="#F4F4F5"
        displayRoleName="Seasonal Analyst"
      />,
    )

    expect(screen.getByText("Seasonal Analyst")).toHaveAttribute("style")
    expect(screen.getByText("Seasonal Analyst").getAttribute("style")).toContain(
      "--display-role-bg: #F4F4F529",
    )
    expect(screen.getByText("Seasonal Analyst")).toHaveClass(
      "rounded-[4px]",
      "px-1.5",
      "text-[10px]",
      "uppercase",
    )
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
    expect(screen.getByText("ADMIN")).toHaveClass("rounded-[4px]", "px-1.5")
    expect(screen.getByText("Editor-in-Chief")).toHaveClass(
      "rounded-[4px]",
      "px-1.5",
    )
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
