import { notFound } from "next/navigation"

import { EventArticleEditor } from "@/components/events/EventArticleEditor"
import { getCachedAdminEventDetail } from "@/lib/queries"
import { normalizeAwardEventContent } from "@/lib/awardEventService"

interface AdminEventEditPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEventEditPage({
  params,
}: AdminEventEditPageProps) {
  const { id } = await params
  const event = await getCachedAdminEventDetail(id)

  if (!event?.finalPost) {
    notFound()
  }

  return (
    <EventArticleEditor
      event={{
        id: event.id,
        rooms: event.rooms.map((room) => ({
          id: room.id,
          order: room.order,
          selectedPost: room.selectedPost
            ? { title: room.selectedPost.title }
            : null,
          writer: {
            name: room.writer.name,
            username: room.writer.username,
          },
        })),
        status: event.status,
        title: event.title,
        finalPost: {
          content: normalizeAwardEventContent(event.finalPost.content),
          contentText: event.finalPost.contentText,
          id: event.finalPost.id,
          slug: event.finalPost.slug,
          version: event.finalPost.version,
        },
      }}
    />
  )
}
