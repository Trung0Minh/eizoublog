"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Loader2, Lock, MessageSquare } from "lucide-react"
import type { JSONContent } from "@tiptap/react"

import { StaticPostContent } from "@/components/posts/StaticPostContent"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDate } from "@/lib/utils"

interface RoomDetailDrawerProps {
  eventId: string
  roomId: string
  postId: string | null
  writerName: string
  writerIntro: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PostDetail {
  id: string
  title: string
  content: JSONContent
  coverUrl: string | null
}

interface CommentAuthor {
  name: string
  username: string
}

interface Comment {
  id: string
  content: string
  isPrivate: boolean
  createdAt: string
  author: CommentAuthor
}

export function RoomDetailDrawer({
  eventId,
  roomId,
  postId,
  writerName,
  writerIntro,
  open,
  onOpenChange,
}: RoomDetailDrawerProps) {
  const [post, setPost] = useState<PostDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [commentContent, setCommentContent] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [prevPostId, setPrevPostId] = useState<string | null>(null)
  const [prevOpen, setPrevOpen] = useState(false)

  // Adjust state during render when props change to avoid synchronous useEffect updates
  if (postId !== prevPostId) {
    setPrevPostId(postId)
    setPost(null)
    setComments([])
    setError(null)
  }

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setCommentContent("")
      setIsPrivate(false)
      setSubmitError(null)
    }
  }

  useEffect(() => {
    if (!open || !postId) return

    let isMounted = true

    async function loadData() {
      setIsLoading(true)
      setError(null)
      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/posts/${postId}`),
          fetch(`/api/events/${eventId}/rooms/${roomId}/comments`),
        ])

        if (!postRes.ok) {
          const postErr = (await postRes.json().catch(() => ({}))) as { error?: string }
          throw new Error(postErr.error || "Failed to fetch post details.")
        }

        if (!commentsRes.ok) {
          const commentsErr = (await commentsRes.json().catch(() => ({}))) as { error?: string }
          throw new Error(commentsErr.error || "Failed to fetch comments.")
        }

        const postJson = (await postRes.json()) as { data: PostDetail }
        const commentsJson = (await commentsRes.json()) as { data: { comments: Comment[] } }

        if (isMounted) {
          setPost(postJson.data)
          setComments(commentsJson.data.comments || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An error occurred while loading data.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [open, eventId, roomId, postId])

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex h-full w-full flex-col bg-background border-l border-border-default px-6 py-6 sm:max-w-2xl"
        side="right"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-bold tracking-tight text-text-primary">
            Room Details: {writerName}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Details of writer&apos;s event room submission, entry draft, and private or participant feedback.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {writerIntro && (
            <div className="border-l-2 border-accent pl-4 py-1">
              <blockquote className="text-sm italic text-text-secondary leading-relaxed">
                &ldquo;{writerIntro}&rdquo;
              </blockquote>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="text-sm text-text-secondary">Loading details...</span>
            </div>
          ) : error ? (
            <div className="rounded-[8px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Failed to load room details</h4>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          ) : !postId ? (
            <div className="rounded-[8px] border border-dashed border-border-default p-8 text-center text-sm text-text-secondary">
              No post has been selected for submission yet.
            </div>
          ) : post ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-text-primary leading-snug">
                  {post.title}
                </h3>
                {post.coverUrl && (
                  <div className="relative overflow-hidden rounded-[8px] border border-border-default aspect-video max-h-60 w-full bg-subtle-bg">
                    <img
                      src={post.coverUrl}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Post Content
                </h4>
                <div className="max-h-[350px] overflow-y-auto rounded-[8px] border border-border-default bg-subtle-bg p-4 prose dark:prose-invert">
                  <StaticPostContent content={post.content} />
                </div>
              </div>

              <div className="border-t border-border-default pt-6 space-y-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-accent" />
                  <h4 className="font-bold text-text-primary text-base">Feedback & Comments</h4>
                </div>

                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-text-tertiary italic">
                      No comments yet. Be the first to leave feedback!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded-[8px] border border-border-default bg-background p-4 space-y-2 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="font-semibold text-text-primary text-sm">
                                {comment.author.name}
                              </span>
                              <span className="text-xs text-text-tertiary ml-2">
                                @{comment.author.username}
                              </span>
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
                              <span className="text-xs text-text-tertiary">
                                {formatDate(comment.createdAt)}
                              </span>
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
                      htmlFor="drawer-comment-content"
                      className="text-xs font-bold uppercase tracking-wider text-text-secondary"
                    >
                      Leave your feedback
                    </label>
                    <Textarea
                      id="drawer-comment-content"
                      placeholder="Write your constructive feedback, critiques, or thoughts..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      maxLength={2000}
                      className="min-h-[100px] text-sm"
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
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
