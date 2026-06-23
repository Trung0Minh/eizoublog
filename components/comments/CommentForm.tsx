"use client"

import { useId, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { trackEvent } from "@/lib/analytics"
import type { CommentWithReplies, PublicComment } from "@/types"

interface CommentFormProps {
  ariaLabel?: string
  onCancel?: () => void
  onSuccess: (comment: CommentWithReplies) => void
  parentId?: string
  postId: string
  postSlug?: string
  isAuthenticated?: boolean
}

interface CommentResponse {
  data?: PublicComment
  error?: string
}

export function CommentForm({
  ariaLabel = "Comment form",
  onSuccess,
  parentId,
  postId,
  postSlug,
  isAuthenticated,
}: CommentFormProps) {
  const id = useId()
  const [authorEmail, setAuthorEmail] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notifyReply, setNotifyReply] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/comments", {
        body: JSON.stringify({
          authorEmail,
          authorName,
          content,
          notifyReply,
          parentId,
          postId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result = (await response.json()) as CommentResponse

      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Không thể đăng bình luận")
      }

      onSuccess({ ...result.data, replies: [] })
      if (postSlug) {
        trackEvent("comment_submitted", { postSlug })
      }
      setAuthorEmail("")
      setAuthorName("")
      setContent("")
      setNotifyReply(true)
      setSuccessMessage(parentId ? "Đã đăng trả lời." : "Đã đăng bình luận.")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể đăng bình luận",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      aria-label={ariaLabel}
      className="font-sans"
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-[5px] bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="rounded-[5px] bg-subtle-bg px-3 py-2 text-sm text-text-primary">
            {successMessage}
          </p>
        )}

        {!isAuthenticated && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-[13px] font-medium text-text-primary"
                htmlFor={`${id}-comment-name`}
              >
                Tên *
              </label>
              <Input
                autoComplete="name"
                id={`${id}-comment-name`}
                maxLength={80}
                onChange={(event) => setAuthorName(event.target.value)}
                required
                value={authorName}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-[13px] font-medium text-text-primary"
                htmlFor={`${id}-comment-email`}
              >
                Email *
              </label>
              <Input
                autoComplete="email"
                id={`${id}-comment-email`}
                inputMode="email"
                onChange={(event) => setAuthorEmail(event.target.value)}
                required
                type="email"
                value={authorEmail}
              />
              <p className="text-[11px] text-text-tertiary">
                Không hiển thị công khai
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
            <label
            className="text-[13px] font-medium text-text-primary"
            htmlFor={`${id}-comment-content`}
          >
            Bình luận *
          </label>
          <Textarea
            id={`${id}-comment-content`}
            maxLength={2000}
            minLength={1}
            onChange={(event) => setContent(event.target.value)}
            required
            rows={3}
            value={content}
          />
        </div>

        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-2 text-[13px] text-text-secondary">
            <input
              checked={notifyReply}
              className="h-4 w-4 rounded border-border-strong accent-[var(--accent)]"
              onChange={(event) => setNotifyReply(event.target.checked)}
              type="checkbox"
            />
            Thông báo cho tôi qua email khi có người trả lời
          </label>

          <Button
            className="h-[38px] self-end px-5 font-semibold md:ml-auto"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Đang đăng..."
              : parentId
                ? "Đăng trả lời"
                : "Đăng bình luận"}
          </Button>
        </div>
      </div>
    </form>
  )
}
