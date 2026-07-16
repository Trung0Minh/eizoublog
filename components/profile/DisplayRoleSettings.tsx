"use client"

import { useState } from "react"
import { LockKeyhole, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"

import { DisplayRoleBadge } from "@/components/profile/DisplayRoleBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DEFAULT_DISPLAY_ROLE_COLOR,
  DEFAULT_DISPLAY_ROLE_NAME,
  displayRoleSchema,
} from "@/lib/displayRole"

interface DisplayRoleSettingsProps {
  displayRoleColor: string | null
  displayRoleLocked: boolean
  displayRoleName: string | null
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

  return "Không thể lưu vai trò hiển thị"
}

export function DisplayRoleSettings({
  displayRoleColor,
  displayRoleLocked,
  displayRoleName,
}: DisplayRoleSettingsProps) {
  const router = useRouter()
  const [color, setColor] = useState(
    displayRoleColor ?? DEFAULT_DISPLAY_ROLE_COLOR,
  )
  const [message, setMessage] = useState<{
    text: string
    type: "error" | "success"
  } | null>(null)
  const [name, setName] = useState(
    displayRoleName ?? DEFAULT_DISPLAY_ROLE_NAME,
  )
  const [saving, setSaving] = useState(false)

  async function saveDisplayRole() {
    setMessage(null)

    const parsed = displayRoleSchema.safeParse({
      displayRoleColor: color,
      displayRoleName: name,
    })

    if (!parsed.success) {
      setMessage({
        text: "Vai trò phải dài 2–24 ký tự, dùng chữ/số thông thường và không được giống vai trò quản trị.",
        type: "error",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/profile/display-role", {
        body: JSON.stringify(parsed.data),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setColor(parsed.data.displayRoleColor)
      setName(parsed.data.displayRoleName)
      setMessage({ text: "Đã lưu vai trò hiển thị.", type: "success" })
      router.refresh()
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Không thể lưu vai trò hiển thị",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  function resetDraft() {
    setColor(DEFAULT_DISPLAY_ROLE_COLOR)
    setName(DEFAULT_DISPLAY_ROLE_NAME)
    setMessage(null)
  }

  return (
    <section className="rounded-[24px] border-[2px] border-border-default bg-background/80 p-6 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Vai trò hiển thị
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Đây là huy hiệu công khai, không thay đổi quyền truy cập của bạn.
          </p>
        </div>
        <DisplayRoleBadge
          className="self-start px-3 py-1 text-[11px]"
          displayRoleColor={color}
          displayRoleName={name}
        />
      </div>

      <fieldset className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_116px]" disabled={displayRoleLocked || saving}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="display-role-name">
            Vai trò hiển thị
          </label>
          <Input
            id="display-role-name"
            maxLength={24}
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void saveDisplayRole()
              }
            }}
            value={name}
          />
          <p className="text-xs text-muted-foreground">
            2–24 ký tự. Không dùng tên dành cho quản trị viên hoặc nhân viên.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="display-role-color">
            Màu vai trò
          </label>
          <div className="flex h-10 items-center gap-2 rounded-[5px] border border-border-default bg-background px-2">
            <input
              aria-label="Màu vai trò"
              className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
              id="display-role-color"
              onChange={(event) => setColor(event.target.value.toUpperCase())}
              type="color"
              value={color}
            />
            <span className="font-mono text-xs text-text-secondary">{color}</span>
          </div>
        </div>
      </fieldset>

      {displayRoleLocked && (
        <p className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
          <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />
          Vai trò này đã được khóa bởi quản trị viên.
        </p>
      )}

      {message && (
        <p
          className={
            message.type === "success"
              ? "mt-4 text-sm text-emerald-700 dark:text-emerald-300"
              : "mt-4 text-sm text-destructive"
          }
          role={message.type === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          disabled={displayRoleLocked || saving}
          onClick={resetDraft}
          type="button"
          variant="outline"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Đặt lại Writer
        </Button>
        <Button
          disabled={displayRoleLocked || saving}
          onClick={() => void saveDisplayRole()}
          type="button"
        >
          {saving ? "Đang lưu..." : "Lưu vai trò"}
        </Button>
      </div>
    </section>
  )
}
