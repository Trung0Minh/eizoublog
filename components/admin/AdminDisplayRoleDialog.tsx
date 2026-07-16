"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { DisplayRoleBadge } from "@/components/profile/DisplayRoleBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DEFAULT_DISPLAY_ROLE_COLOR,
  DEFAULT_DISPLAY_ROLE_NAME,
  displayRoleSchema,
} from "@/lib/displayRole"

interface AdminDisplayRoleDialogProps {
  onClose: () => void
  onSaved: () => void
  writer: {
    displayRoleColor: string | null
    displayRoleLocked: boolean
    displayRoleName: string | null
    id: string
    name: string
  }
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

  return "Unable to save display role"
}

export function AdminDisplayRoleDialog({
  onClose,
  onSaved,
  writer,
}: AdminDisplayRoleDialogProps) {
  const [color, setColor] = useState(
    writer.displayRoleColor ?? DEFAULT_DISPLAY_ROLE_COLOR,
  )
  const [locked, setLocked] = useState(writer.displayRoleLocked)
  const [name, setName] = useState(
    writer.displayRoleName ?? DEFAULT_DISPLAY_ROLE_NAME,
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function persistRole(data: {
    displayRoleColor: string | null
    displayRoleLocked: boolean
    displayRoleName: string | null
  }) {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/writers/${writer.id}`, {
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      onSaved()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save display role")
    } finally {
      setSaving(false)
    }
  }

  async function save() {
    setError(null)
    const parsed = displayRoleSchema.safeParse({
      displayRoleColor: color,
      displayRoleName: name,
    })

    if (!parsed.success) {
      setError("Use 2–24 characters and do not use a reserved authority title.")
      return
    }

    await persistRole({ ...parsed.data, displayRoleLocked: locked })
  }

  async function reset() {
    setError(null)
    await persistRole({
      displayRoleColor: null,
      displayRoleLocked: locked,
      displayRoleName: null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Close display role dialog"
        className="absolute inset-0 cursor-default bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="display-role-dialog-title"
        className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="overflow-hidden rounded-[24px] border-[2px] border-border-default bg-background p-6 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-bold text-text-primary" id="display-role-dialog-title">
                Manage display role
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Set the public badge shown for {writer.name}.
              </p>
            </div>
            <Button
              aria-label="Close display role dialog"
              className="h-8 w-8 shrink-0 rounded-full"
              onClick={onClose}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-[16px] border border-border-default bg-subtle-bg/30 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-tertiary">
              Preview
            </span>
            <DisplayRoleBadge
              className="px-3 py-1 text-[11px]"
              displayRoleColor={color}
              displayRoleName={name}
            />
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`display-role-${writer.id}`}>
                Display role for {writer.name}
              </label>
              <Input
                id={`display-role-${writer.id}`}
                maxLength={24}
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`role-color-${writer.id}`}>
                Role color for {writer.name}
              </label>
              <div className="flex h-10 items-center gap-2 rounded-[5px] border border-border-default bg-background px-2">
                <input
                  aria-label={`Role color for ${writer.name}`}
                  className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                  id={`role-color-${writer.id}`}
                  onChange={(event) => setColor(event.target.value.toUpperCase())}
                  type="color"
                  value={color}
                />
                <span className="font-mono text-xs text-text-secondary">{color}</span>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-border-default p-3 text-sm">
              <input
                aria-label={`Lock role for ${writer.name}`}
                checked={locked}
                className="mt-0.5 h-4 w-4 accent-accent"
                onChange={(event) => setLocked(event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="block font-medium text-text-primary">Lock this role</span>
                <span className="mt-0.5 block text-xs text-text-secondary">
                  The writer can still edit their profile, but not this badge.
                </span>
              </span>
            </label>
          </div>

          {error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={saving}
              onClick={() => void reset()}
              type="button"
              variant="outline"
            >
              Reset to Writer
            </Button>
            <Button disabled={saving} onClick={() => void save()} type="button">
              {saving ? "Saving..." : "Save role"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
