import { readFile } from "node:fs/promises"

import { describe, expect, it } from "vitest"

const migrationPath =
  "prisma/migrations/20260718100000_fix_post_recovery_digest_search_path/migration.sql"

describe("post recovery trigger migration", () => {
  it("keeps pgcrypto digest resolvable under the pinned search path", async () => {
    const migration = await readFile(migrationPath, "utf8")

    expect(migration).toContain(
      "SET search_path = pg_catalog, extensions, public;",
    )
  })
})
