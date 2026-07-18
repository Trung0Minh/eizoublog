"use client"

import type { FormEvent } from "react"
import { Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface BroadcastPost {
  id: string
  title: string
}

interface BroadcastResult {
  queued: number
  total: number
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

function getBroadcastResult(value: unknown): BroadcastResult | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "queued" in value.data &&
    "total" in value.data &&
    typeof value.data.queued === "number" &&
    typeof value.data.total === "number"
  ) {
    return { queued: value.data.queued, total: value.data.total }
  }

  return null
}

export function NewsletterBroadcastForm({
  recentPosts,
}: {
  recentPosts: BroadcastPost[]
}) {
  const router = useRouter()
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [postId, setPostId] = useState("")
  const [customBody, setCustomBody] = useState("")
  const [error, setError] = useState("")
  const [result, setResult] = useState<BroadcastResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setResult(null)

    const trimmedCustomBody = customBody.trim()
    if (!postId && !trimmedCustomBody) {
      setError("Select a featured post or write a custom message.")
      return
    }

    setConfirmOpen(true)
  }

  async function sendBroadcast() {
    const trimmedCustomBody = customBody.trim()
    const trimmedPreviewText = previewText.trim()
    const trimmedSubject = subject.trim()

    setLoading(true)
    try {
      const response = await fetch("/api/newsletter/broadcast", {
        body: JSON.stringify({
          customBody: trimmedCustomBody || undefined,
          postId: postId || undefined,
          previewText: trimmedPreviewText || undefined,
          subject: trimmedSubject,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const responseBody: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(responseBody))
      }

      const parsedResult = getBroadcastResult(responseBody)
      if (!parsedResult) {
        throw new Error("Invalid response")
      }

      setResult(parsedResult)
      setConfirmOpen(false)
      setSubject("")
      setPreviewText("")
      setPostId("")
      setCustomBody("")
      router.refresh()
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Failed to send broadcast",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {result && (
        <div className="rounded-[16px] border border-emerald-500/20 bg-emerald-500/10 p-4 text-[14px] font-medium text-emerald-700 dark:text-emerald-400" role="status">
          Queued for {result.queued} of {result.total} subscribers
        </div>
      )}
      {error && (
        <div className="rounded-[16px] border border-destructive/20 bg-destructive/10 p-4 text-[14px] font-medium text-destructive" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-[14px] font-bold text-text-primary" htmlFor="broadcast-subject">
            Subject
          </label>
          <Input
            id="broadcast-subject"
            maxLength={200}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="New essay from the blog"
            required
            value={subject}
            className="h-11 rounded-[12px] border-[2px] border-border-default bg-subtle-bg/30 text-[14px] font-medium outline-none transition-all focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[14px] font-bold text-text-primary" htmlFor="broadcast-preview">
            Preview text
          </label>
          <Input
            id="broadcast-preview"
            maxLength={200}
            onChange={(event) => setPreviewText(event.target.value)}
            placeholder="Optional inbox preview"
            value={previewText}
            className="h-11 rounded-[12px] border-[2px] border-border-default bg-subtle-bg/30 text-[14px] font-medium outline-none transition-all focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[14px] font-bold text-text-primary" htmlFor="broadcast-post">
            Featured post
          </label>
          <div className="relative">
            <select
              className="h-11 w-full appearance-none rounded-[12px] border-[2px] border-border-default bg-subtle-bg/30 px-3 py-2 pr-10 text-[14px] font-medium outline-none transition-all focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20"
              id="broadcast-post"
              onChange={(event) => setPostId(event.target.value)}
              value={postId}
            >
              <option value="">No featured post</option>
              {recentPosts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[14px] font-bold text-text-primary" htmlFor="broadcast-body">
          Custom message
        </label>
        <Textarea
          id="broadcast-body"
          maxLength={5000}
          onChange={(event) => setCustomBody(event.target.value)}
          placeholder="Write a personal note, or select a featured post above."
          rows={7}
          value={customBody}
          className="rounded-[16px] border-[2px] border-border-default bg-subtle-bg/30 p-4 text-[14px] font-medium outline-none transition-all focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <Button className="h-11 rounded-full bg-accent px-6 text-[14px] font-bold text-white shadow-md shadow-accent/20 transition-all hover:scale-105 hover:shadow-accent/40 w-full sm:w-auto" disabled={loading || !subject.trim()} type="submit">
        {loading ? "Sending..." : "Send broadcast"}
      </Button>
      <ConfirmationDialog
        cancelLabel="Review message"
        confirmLabel="Send newsletter"
        description={
          <>
            Send <strong className="text-text-primary">{subject.trim()}</strong> to every active subscriber. Once delivery is queued, it cannot be recalled.
          </>
        }
        icon={Send}
        onConfirm={() => void sendBroadcast()}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        pending={loading}
        title="Send newsletter now?"
        tone="default"
      />
    </form>
  )
}
