import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

function readIssues(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap((issue) =>
    typeof issue === "object" &&
    issue !== null &&
    "code" in issue &&
    "message" in issue &&
    typeof issue.code === "string" &&
    typeof issue.message === "string"
      ? [{ code: issue.code, message: issue.message }]
      : [],
  )
}
export async function GET() {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])
  if (!activeSession) return unauthorizedResponse()

  try {
    const status = await prisma.durabilityStatus.findUnique({
      select: {
        capacityBytes: true,
        checkedAt: true,
        databaseBytes: true,
        issues: true,
        latestBackupAt: true,
        latestMediaBackupAt: true,
        severity: true,
      },
      where: { id: "primary" },
    })
    if (!status) {
      return Response.json({
        data: { checkedAt: null, issues: [], severity: "UNKNOWN" },
      })
    }

    const issues = readIssues(status.issues)
    if (activeSession.user.role !== "ADMIN") {
      const writerIssues = issues.filter(({ code }) =>
        code.startsWith("DATABASE_CAPACITY_CRITICAL"),
      )
      return Response.json({
        data: {
          checkedAt: status.checkedAt,
          issues: writerIssues,
          severity: status.severity === "CRITICAL" ? "CRITICAL" : "HEALTHY",
        },
      })
    }

    return Response.json({
      data: {
        capacityBytes: status.capacityBytes?.toString() ?? null,
        checkedAt: status.checkedAt,
        databaseBytes: status.databaseBytes?.toString() ?? null,
        issues,
        latestBackupAt: status.latestBackupAt,
        latestMediaBackupAt: status.latestMediaBackupAt,
        severity: status.severity,
      },
    })
  } catch (error) {
    console.error("[GET /api/durability/status]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
