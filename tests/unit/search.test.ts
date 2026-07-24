import { describe, expect, it } from "vitest"

import {
  getHighlightedSearchSegments,
  prepareSearchQuery,
  sanitizeSearchSnippet,
} from "@/lib/search"

describe("prepareSearchQuery", () => {
  it("normalizes display text and builds prefix matching for every token", () => {
    expect(prepareSearchQuery("  ufotable animation  ")).toEqual({
      canUseFuzzy: true,
      displayQuery: "ufotable animation",
      normalizedQuery: "ufotable animation",
      prefixTsQuery: "ufotable:* & animation:*",
    })
  })

  it("removes tsquery syntax and punctuation from prefix tokens", () => {
    expect(prepareSearchQuery("frieren!! | (memory):*")).toMatchObject({
      displayQuery: "frieren!! | (memory):*",
      normalizedQuery: "frieren memory",
      prefixTsQuery: "frieren:* & memory:*",
    })
  })

  it("folds accents and Vietnamese d-stroke for matching", () => {
    expect(prepareSearchQuery("Đạo diễn Friéren")).toMatchObject({
      normalizedQuery: "dao dien frieren",
      prefixTsQuery: "dao:* & dien:* & frieren:*",
    })
  })

  it("returns an empty search plan when no searchable tokens remain", () => {
    expect(prepareSearchQuery("!!! &&&")).toEqual({
      canUseFuzzy: false,
      displayQuery: "!!! &&&",
      normalizedQuery: "",
      prefixTsQuery: "",
    })
  })
})

describe("sanitizeSearchSnippet", () => {
  it("preserves mark tags while escaping other HTML", () => {
    expect(
      sanitizeSearchSnippet("<mark>Frieren</mark> <script>alert(1)</script>"),
    ).toBe("<mark>Frieren</mark> &lt;script&gt;alert(1)&lt;/script&gt;")
  })
})

describe("getHighlightedSearchSegments", () => {
  it("highlights literal query matches", () => {
    expect(getHighlightedSearchSegments("Momo writes about anime", "momo")).toEqual([
      { highlight: true, text: "Momo" },
      { highlight: false, text: " writes about anime" },
    ])
  })

  it("highlights accent-insensitive Vietnamese matches", () => {
    expect(getHighlightedSearchSegments("Đạo diễn xuất sắc", "dao dien")).toEqual([
      { highlight: true, text: "Đạo" },
      { highlight: false, text: " " },
      { highlight: true, text: "diễn" },
      { highlight: false, text: " xuất sắc" },
    ])
  })

  it("returns plain text when a fuzzy match has no literal text to mark", () => {
    expect(getHighlightedSearchSegments("Animation timing", "momo")).toEqual([
      { highlight: false, text: "Animation timing" },
    ])
  })
})
