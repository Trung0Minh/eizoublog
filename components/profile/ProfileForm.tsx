"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AvatarUpload } from "@/components/profile/AvatarUpload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { TiptapEditor } from "@/components/editor/TiptapEditor"
import type { JSONContent } from "@tiptap/react"
import type { Role } from "@prisma/client"
import { clearSessionUserCache } from "@/lib/clientSession"
import { DisplayRoleSettings } from "@/components/profile/DisplayRoleSettings"
import { RoleBadges } from "@/components/profile/RoleBadges"

interface ProfileFormProps {
  user: {
    avatarOriginalUrl: string | null
    avatarUrl: string | null
    bio: string | null
    displayRoleColor: string | null
    displayRoleLocked: boolean
    displayRoleName: string | null
    email: string
    name: string
    role: Role
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
  const router = useRouter()
  const [avatarOriginalUrl, setAvatarOriginalUrl] = useState(
    user.avatarOriginalUrl ?? "",
  )
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "")
  const [bio, setBio] = useState(user.bio ?? "")
  const [message, setMessage] = useState<{
    text: string
    type: "error" | "success"
  } | null>(null)
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username)
  const [saving, setSaving] = useState(false)
  const [displayRolePreview, setDisplayRolePreview] = useState({
    color: user.displayRoleColor,
    name: user.displayRoleName,
  })

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
          avatarOriginalUrl: avatarOriginalUrl || null,
          avatarUrl: avatarUrl || null,
          bio,
          name,
          username,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setMessage({ text: "Cập nhật hồ sơ thành công.", type: "success" })
      clearSessionUserCache()
      router.refresh()
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

      <ScrollReveal delay={0.1}>
        <section className="rounded-[24px] border-[2px] border-border-default bg-background/80 backdrop-blur-md p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
          <label className="mb-3 block text-sm font-medium">Ảnh đại diện</label>
          <AvatarUpload
            badge={
              user.role === "ADMIN" || user.role === "WRITER" ? (
                <RoleBadges
                  badgeClassName="rounded-md px-2 text-[11px]"
                  displayRoleColor={displayRolePreview.color}
                  displayRoleName={displayRolePreview.name}
                  role={user.role}
                />
              ) : undefined
            }
            bio={bio}
            name={name}
            onChange={setAvatarUrl}
            onOriginalChange={setAvatarOriginalUrl}
            originalValue={avatarOriginalUrl}
            value={avatarUrl}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <div className="grid gap-5 rounded-[24px] border-[2px] border-border-default bg-background/80 backdrop-blur-md p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-username">
              Tên người dùng
            </label>
            <Input
              id="profile-username"
              maxLength={30}
              minLength={3}
              pattern="^@?[a-zA-Z0-9_]+$"
              onChange={(event) => setUsername(event.target.value.replace(/^@/, ''))}
              required
              value={username ? `@${username}` : ""}
              className="rounded-[12px] border-[2px] border-border-default focus-visible:border-accent focus-visible:ring-accent"
            />
            <p className="text-xs text-muted-foreground">
              Đây là một phần của URL hồ sơ công khai của bạn.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="profile-email">
              Email
            </label>
            <Input disabled id="profile-email" readOnly value={user.email} className="rounded-[12px] border-[2px] border-border-default bg-muted/50 cursor-not-allowed opacity-70" />
            <p className="text-xs text-muted-foreground">
              Email được liên kết với tài khoản đăng nhập của bạn.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {(user.role === "ADMIN" || user.role === "WRITER") && (
        <ScrollReveal delay={0.3}>
          <DisplayRoleSettings
            displayRoleColor={user.displayRoleColor}
            displayRoleLocked={user.displayRoleLocked}
            displayRoleName={user.displayRoleName}
            onPreviewChange={setDisplayRolePreview}
            role={user.role}
          />
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.4}>
        <div className="grid gap-5 rounded-[24px] border-[2px] border-border-default bg-background/80 backdrop-blur-md p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
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
              className="rounded-[12px] border-[2px] border-border-default focus-visible:border-accent focus-visible:ring-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Giới thiệu</label>
            <div className="rounded-[16px] border-[2px] border-border-default bg-background shadow-sm overflow-hidden [&_.prose-editor]:min-h-[200px] [&_.prose-editor]:p-4 [&_.prose-editor]:!ml-0 [&_.prose-editor>p]:!ml-0 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
              <TiptapEditor
                content={initialBioContent}
                onChange={(json) => setBio(JSON.stringify(json))}
                placeholder="Chia sẻ với độc giả về những chủ đề bạn viết."
                ariaLabel="Giới thiệu"
                mode="profile"
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      <Button className="w-full sm:w-auto rounded-full bg-accent text-white hover:bg-accent/90" disabled={saving || !name.trim()}>
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </form>
  )
}
