import type { Comment } from "@prisma/client"

export type PublicComment = Pick<
  Comment,
  | "authorName"
  | "content"
  | "createdAt"
  | "id"
  | "parentId"
  | "postId"
  | "status"
> & {
  author: {
    role: string
    username: string | null
  } | null
}

export type CommentWithReplies = PublicComment & {
  replies: PublicComment[]
}
