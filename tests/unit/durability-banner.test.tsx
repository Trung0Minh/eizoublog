import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DurabilityBanner } from "@/components/durability/DurabilityBanner"

describe("DurabilityBanner", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("shows an actionable warning when post saving is at risk", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        issues: [{ code: "DATABASE_CAPACITY_CRITICAL", message: "Database storage is 87.0% full" }],
        severity: "CRITICAL",
      },
    }), { status: 200 })))

    render(<DurabilityBanner forceCheck scope="writer" />)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Database storage is 87.0% full",
    )
  })
})
