"use client"

import type { Editor } from "@tiptap/react"
import {
  Bold,
  Code,
  CodeSquare,
  Eye,
  Heading2,
  Heading3,
  Heading4,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Underline,
  Video,
} from "lucide-react"
import { useState } from "react"

import { MediaUpload } from "@/components/editor/MediaUpload"
import { VideoEmbedModal } from "@/components/editor/VideoEmbedModal"
import { serializeGalleryImages } from "@/components/editor/gallery"

interface ToolbarButtonProps {
  active?: boolean
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
  title: string
  trigger?: "click" | "mousedown"
}

function ToolbarButton({
  active = false,
  children,
  disabled = false,
  onClick,
  title,
  trigger = "mousedown",
}: ToolbarButtonProps) {
  return (
    <button
      className={[
        "flex h-[30px] w-[30px] items-center justify-center rounded-[5px] transition-colors",
        active
          ? "bg-subtle-bg/70 text-text-primary"
          : "text-text-secondary hover:bg-subtle-bg hover:text-text-primary",
        disabled ? "cursor-not-allowed opacity-40" : "",
      ].join(" ")}
      disabled={disabled}
      onClick={(event) => {
        if (trigger === "click") {
          onClick()
        }
      }}
      onMouseDown={(event) => {
        if (trigger === "mousedown") {
          event.preventDefault()
          onClick()
        }
      }}
      title={title}
      type="button"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 hidden h-4 w-px shrink-0 bg-border-default sm:block" />
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const [showVideoModal, setShowVideoModal] = useState(false)

  function setLink() {
    const previous = editor.getAttributes("link").href
    const previousUrl = typeof previous === "string" ? previous : "https://"
    const url = window.prompt("Enter URL:", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor.chain().focus().unsetLink().run()
      return
    }

    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <>
      <div className="no-scrollbar sticky top-0 z-[60] mb-6 flex min-h-11 flex-wrap items-center gap-0.5 overflow-x-auto bg-background pb-2 md:-mt-9 md:border-b md:border-border-default/50 md:pt-4 shadow-sm">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <Underline aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code"
        >
          <Code aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          <Heading3 aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          title="Heading 4"
        >
          <Heading4 aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered list"
        >
          <ListOrdered aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
          title="Indent list item"
        >
          <IndentIncrease aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
          title="Outdent list item"
        >
          <IndentDecrease aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("link")}
          onClick={setLink}
          title="Insert / edit link"
        >
          <Link2 aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
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
        <ToolbarButton
          onClick={() => setShowVideoModal(true)}
          title="Embed video"
          trigger="click"
        >
          <Video aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive("spoiler")}
          onClick={() => editor.chain().focus().toggleSpoiler().run()}
          title="Spoiler block"
        >
          <Eye aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code block"
        >
          <CodeSquare aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
      </div>

      {showVideoModal && (
        <VideoEmbedModal
          onClose={() => setShowVideoModal(false)}
          onInsert={(url, caption) => {
            editor
              .chain()
              .focus()
              .insertContent({
                attrs: { caption, url },
                type: "videoEmbed",
              })
              .run()
            setShowVideoModal(false)
          }}
        />
      )}
    </>
  )
}
