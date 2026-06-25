"use client"

import type { FormEvent } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
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
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [postId, setPostId] = useState("")
  const [customBody, setCustomBody] = useState("")
  const [error, setError] = useState("")
  const [result, setResult] = useState<BroadcastResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setResult(null)

    const trimmedCustomBody = customBody.trim()
    const trimmedPreviewText = previewText.trim()
    const trimmedSubject = subject.trim()

    if (!postId && !trimmedCustomBody) {
      setError("Select a featured post or write a custom message.")
      return
    }

    if (!confirm("Send this newsletter to all active subscribers?")) return

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
      setSubject("")
      setPreviewText("")
      setPostId("")
      setCustomBody("")
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
    <form className="space-y-5" onSubmit={handleSubmit}>
      {result && (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          Queued for {result.queued} of {result.total} subscribers
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="broadcast-subject">
          Subject
        </label>
        <Input
          id="broadcast-subject"
          maxLength={200}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="New essay from the blog"
          required
          value={subject}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="broadcast-preview">
          Preview text
        </label>
        <Input
          id="broadcast-preview"
          maxLength={200}
          onChange={(event) => setPreviewText(event.target.value)}
          placeholder="Optional inbox preview"
          value={previewText}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="broadcast-post">
          Featured post
        </label>
        <select
          className="flex h-10 w-full rounded-[5px] border border-border-default bg-background px-3 py-2 text-[13px] ring-offset-background focus-visible:border-accent focus-visible:outline-none"
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
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-medium text-text-primary" htmlFor="broadcast-body">
          Custom message
        </label>
        <Textarea
          id="broadcast-body"
          maxLength={5000}
          onChange={(event) => setCustomBody(event.target.value)}
          placeholder="Write a personal note, or select a featured post above."
          rows={7}
          value={customBody}
        />
      </div>

      <Button className="h-9 px-4 font-semibold" disabled={loading || !subject.trim()} type="submit">
        {loading ? "Sending..." : "Send broadcast"}
      </Button>
    </form>
  )
}
