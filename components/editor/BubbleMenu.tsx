"use client"

import { BubbleMenu, type Editor } from "@tiptap/react"
import { Bold, Italic, Link2 } from "lucide-react"
import { useState } from "react"

import { LinkEditModal } from "@/components/editor/LinkEditModal"

interface BubbleMenuButtonProps {
  active?: boolean
  children: React.ReactNode
  onClick: () => void
  title: string
}

function BubbleMenuButton({
  active = false,
  children,
  onClick,
  title,
}: BubbleMenuButtonProps) {
  return (
    <button
      className={[
        "rounded p-1.5 text-sm transition-colors",
        active ? "bg-subtle-bg text-text-primary" : "text-text-secondary hover:bg-subtle-bg hover:text-text-primary",
      ].join(" ")}
      onMouseDown={(event) => {
        event.preventDefault()
        onClick()
      }}
      title={title}
      type="button"
    >
      {children}
    </button>
  )
}

export function BubbleMenuComponent({ editor }: { editor: Editor }) {
  const [showLinkModal, setShowLinkModal] = useState(false)

  return (
    <>
      <BubbleMenu
        className="flex items-center gap-0.5 rounded-md border border-border-default bg-background p-1 shadow-md"
        editor={editor}
        tippyOptions={{ duration: 100 }}
      >
        <BubbleMenuButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold aria-hidden="true" className="h-3.5 w-3.5" />
        </BubbleMenuButton>
        <BubbleMenuButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic aria-hidden="true" className="h-3.5 w-3.5" />
        </BubbleMenuButton>
        <BubbleMenuButton
          active={editor.isActive("link")}
          onClick={() => setShowLinkModal(true)}
          title="Insert / edit link"
        >
          <Link2 aria-hidden="true" className="h-3.5 w-3.5" />
        </BubbleMenuButton>
      </BubbleMenu>
      {showLinkModal && (
        <LinkEditModal
          initialUrl={
            typeof editor.getAttributes("link").href === "string"
              ? editor.getAttributes("link").href
              : ""
          }
          onClose={() => setShowLinkModal(false)}
          onRemove={() => {
            editor.chain().focus().unsetLink().run()
            setShowLinkModal(false)
          }}
          onSubmit={(url) => {
            editor.chain().focus().setLink({ href: url }).run()
            setShowLinkModal(false)
          }}
        />
      )}
    </>
  )
}
