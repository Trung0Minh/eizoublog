"use client"

import { FloatingMenu, type Editor } from "@tiptap/react"
import { CodeSquare, Heading2, List, Quote } from "lucide-react"

import { MediaUpload } from "@/components/editor/MediaUpload"
import { serializeGalleryImages } from "@/components/editor/gallery"

export function FloatingMenuComponent({ editor }: { editor: Editor }) {
  if (!editor) {
    return null
  }

  return (
    <FloatingMenu
      className="flex items-center gap-0.5 rounded-md border border-border-default bg-background p-1 shadow-md"
      editor={editor}
      tippyOptions={{ duration: 100 }}
    >
      <button
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[5px] text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
        type="button"
      >
        <Heading2 aria-hidden="true" className="h-[15px] w-[15px]" />
      </button>
      <button
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[5px] text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
        type="button"
      >
        <List aria-hidden="true" className="h-[15px] w-[15px]" />
      </button>
      <button
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[5px] text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
        type="button"
      >
        <Quote aria-hidden="true" className="h-[15px] w-[15px]" />
      </button>
      <button
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[5px] text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code Block"
        type="button"
      >
        <CodeSquare aria-hidden="true" className="h-[15px] w-[15px]" />
      </button>
      <MediaUpload
        onInsertGallery={(images) =>
          editor
            .chain()
            .focus()
            .insertContent({
              attrs: { images: serializeGalleryImages(images) },
              type: "imageGallery",
            })
            .run()
        }
        onInsertSingle={(url, alt) =>
          editor.chain().focus().setImage({ alt, src: url }).run()
        }
        onInsertVideo={(url) =>
          editor
            .chain()
            .focus()
            .insertContent({
              attrs: { caption: "", url },
              type: "videoEmbed",
            })
            .run()
        }
      />
    </FloatingMenu>
  )
}
