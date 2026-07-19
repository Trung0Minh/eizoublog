import { readFile } from "node:fs/promises"

import { describe, expect, it } from "vitest"

const migrationPath =
  "prisma/migrations/20260719090000_add_event_submission_snapshots/migration.sql"

describe("event submission snapshot migration", () => {
  it("adds snapshot columns and backfills existing submitted rooms", async () => {
    const migration = await readFile(migrationPath, "utf8")

    expect(migration).toContain('ADD COLUMN "submittedContent" JSONB')
    expect(migration).toContain('ADD COLUMN "submittedPostVersion" INTEGER')
    expect(migration).toContain('room."status" = \'SUBMITTED\'')
    expect(migration).toContain('room."postId" = post."id"')
    expect(migration).toContain(
      'NULLIF(BTRIM(room."writerIntro"), \'\')',
    )
  })
})
