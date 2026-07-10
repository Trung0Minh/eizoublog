"use client"

import { useState } from "react"

import { CommentForm } from "@/components/comments/CommentForm"
import { CommentList } from "@/components/comments/CommentList"
import { useSessionUser } from "@/lib/clientSession"
import type { CommentWithReplies, PublicComment } from "@/types"

interface CommentSectionProps {
  initialComments: CommentWithReplies[]
  postId: string
  postSlug?: string
  isAuthenticated?: boolean
  postAuthorUsernames?: string[]
}

function countComments(comments: CommentWithReplies[]) {
  return comments.reduce(
    (total, comment) => total + 1 + comment.replies.length,
    0,
  )
}

function sortPublicCommentsLatestFirst<T extends PublicComment>(comments: T[]) {
  return [...comments].sort(
    (firstComment, secondComment) =>
      new Date(secondComment.createdAt).getTime() -
      new Date(firstComment.createdAt).getTime(),
  )
}

function sortCommentsLatestFirst(comments: CommentWithReplies[]) {
  return [...comments]
    .map((comment) => ({
      ...comment,
      replies: sortPublicCommentsLatestFirst(comment.replies),
    }))
    .sort(
      (firstComment, secondComment) =>
        new Date(secondComment.createdAt).getTime() -
        new Date(firstComment.createdAt).getTime(),
    )
}

export function CommentSection({
  initialComments,
  postId,
  postSlug,
  isAuthenticated: initialIsAuthenticated,
  postAuthorUsernames = [],
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>(() =>
    sortCommentsLatestFirst(initialComments),
  )
  const { user } = useSessionUser()
  const isAuthenticated = initialIsAuthenticated ?? Boolean(user)
  const total = countComments(comments)

  function handleNewComment(comment: CommentWithReplies) {
    if (comment.parentId) {
      setComments((currentComments) =>
        currentComments.map((currentComment) =>
          currentComment.id === comment.parentId
            ? {
                ...currentComment,
                replies: sortPublicCommentsLatestFirst([
                  ...currentComment.replies,
                  comment,
                ]),
              }
            : currentComment,
        ),
      )
      return
    }

    setComments((currentComments) =>
      sortCommentsLatestFirst([...currentComments, comment]),
    )
  }

  return (
    <section className="relative z-30 mt-8 overflow-hidden rounded-[16px] border border-border-default/60 bg-background/90 px-4 py-5 font-sans backdrop-blur-sm sm:mt-12 sm:rounded-[8px] sm:bg-subtle-bg/90 sm:p-8 md:p-10" id="comments">
      <div className="mb-4">
        <h2 className="text-[20px] font-bold tracking-tight text-text-primary">
          Bình luận
        </h2>
        <p className="mt-1 text-[14px] text-text-secondary">
          {total} bình luận
        </p>
      </div>

      <h3 className="mb-4 text-[14px] font-semibold text-text-primary">
        Để lại bình luận
      </h3>
      <CommentForm
        onSuccess={handleNewComment}
        postId={postId}
        postSlug={postSlug}
        isAuthenticated={isAuthenticated}
      />

      {comments.length > 0 && (
        <div className="mt-8">
          <CommentList
            comments={comments}
            onReply={handleNewComment}
            postId={postId}
            postSlug={postSlug}
            isAuthenticated={isAuthenticated}
            postAuthorUsernames={postAuthorUsernames}
          />
        </div>
      )}
    </section>
  )
}
