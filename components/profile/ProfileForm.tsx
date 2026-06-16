"use client"

import { FormEvent, useMemo, useState } from "react"
import { AvatarUpload } from "@/components/profile/AvatarUpload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TiptapEditor } from "@/components/editor/TiptapEditor"
import type { JSONContent } from "@tiptap/react"

interface ProfileFormProps {
  user: {
    avatarUrl: string | null
    bio: string | null
    email: string
    name: string
    username: string
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

  return "Đã xảy ra lỗi"
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "")
  const [bio, setBio] = useState(user.bio ?? "")
  const [message, setMessage] = useState<{
    text: string
    type: "error" | "success"
  } | null>(null)
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)

  const initialBioContent = useMemo(() => {
    if (user.bio?.startsWith("{")) {
      try {
        return JSON.parse(user.bio) as JSONContent
      } catch {}
    }
    if (user.bio) {
      return {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: user.bio }],
          },
        ],
      } as JSONContent
    }
    return undefined
  }, [user.bio])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setSaving(true)

    try {
      const response = await fetch("/api/profile", {
        body: JSON.stringify({
          avatarUrl: avatarUrl || null,
          bio,
          name,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setMessage({ text: "Cập nhật hồ sơ thành công.", type: "success" })
    } catch (saveError) {
      setMessage({
        text: saveError instanceof Error ? saveError.message : "Lưu hồ sơ thất bại",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {message && (
        <div
          className={
            message.type === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          }
          role="status"
        >
          {message.text}
        </div>
      )}

      <section className="rounded-[8px] border p-4 sm:p-5">
        <label className="mb-3 block text-sm font-medium">Ảnh đại diện</label>
        <AvatarUpload name={name} onChange={setAvatarUrl} value={avatarUrl} />
      </section>

      <div className="grid gap-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="profile-name">
            Tên hiển thị
          </label>
          <Input
            autoComplete="name"
            id="profile-name"
            maxLength={50}
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Giới thiệu</label>
          <div className="rounded-md border border-border bg-background shadow-sm overflow-hidden [&_.prose-editor]:min-h-[200px] [&_.prose-editor]:p-4 [&_.prose-editor]:!ml-0 [&_.prose-editor>p]:!ml-0">
            <TiptapEditor
              content={initialBioContent}
              onChange={(json) => setBio(JSON.stringify(json))}
              placeholder="Chia sẻ với độc giả về những chủ đề bạn viết."
              ariaLabel="Giới thiệu"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 border-t pt-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="profile-username">
            Tên người dùng
          </label>
          <Input
            disabled
            id="profile-username"
            readOnly
            value={`@${user.username}`}
          />
          <p className="text-xs text-muted-foreground">
            Đây là một phần của URL hồ sơ công khai của bạn.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="profile-email">
            Email
          </label>
          <Input disabled id="profile-email" readOnly value={user.email} />
          <p className="text-xs text-muted-foreground">
            Email được liên kết với tài khoản đăng nhập của bạn.
          </p>
        </div>
      </div>

      <Button className="w-full sm:w-auto" disabled={saving || !name.trim()}>
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </form>
  )
}
