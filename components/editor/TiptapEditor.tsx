"use client"

import CharacterCount from "@tiptap/extension-character-count"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { common, createLowlight } from "lowlight"

import { BubbleMenuComponent } from "@/components/editor/BubbleMenu"
import { EditorToolbar } from "@/components/editor/EditorToolbar"
import {
  GalleryExtension,
  HeadingWithIdExtension,
  SpoilerExtension,
  VideoEmbedExtension,
} from "@/components/editor/extensions"

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  children?: React.ReactNode
  content?: JSONContent
  editable?: boolean
  onChange?: (json: JSONContent, text: string) => void
  placeholder?: string
}

export function TiptapEditor({
  children,
  content,
  editable = true,
  onChange,
  placeholder = "Bắt đầu viết bài...",
}: TiptapEditorProps) {
  const editor = useEditor({
    content: content ?? "",
    editable,
    editorProps: {
      attributes: {
        class: editable
          ? "prose-editor min-h-[420px] focus:outline-none"
          : "prose prose-lg dark:prose-invert max-w-none focus:outline-none",
      },
    },
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: false,
      }),
      HeadingWithIdExtension,
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "h-auto max-w-full rounded-md",
        },
      }),
      GalleryExtension,
      Link.configure({
        HTMLAttributes: {
          class: "text-accent underline underline-offset-2 hover:opacity-80",
          rel: "noopener noreferrer",
          target: "_blank",
        },
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      CharacterCount,
      CodeBlockLowlight.configure({
        HTMLAttributes: {
          class: "code-block",
        },
        defaultLanguage: "plaintext",
        lowlight,
      }),
      SpoilerExtension,
      VideoEmbedExtension,
    ],
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON(), editor.getText())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="relative w-full">
      {editable && (
        <>
          <EditorToolbar editor={editor} />
          <BubbleMenuComponent editor={editor} />
        </>
      )}

      {children}

      <EditorContent editor={editor} />

      {editable && (
        <p className="mt-2 text-right text-xs text-text-tertiary">
          {editor.storage.characterCount.characters().toLocaleString()}{" "}
          ký tự
        </p>
      )}
    </div>
  )
}

export type { JSONContent }
