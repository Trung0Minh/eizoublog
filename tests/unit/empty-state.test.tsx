import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EmptyState } from "@/components/ui/EmptyState"

describe("EmptyState", () => {
  it("renders its default search icon without a component prop", () => {
    render(<EmptyState description="No posts yet" title="No posts found" />)

    expect(screen.getByRole("heading", { name: "No posts found" })).toBeVisible()
    expect(screen.getByText("No posts yet")).toBeVisible()
    expect(document.querySelector("svg")).toBeInTheDocument()
  })
})
