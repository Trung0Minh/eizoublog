import type { DraftVisibility, PostStatus, Role } from "@prisma/client"

interface ViewablePost {
  authorId: string
  coAuthors: { userId?: string; user?: { id: string }; status?: string }[]
  draftVisibility: DraftVisibility
  status: PostStatus
}

export function canViewPost(
  post: ViewablePost,
  userId: string | undefined,
  userRole: Role | undefined,
) {
  if (post.status === "PUBLISHED") return true
  if (post.status === "ARCHIVED") return userRole === "ADMIN"
  if (post.status === "REMOVED") return userRole === "ADMIN"
  if (userRole === "ADMIN") return true
  if (!userId) return false
  if (post.authorId === userId) return true

  return post.coAuthors.some((coAuthor) => {
    const id = coAuthor.userId || coAuthor.user?.id
    return id === userId && coAuthor.status === "ACCEPTED"
  })
}
