"use client"

import type { Role } from "@prisma/client"
import { ExternalLink, Mail, Palette, ShieldOff, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { toast } from "sonner"

import { InviteWriterForm } from "@/components/admin/InviteWriterForm"
import { AdminDisplayRoleDialog } from "@/components/admin/AdminDisplayRoleDialog"
import { DisplayRoleBadge } from "@/components/profile/DisplayRoleBadge"

import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"

interface Writer {
  _count: { posts: number }
  createdAt: Date
  displayRoleColor: string | null
  displayRoleLocked: boolean
  displayRoleName: string | null
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
  const [searchTerm, setSearchTerm] = useState("")
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Writer | null>(null)
  const [roleTarget, setRoleTarget] = useState<Writer | null>(null)

  const filteredWriters = useMemo(() => {
    if (!searchTerm) return writers
    const lower = searchTerm.toLowerCase()
    return writers.filter(
      (w) => w.name.toLowerCase().includes(lower) || w.email.toLowerCase().includes(lower)
    )
  }, [writers, searchTerm])

  async function handleRemove(writer: Writer) {
    setRemovingId(writer.id)
    try {
      const response = await fetch(`/api/admin/writers/${writer.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setRemoveTarget(null)
      toast.success("Writer access removed", { description: writer.name })
      router.refresh()
    } catch (error) {
      toast.error("Failed to remove writer", {
        description: error instanceof Error ? error.message : writer.name,
      })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-[280px]">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          />
          <input
            className="h-10 w-full rounded-full border border-border-default bg-subtle-bg/30 pl-9 pr-4 text-[13px] outline-none transition-all placeholder:text-text-tertiary focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20"
            placeholder="Search writers by name or email..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setIsInviteModalOpen(true)}
          className="h-10 rounded-full bg-accent px-5 font-semibold text-white shadow-md shadow-accent/20 transition-all hover:scale-105 hover:shadow-accent/40"
        >
          Invite Writer
        </Button>
      </div>

      {/* Writers List */}
      <div className="flex flex-col gap-3">
        {filteredWriters.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-border-default/50 bg-subtle-bg/20 p-12 text-center text-[14px] text-text-tertiary">
            No writers found matching your search.
          </div>
        ) : (
          filteredWriters.map((writer, index) => {
            const colors = [
              "#0d9488", "#c2410c", "#475569", "#7e22ce", "#9f1239", "#15803d",
            ]
            const role = writer.role === "ADMIN" ? "Admin" : writer.role === "REVOKED" ? "Revoked" : "Writer"

            return (
              <article
                className="group flex flex-col gap-4 rounded-[20px] border border-transparent bg-subtle-bg/40 p-5 transition-all duration-300 hover:border-accent/30 hover:bg-white/60 hover:shadow-md dark:hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                key={writer.id}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  >
                    {writer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-[16px] font-bold text-text-primary">
                        {writer.name}
                      </h3>
                      {writer.role === "WRITER" ? (
                        <DisplayRoleBadge
                          displayRoleColor={writer.displayRoleColor}
                          displayRoleName={writer.displayRoleName}
                        />
                      ) : (
                        <span className="rounded-full border border-border-default/60 bg-background/50 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-text-secondary shadow-sm">
                          {role}
                        </span>
                      )}
                      {writer.role !== "REVOKED" && (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-emerald-600 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[13px] font-medium text-text-secondary">
                      {writer.email}
                      <span className="mx-2 text-text-tertiary">·</span>
                      {writer._count.posts} posts published
                    </p>
                  </div>
                </div>

                <div className="flex w-fit shrink-0 self-start items-center gap-1.5 rounded-[16px] border border-border-default/50 bg-background/50 p-1.5 shadow-sm backdrop-blur-sm transition-all group-hover:border-accent/30 group-hover:bg-background/80 sm:self-auto">
                  <Button
                    asChild
                    className="h-9 w-9 rounded-[12px] text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
                    size="icon"
                    title="Email writer"
                    variant="ghost"
                  >
                    <a href={`mailto:${writer.email}`}>
                      <Mail aria-hidden="true" className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    aria-label={`Manage display role for ${writer.name}`}
                    className="h-9 w-9 rounded-[12px] text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
                    onClick={() => setRoleTarget(writer)}
                    size="icon"
                    title="Manage display role"
                    type="button"
                    variant="ghost"
                  >
                    <Palette aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label={`Remove writer access for ${writer.name}`}
                    className="h-9 w-9 rounded-[12px] text-text-secondary hover:bg-destructive/10 hover:text-destructive"
                    disabled={removingId === writer.id}
                    onClick={() => setRemoveTarget(writer)}
                    size="icon"
                    title="Remove access"
                    type="button"
                    variant="ghost"
                  >
                    <ShieldOff aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <div className="h-5 w-px bg-border-default/50 mx-1"></div>
                  <Button
                    asChild
                    aria-label={`View public profile for ${writer.name}`}
                    className="h-9 w-9 rounded-[12px] text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
                    size="icon"
                    title="View public profile"
                    variant="ghost"
                  >
                    <a href={`/authors/${writer.username}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsInviteModalOpen(false)}
          />
          <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="overflow-hidden rounded-[24px] border-[2px] border-border-default bg-background p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-text-primary">Invite a writer</h2>
                  <p className="mt-1 text-[14px] text-text-secondary">Send an invite link to create a writer account.</p>
                </div>
                <Button
                  onClick={() => setIsInviteModalOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full hover:bg-subtle-bg"
                >
                  <X className="h-4 w-4 text-text-secondary" />
                </Button>
              </div>
              <InviteWriterForm />
            </div>
          </div>
        </div>
      )}
      <ConfirmationDialog
        cancelLabel="Keep access"
        confirmLabel="Remove writer access"
        description={
          removeTarget ? (
            <>
              <strong className="text-text-primary">{removeTarget.name}</strong> will lose writer access and can no longer edit posts. Existing published attribution will remain.
            </>
          ) : null
        }
        icon={ShieldOff}
        onConfirm={() => removeTarget && void handleRemove(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        open={removeTarget !== null}
        pending={removingId !== null}
        title="Remove writer access?"
        tone="destructive"
      />
      {roleTarget && (
        <AdminDisplayRoleDialog
          onClose={() => setRoleTarget(null)}
          onSaved={() => {
            setRoleTarget(null)
            router.refresh()
          }}
          writer={roleTarget}
        />
      )}
    </div>
  )
}
