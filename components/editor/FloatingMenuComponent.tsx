"use client"

import { FloatingMenu, type Editor } from "@tiptap/react"
import { Heading1, Heading2, List, Quote } from "lucide-react"

export function FloatingMenuComponent({ editor }: { editor: Editor }) {
  return (
    <FloatingMenu
      className="flex items-center gap-1 rounded-md border border-border-default bg-background p-1 shadow-md"
      editor={editor}
      tippyOptions={{ duration: 100 }}
    >
      <button
        className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 1"
        type="button"
      >
        <Heading1 aria-hidden="true" className="h-4 w-4" />
      </button>
      <button
        className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 2"
        type="button"
      >
        <Heading2 aria-hidden="true" className="h-4 w-4" />
      </button>
      <button
        className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
        type="button"
      >
        <List aria-hidden="true" className="h-4 w-4" />
      </button>
      <button
        className="rounded p-1.5 text-sm text-text-secondary hover:bg-subtle-bg hover:text-text-primary"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
        type="button"
      >
        <Quote aria-hidden="true" className="h-4 w-4" />
      </button>
    </FloatingMenu>
  )
}
