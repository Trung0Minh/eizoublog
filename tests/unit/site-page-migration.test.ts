import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "vitest"

const projectRoot = process.cwd()

function read(relativePath: string) {
  return readFileSync(join(projectRoot, relativePath), "utf8")
}

function readMigrationSql() {
  return readdirSync(join(projectRoot, "prisma/migrations"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      read(join("prisma/migrations", entry.name, "migration.sql"))
    )
    .join("\n")
}

describe("SitePage persistence schema", () => {
  test("creates the site_pages table used by editable public pages", () => {
    const schema = read("prisma/schema.prisma")
    const migrations = readMigrationSql()

    expect(schema).toContain("model SitePage")
    expect(schema).toContain('@@map("site_pages")')
    expect(migrations).toMatch(
      /CREATE TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+"site_pages"/i
    )
  })
})
