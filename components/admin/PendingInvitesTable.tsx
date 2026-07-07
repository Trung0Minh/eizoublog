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
      <div className="rounded-[24px] border-[2px] border-dashed border-border-default bg-subtle-bg/30 backdrop-blur-md p-8 text-center text-[13px] text-text-tertiary shadow-sm">
        No pending invites.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {invites.map((invite, index) => (
        <article
          className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[20px] border border-transparent bg-subtle-bg/40 p-5 transition-all duration-300 hover:border-accent/30 hover:bg-white/60 hover:shadow-md dark:hover:bg-white/10 animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
          key={invite.id}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-bold text-text-primary">{invite.email}</p>
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Pending
              </Badge>
            </div>
            <p className="mt-1.5 text-[13px] font-medium text-text-secondary">
              Invited by <span className="text-text-primary font-bold">{invite.createdBy.name}</span> on {formatDate(invite.createdAt)}
            </p>
            <p className="mt-1 text-[12px] font-medium text-text-tertiary">
              Expires {formatDate(invite.expiresAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-[16px] border border-border-default/50 bg-background/50 p-1.5 shadow-sm backdrop-blur-sm transition-all group-hover:border-accent/30 group-hover:bg-background/80">
            <Button
              aria-label="Remove invite"
              className="h-9 w-9 rounded-[12px] text-text-secondary hover:bg-destructive/10 hover:text-destructive"
              disabled={deletingId === invite.id}
              onClick={() => void handleRemove(invite)}
              size="icon"
              title="Remove invite"
              type="button"
              variant="ghost"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}
