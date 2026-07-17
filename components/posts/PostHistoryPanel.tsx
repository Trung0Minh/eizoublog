"use client"

import { RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface RevisionSummary {
  createdAt: string
  id: string
  kind: string
  sourceVersion: number
}

function readRevisions(value: unknown): RevisionSummary[] {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("revisions" in value.data) ||
    !Array.isArray(value.data.revisions)
  ) return []

  return value.data.revisions.flatMap((item) =>
    typeof item === "object" &&
    item !== null &&
    "createdAt" in item &&
    "id" in item &&
    "kind" in item &&
    "sourceVersion" in item &&
    typeof item.createdAt === "string" &&
    typeof item.id === "string" &&
    typeof item.kind === "string" &&
    typeof item.sourceVersion === "number"
      ? [{ createdAt: item.createdAt, id: item.id, kind: item.kind, sourceVersion: item.sourceVersion }]
      : [],
  )
}

const labels: Record<string, string> = {
  AUTO_CHECKPOINT: "Automatic checkpoint",
  BASELINE: "Initial protected version",
  DELETE_GUARD: "Deletion safety copy",
  MANUAL_SAVE: "Manual save",
  PUBLISH: "Published version",
  RESTORE: "Restored version",
}

export function PostHistoryPanel({
  canRestore,
  currentVersion,
  onOpenChange,
  open,
  postId,
}: {
  canRestore: boolean
  currentVersion: number
  onOpenChange: (open: boolean) => void
  open: boolean
  postId: string | null
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [revisions, setRevisions] = useState<RevisionSummary[]>([])

  useEffect(() => {
    if (!open || !postId) return
    let active = true
    queueMicrotask(() => {
      if (active) setIsLoading(true)
    })
    void fetch(`/api/posts/${postId}/revisions`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load revision history")
        return response.json() as Promise<unknown>
      })
      .then((value) => {
        if (active) setRevisions(readRevisions(value))
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not load revision history")
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, postId])

  async function restoreRevision(revisionId: string) {
    if (!postId) return
    setRestoringId(revisionId)
    try {
      const response = await fetch(`/api/posts/${postId}/revisions/${revisionId}/restore`, {
        body: JSON.stringify({ baseVersion: currentVersion }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
            ? result.error
            : "Could not restore this revision"
        throw new Error(message)
      }
      toast.success("Revision restored as a new draft version")
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not restore this revision")
      setRestoringId(null)
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Post history</SheetTitle>
          <SheetDescription>
            Protected versions are never overwritten when an older copy is restored.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {isLoading && <p className="text-sm text-text-secondary">Loading history...</p>}
          {!isLoading && revisions.length === 0 && (
            <p className="rounded-[8px] border border-dashed border-border-default p-4 text-sm text-text-secondary">
              No protected versions are available yet.
            </p>
          )}
          {revisions.map((revision) => (
            <article className="rounded-[10px] border border-border-default bg-subtle-bg/40 p-4" key={revision.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {labels[revision.kind] ?? revision.kind}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Version {revision.sourceVersion} · {new Date(revision.createdAt).toLocaleString()}
                  </p>
                </div>
                {canRestore && (
                  <Button
                    aria-label={`Restore version ${revision.sourceVersion}`}
                    disabled={restoringId !== null}
                    onClick={() => void restoreRevision(revision.id)}
                    size="icon"
                    title="Restore as a new draft version"
                    type="button"
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
