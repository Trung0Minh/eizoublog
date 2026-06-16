"use client"

import type { Role } from "@prisma/client"
import { Mail, MoreHorizontal, ShieldOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

interface Writer {
  _count: { posts: number }
  createdAt: Date
  email: string
  id: string
  name: string
  role: Role
  username: string
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

export function WritersTable({ writers }: { writers: Writer[] }) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleRemove(writer: Writer) {
    if (
      !confirm(
        `Remove writer access for ${writer.name}? Their published attribution will remain.`,
      )
    ) {
      return
    }

    setRemovingId(writer.id)
    try {
      const response = await fetch(`/api/admin/writers/${writer.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to remove writer")
    } finally {
      setRemovingId(null)
    }
  }

  if (writers.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed p-8 text-center text-sm text-muted-foreground">
        No active writers found.
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-[8px] border border-border-default bg-background">
      <div className="min-w-[700px]">
        <div className="flex h-[40px] items-center border-b border-border-default bg-subtle-bg px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
          <div className="min-w-0 flex-1 pr-4">Name</div>
          <div className="w-[120px] shrink-0">Role</div>
          <div className="w-[100px] shrink-0 text-right">Posts</div>
          <div className="w-[120px] shrink-0 text-right">Status</div>
          <div className="w-[96px] shrink-0 pr-2 text-right">Actions</div>
        </div>

        <div className="flex flex-col">
          {writers.map((writer, index) => {
            const colors = [
              "#0d9488",
              "#c2410c",
              "#475569",
              "#7e22ce",
              "#9f1239",
              "#15803d",
            ]
            const role =
              writer.role === "ADMIN"
                ? "Admin"
                : writer.role === "REVOKED"
                  ? "Revoked"
                  : "Writer"

            return (
              <div
                className="group flex h-[56px] items-center border-b border-border-default px-4 transition-colors last:border-0 hover:bg-subtle-bg"
                key={writer.id}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 pr-4">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  >
                    {writer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-text-primary">
                      {writer.name}
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-text-tertiary">
                      {writer.email}
                    </div>
                  </div>
                </div>

                <div className="w-[120px] shrink-0">
                  <span className="inline-flex items-center rounded-[4px] border border-border-default bg-subtle-bg px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                    {role}
                  </span>
                </div>

                <div className="w-[100px] shrink-0 text-right text-[13px] font-medium text-text-secondary">
                  {writer._count.posts}
                </div>

                <div className="w-[120px] shrink-0 text-right text-[12px] text-[#15803d] dark:text-[#4ade80]">
                  Active
                </div>

                <div className="flex w-[96px] shrink-0 items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <Button
                    asChild
                    className="h-8 w-8 border border-transparent p-0 text-text-tertiary hover:border-border-default hover:bg-background"
                    size="sm"
                    title="Email writer"
                    variant="ghost"
                  >
                    <a href={`mailto:${writer.email}`}>
                      <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    aria-label={`Remove writer access for ${writer.name}`}
                    className="h-8 w-8 border border-transparent p-0 text-text-tertiary hover:border-border-default hover:bg-background hover:text-accent"
                    disabled={removingId === writer.id}
                    onClick={() => void handleRemove(writer)}
                    size="sm"
                    title="Remove access"
                    type="button"
                    variant="ghost"
                  >
                    <ShieldOff aria-hidden="true" className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    aria-label="More options"
                    className="h-8 w-8 border border-transparent p-0 text-text-tertiary hover:border-border-default hover:bg-background"
                    size="sm"
                    title="More options"
                    type="button"
                    variant="ghost"
                  >
                    <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
