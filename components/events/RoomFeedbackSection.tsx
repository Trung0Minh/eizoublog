"use client"

import { useState } from "react"
import { AlertCircle, Loader2, Lock, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RelativeTime } from "@/components/ui/RelativeTime"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface CommentAuthor {
  name: string
  username: string
}

interface Comment {
  id: string
  content: string
  isPrivate: boolean
  createdAt: string | Date
  author: CommentAuthor
}

interface RoomFeedbackSectionProps {
  eventId: string
  roomId: string
  initialComments: Comment[]
}

export function RoomFeedbackSection({
  eventId,
  roomId,
  initialComments,
}: RoomFeedbackSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentContent, setCommentContent] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!commentContent.trim()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/rooms/${roomId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentContent.trim(),
          isPrivate,
        }),
      })

      const result = (await response.json()) as { data?: Comment; error?: string }

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit comment.")
      }

      if (result.data) {
        setComments((prev) => [...prev, result.data as Comment])
      }
      setCommentContent("")
      setIsPrivate(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred while posting feedback.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border-t border-border-default pt-8 mt-12 space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-accent" />
        <h3 className="font-bold text-text-primary text-lg">Feedback & Comments</h3>
      </div>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-text-tertiary italic">
            No feedback yet. Be the first to leave a comment!
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-[8px] border border-border-default bg-background p-4 space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                      {comment.author.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary text-sm">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-text-tertiary ml-2">
                        @{comment.author.username}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {comment.isPrivate && (
                      <Badge
                        className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1"
                        variant="outline"
                      >
                        <Lock className="h-2.5 w-2.5" />
                        🔒 Private Feedback
                      </Badge>
                    )}
                    <RelativeTime
                      className="text-xs text-text-tertiary"
                      date={comment.createdAt}
                    />
                  </div>
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleCommentSubmit}
        className="space-y-4 border-t border-border-default pt-4"
      >
        {submitError && (
          <div className="rounded-[6px] border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="comment-content"
            className="text-xs font-bold uppercase tracking-wider text-text-secondary"
          >
            Leave your feedback
          </label>
          <Textarea
            id="comment-content"
            placeholder="Write your constructive feedback, critiques, or thoughts..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            maxLength={2000}
            className="min-h-[100px] text-sm bg-background border-border-default focus:border-accent"
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-[var(--accent)] cursor-pointer"
            />
            Make this feedback private to the author
          </label>

          <Button
            type="submit"
            disabled={isSubmitting || !commentContent.trim()}
            size="sm"
            className="px-4 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit feedback"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
