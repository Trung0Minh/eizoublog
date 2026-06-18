"use client"

import type { Editor } from "@tiptap/react"
import {
  Bold,
  Code,
  CodeSquare,
  Eye,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  SpellCheck,
  Strikethrough,
  Underline,
  Video,
} from "lucide-react"
import { useState } from "react"

import { MediaUpload } from "@/components/editor/MediaUpload"
import { VideoEmbedModal } from "@/components/editor/VideoEmbedModal"
import { serializeGalleryImages } from "@/components/editor/gallery"

const HIGHLIGHT_COLORS = [
  { color: "#fef08a", label: "amber" },
  { color: "#fed7aa", label: "orange" },
  { color: "#fecdd3", label: "rose" },
  { color: "#fbcfe8", label: "pink" },
  { color: "#bfdbfe", label: "blue" },
  { color: "#bbf7d0", label: "green" },
  { color: "#ddd6fe", label: "violet" },
  { color: "#e5e7eb", label: "gray" },
]

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
      onClick={() => {
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

export function EditorToolbar({
  editor,
  onToggleSpellcheck,
  spellcheckEnabled = false,
}: {
  editor: Editor
  onToggleSpellcheck?: () => void
  spellcheckEnabled?: boolean
}) {
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showHighlightMenu, setShowHighlightMenu] = useState(false)

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
          active={spellcheckEnabled}
          onClick={() => onToggleSpellcheck?.()}
          title={spellcheckEnabled ? "Disable spellcheck" : "Enable spellcheck"}
        >
          <SpellCheck aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code"
        >
          <Code aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>

        <div className="relative">
          <ToolbarButton
            active={editor.isActive("highlight")}
            onClick={() => setShowHighlightMenu((current) => !current)}
            title="Highlight color"
          >
            <Highlighter aria-hidden="true" className="h-[15px] w-[15px]" />
          </ToolbarButton>
          {showHighlightMenu && (
            <div className="absolute left-0 top-9 z-[80] grid w-[148px] grid-cols-4 gap-1 rounded-[6px] border border-border-default bg-background p-2 shadow-lg">
              {HIGHLIGHT_COLORS.map(({ color, label }) => (
                <button
                  aria-label={`Highlight ${label}`}
                  className={[
                    "h-7 w-7 rounded-full border transition-transform hover:scale-110",
                    editor.isActive("highlight", { color })
                      ? "border-text-primary ring-1 ring-text-primary"
                      : "border-border-strong",
                  ].join(" ")}
                  key={color}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    editor.chain().focus().setHighlight({ color }).run()
                    setShowHighlightMenu(false)
                  }}
                  style={{ backgroundColor: color }}
                  title={`Highlight ${label}`}
                  type="button"
                />
              ))}
              <button
                aria-label="Clear highlight"
                className="col-span-4 flex h-7 items-center justify-center rounded-[4px] border border-border-default text-xs text-text-secondary transition-colors hover:bg-subtle-bg hover:text-text-primary"
                onMouseDown={(event) => {
                  event.preventDefault()
                  editor.chain().focus().unsetHighlight().run()
                  setShowHighlightMenu(false)
                }}
                title="Clear highlight"
                type="button"
              >
                Clear
              </button>
            </div>
          )}
        </div>

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
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align left"
        >
          <AlignLeft aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align center"
        >
          <AlignCenter aria-hidden="true" className="h-[15px] w-[15px]" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align right"
        >
          <AlignRight aria-hidden="true" className="h-[15px] w-[15px]" />
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
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Task list"
        >
          <ListTodo aria-hidden="true" className="h-[15px] w-[15px]" />
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
