import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

describe("deployment region", () => {
  it("runs Vercel functions beside the Sydney Supabase database", () => {
    const config = JSON.parse(
      readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"),
    ) as { regions?: string[] }

    expect(config.regions).toEqual(["syd1"])
  })
})
