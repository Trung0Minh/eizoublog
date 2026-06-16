import { describe, expect, it } from "vitest"

import { canViewPost } from "@/lib/postAccess"

const privateDraft = {
  authorId: "writer-1",
  coAuthors: [{ userId: "writer-2" }],
  draftVisibility: "PRIVATE" as const,
  status: "DRAFT" as const,
}

describe("canViewPost", () => {
  it("allows everyone to view published posts", () => {
    expect(
      canViewPost(
        { ...privateDraft, status: "PUBLISHED" },
        undefined,
        undefined,
      ),
    ).toBe(true)
  })

  it("allows admins and primary authors to view private drafts", () => {
    expect(canViewPost(privateDraft, "admin-1", "ADMIN")).toBe(true)
    expect(canViewPost(privateDraft, "writer-1", "WRITER")).toBe(true)
  })

  it("hides private drafts from unaccepted co-authors", () => {
    expect(canViewPost(privateDraft, "writer-2", "WRITER")).toBe(false)
  })

  it("allows accepted co-authors to view drafts", () => {
    expect(
      canViewPost(
        {
          ...privateDraft,
          coAuthors: [{ status: "ACCEPTED", userId: "writer-2" }],
          draftVisibility: "CO_AUTHORS",
        },
        "writer-2",
        "WRITER",
      ),
    ).toBe(true)
  })

  it("hides shared drafts from unrelated writers and visitors", () => {
    const sharedDraft = { ...privateDraft, draftVisibility: "CO_AUTHORS" as const }

    expect(canViewPost(sharedDraft, "writer-3", "WRITER")).toBe(false)
    expect(canViewPost(sharedDraft, undefined, undefined)).toBe(false)
  })

  it("only allows admins to view archived posts", () => {
    const archivedPost = { ...privateDraft, status: "ARCHIVED" as never }

    expect(canViewPost(archivedPost, "admin-1", "ADMIN")).toBe(true)
    expect(canViewPost(archivedPost, "writer-1", "WRITER")).toBe(false)
    expect(canViewPost(archivedPost, "writer-2", "WRITER")).toBe(false)
    expect(canViewPost(archivedPost, undefined, undefined)).toBe(false)
  })
})
