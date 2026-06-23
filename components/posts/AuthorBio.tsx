import Link from "next/link"
import type { JSONContent } from "@tiptap/react"
import { StaticPostContent } from "@/components/posts/StaticPostContent"

interface AuthorBioAuthor {
  avatarUrl: string | null
  bio?: string | null
  name: string
  username: string
}

interface AuthorBioProps {
  author: AuthorBioAuthor
}

function fallbackBio(authorName: string) {
  return `${authorName} viết về quá trình sản xuất anime, nghệ thuật kể chuyện qua hình ảnh và kỹ thuật đằng sau hoạt hình đương đại.`
}

/** Strip image/video/embed/hr nodes from Tiptap JSON so bios only show text. */
function stripMediaNodes(node: JSONContent): JSONContent {
  return {
    ...node,
    content: node.content
      ?.filter(
        (child) =>
          child.type !== "image" &&
          child.type !== "customImage" &&
          child.type !== "imageGallery" &&
          child.type !== "videoEmbed" &&
          child.type !== "horizontalRule",
      )
      .map(stripMediaNodes),
  }
}

export function AuthorBio({ author }: AuthorBioProps) {
  return (
    <section className="glass-card flex flex-col items-center gap-5 p-5 text-center md:flex-row md:items-start md:p-6 md:text-left">
      {author.avatarUrl ? (
        <img
          alt={author.name}
          className="!m-0 h-14 w-14 shrink-0 rounded-full object-cover !cursor-default hover:!opacity-100 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:-translate-y-1 hover:ring-2 hover:ring-accent/50"
          decoding="async"
          loading="lazy"
          src={author.avatarUrl}
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2d6e7e] text-xl font-bold text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:-translate-y-1 hover:ring-2 hover:ring-accent/50">
          {author.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          Viết bởi
        </div>
        <Link
          className="mb-2 inline-block text-[16px] font-bold text-text-primary hover:underline"
          href={`/authors/${author.username}`}
        >
          {author.name}
        </Link>
        <div className="mb-3 text-[13px] leading-[1.6] text-text-secondary [&_.ProseMirror]:!ml-0 [&_.ProseMirror>p]:!ml-0 [&_.ProseMirror]:text-center md:[&_.ProseMirror]:text-left">
          {(() => {
            if (!author.bio) {
              return <p>{fallbackBio(author.name)}</p>
            }
            if (author.bio.startsWith("{")) {
              let json: JSONContent | null = null
              try {
                json = JSON.parse(author.bio) as JSONContent
              } catch {}
              if (json) {
                return <StaticPostContent content={stripMediaNodes(json)} />
              }
            }
            return <p>{author.bio}</p>
          })()}
        </div>
        <Link
          className="text-[13px] font-medium text-accent hover:underline"
          href={`/authors/${author.username}`}
        >
          Xem tất cả bài viết -&gt;
        </Link>
      </div>
    </section>
  )
}
