"use client"

import { AlertTriangle, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"

interface StatusIssue {
  code: string
  message: string
}

interface DurabilityState {
  issues: StatusIssue[]
  severity: "CRITICAL" | "HEALTHY" | "UNKNOWN" | "WARNING"
}

function readState(value: unknown): DurabilityState | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("severity" in value.data) ||
    !("issues" in value.data) ||
    typeof value.data.severity !== "string" ||
    !Array.isArray(value.data.issues)
  ) return null

  const severity = value.data.severity
  if (!["CRITICAL", "HEALTHY", "UNKNOWN", "WARNING"].includes(severity)) return null
  const issues = value.data.issues.flatMap((issue) =>
    typeof issue === "object" &&
    issue !== null &&
    "code" in issue &&
    "message" in issue &&
    typeof issue.code === "string" &&
    typeof issue.message === "string"
      ? [{ code: issue.code, message: issue.message }]
      : [],
  )
  return { issues, severity: severity as DurabilityState["severity"] }
}

export function DurabilityBanner({
  forceCheck = false,
  scope,
}: {
  forceCheck?: boolean
  scope: "admin" | "writer"
}) {
  const [state, setState] = useState<DurabilityState | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV === "test" && !forceCheck) return
    let active = true
    void fetch("/api/durability/status")
      .then(async (response) => response.ok ? response.json() as Promise<unknown> : null)
      .then((value) => {
        if (active) setState(readState(value))
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [forceCheck])

  if (!state || state.severity === "HEALTHY") return null
  if (scope === "writer" && state.severity !== "CRITICAL") return null

  const isCritical = state.severity === "CRITICAL"
  return (
    <div
      className={
        isCritical
          ? "mb-5 flex gap-3 rounded-[10px] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          : "mb-5 flex gap-3 rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200"
      }
      role="alert"
    >
      {isCritical ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}
      <div>
        <p className="font-semibold">
          {isCritical ? "Post saving may be at risk" : "Post protection needs attention"}
        </p>
        {state.issues.map((issue) => (
          <p className="mt-1 leading-relaxed" key={issue.code}>{issue.message}</p>
        ))}
        {isCritical && (
          <p className="mt-2 leading-relaxed">
            The editor keeps a recovery copy on this device. Download it before leaving if saving fails.
          </p>
        )}
      </div>
    </div>
  )
}
