"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface PendingInvite {
  createdAt: Date
  createdBy: { name: string }
  email: string
  expiresAt: Date
  id: string
}

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }
  return "Something went wrong"
}

export function PendingInvitesTable({ invites }: { invites: PendingInvite[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleRemove(invite: PendingInvite) {
    if (!confirm(`Remove pending invite for ${invite.email}?`)) {
      return
    }

    setDeletingId(invite.id)
    try {
      const response = await fetch(`/api/invite/${invite.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to remove invite")
    } finally {
      setDeletingId(null)
    }
  }

  if (invites.length === 0) {
    return (
      <div className="rounded-[24px] border-[2px] border-dashed border-border-default bg-subtle-bg/30 backdrop-blur-md p-5 text-sm text-text-tertiary shadow-sm">
        No pending invites.
      </div>
    )
  }

  return (
    <div>
      {invites.map((invite) => (
        <article className="group border-b border-border-default px-6 py-4 transition-colors last:border-0 hover:bg-accent/5" key={invite.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-text-primary">{invite.email}</p>
              <p className="mt-1 text-[11px] text-text-tertiary">
                Invited by {invite.createdBy.name} on {formatDate(invite.createdAt)}
              </p>
              <p className="mt-1 text-[11px] text-text-tertiary">
                Expires {formatDate(invite.expiresAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Pending</Badge>
              <Button
                aria-label="Remove invite"
                className="h-8 w-8 border border-transparent p-0 text-text-tertiary hover:border-border-default hover:bg-background hover:text-accent"
                disabled={deletingId === invite.id}
                onClick={() => void handleRemove(invite)}
                size="sm"
                title="Remove invite"
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
