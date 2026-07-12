import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const migratedFiles = [
  "app/(public)/about/AboutClient.tsx",
  "app/(public)/nhap-mon-sakuga/IntroToSakugaClient.tsx",
  "app/(public)/resources/ResourcesClient.tsx",
  "components/posts/CoAuthorInviteActions.tsx",
  "components/posts/PostOwnerActions.tsx",
  "components/admin/AdminCommentsTable.tsx",
  "components/admin/WritersTable.tsx",
  "components/admin/NewsletterBroadcastForm.tsx",
  "components/admin/AdminPostsTable.tsx",
  "components/admin/PendingInvitesTable.tsx",
  "components/editor/MediaUpload.tsx",
  "components/editor/TiptapEditor.tsx",
]

describe("native browser dialog migration", () => {
  it.each(migratedFiles)("removes alert and confirm from %s", (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8")

    expect(source).not.toMatch(/\b(?:window\.)?alert\s*\(/)
    expect(source).not.toMatch(/\b(?:window\.)?confirm\s*\(/)
  })
})
