import { revalidateTag } from "next/cache"
import { ZodError, z } from "zod"

import { prisma } from "@/lib/prisma"
import { sendCommentReplyEmail, sendPostCommentEmail } from "@/lib/resend"
import { auth } from "@/lib/auth"
import { getPostDetailCacheTag } from "@/lib/cacheTags"

class RouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

const createCommentSchema = z.object({
  authorEmail: z.string().trim().email().optional().or(z.literal("")),
  authorName: z.string().trim().max(80).optional().or(z.literal("")),
  content: z.string().trim().min(1).max(2000),
  notifyReply: z.boolean().default(true),
  parentId: z.string().min(1).optional(),
  postId: z.string().min(1),
})

const publicCommentSelect = {
  author: {
    select: {
      avatarUrl: true,
      displayRoleColor: true,
      displayRoleName: true,
      role: true,
      username: true,
    },
  },
  authorName: true,
  content: true,
  createdAt: true,
  id: true,
  parentId: true,
  postId: true,
  status: true,
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const data = createCommentSchema.parse(await request.json())

    let authorEmail = data.authorEmail || ""
    let authorName = data.authorName || ""
    let authorId = undefined

    if (session?.user?.email && session?.user?.name) {
      authorEmail = session.user.email
      authorName = session.user.name
      authorId = session.user.id
    }

    if (!authorEmail || !authorName) {
      throw new RouteError("Name and email are required for guests", 400)
    }

    const post = await prisma.post.findUnique({
      select: { 
        id: true, 
        slug: true, 
        title: true,
        author: {
          select: {
            email: true,
            name: true,
            id: true
          }
        },
        coAuthors: {
          select: {
            user: { select: { email: true, id: true, name: true } },
          },
          where: { status: "ACCEPTED" },
        },
        finalAwardEvent: {
          select: {
            rooms: {
              select: {
                writer: { select: { email: true, id: true, name: true } },
              },
              where: { excludedAt: null, status: "SUBMITTED" },
            },
          },
        },
      },
      where: { id: data.postId, status: "PUBLISHED" },
    })

    if (!post) {
      throw new RouteError("Post not found", 404)
    }

    let parent:
      | {
          author: { role: string; username: string | null } | null
          authorEmail: string
          authorName: string
          id: string
          notifyReply: boolean
          parentId: string | null
          postId: string
        }
      | null = null

    if (data.parentId) {
      parent = await prisma.comment.findUnique({
        select: {
          author: {
            select: {
              role: true,
              username: true,
            },
          },
          authorEmail: true,
          authorName: true,
          id: true,
          notifyReply: true,
          parentId: true,
          postId: true,
        },
        where: { id: data.parentId },
      })

      if (!parent) {
        throw new RouteError("Parent comment not found", 404)
      }

      if (parent.postId !== data.postId) {
        throw new RouteError("Parent comment does not belong to this post", 400)
      }

      if (parent.parentId) {
        throw new RouteError("Replies to replies are not allowed", 400)
      }
    }

    const comment = await prisma.comment.create({
      data: {
        authorEmail,
        authorName,
        authorId,
        content: data.content,
        notifyReply: data.notifyReply,
        parentId: data.parentId ?? null,
        postId: data.postId,
        status: "APPROVED",
      },
      select: publicCommentSelect,
    })

    if (
      parent &&
      parent.notifyReply &&
      parent.authorEmail.toLowerCase() !== authorEmail.toLowerCase()
    ) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL

      if (appUrl) {
        try {
          await sendCommentReplyEmail({
            postTitle: post.title,
            postUrl: `${appUrl}/${post.slug}#comment-${comment.id}`,
            repliedByName: authorName,
            replyContent: data.content,
            to: parent.authorEmail,
            toName: parent.authorName,
          })
        } catch (error) {
          console.error(
            "[POST /api/comments] Failed to send reply email:",
            error,
          )
        }
      }
    }

    const creditedAuthors = new Map(
      [
        post.author,
        ...post.coAuthors.map(({ user }) => user),
        ...(post.finalAwardEvent?.rooms.map(({ writer }) => writer) ?? []),
      ].map((recipient) => [recipient.email.toLowerCase(), recipient] as const),
    )
    creditedAuthors.delete(authorEmail.toLowerCase())
    if (parent?.notifyReply) {
      creditedAuthors.delete(parent.authorEmail.toLowerCase())
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      await Promise.all(
        [...creditedAuthors.values()].map(async (recipient) => {
          try {
          await sendPostCommentEmail({
            postTitle: post.title,
            postUrl: `${appUrl}/${post.slug}#comment-${comment.id}`,
            commenterName: authorName,
            commentContent: data.content,
            to: recipient.email,
            toName: recipient.name,
          })
          } catch (error) {
            console.error(
              "[POST /api/comments] Failed to send credited author email:",
              error,
            )
          }
        }),
      )
    }

    revalidateTag("comments", "max")
    revalidateTag(getPostDetailCacheTag(post.slug), "max")

    return Response.json({ data: comment }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    if (error instanceof RouteError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("[POST /api/comments]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
