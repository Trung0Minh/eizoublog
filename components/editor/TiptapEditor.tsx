"use client"

import CharacterCount from "@tiptap/extension-character-count"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Highlight from "@tiptap/extension-highlight"

import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TaskItem from "@tiptap/extension-task-item"
import TaskList from "@tiptap/extension-task-list"
import TextAlign from "@tiptap/extension-text-align"
import Typography from "@tiptap/extension-typography"
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { common, createLowlight } from "lowlight"

import { EditorToolbar } from "@/components/editor/EditorToolbar"
import {
  CustomImageExtension,
  GalleryExtension,
  HeadingWithIdExtension,
  ListItemExtension,
  SpoilerExtension,
  TrailingNodeExtension,
  UnderlineExtension,
  VideoEmbedExtension,
} from "@/components/editor/extensions"

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  children?: React.ReactNode
  content?: JSONContent
  editable?: boolean
  onChange?: (json: JSONContent, text: string) => void
  placeholder?: string
  ariaLabel?: string
}

export function TiptapEditor({
  children,
  content,
  editable = true,
  onChange,
  placeholder = "Bắt đầu viết bài...",
  ariaLabel,
}: TiptapEditorProps) {
  const editor = useEditor({
    content: content ?? "",
    editable,
    editorProps: {
      attributes: {
        class: editable
          ? "prose-editor min-h-[420px] focus:outline-none"
          : "prose prose-lg dark:prose-invert max-w-none focus:outline-none",
        ...(ariaLabel && { "aria-label": ariaLabel }),
      },
    },
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: false,
        listItem: false,
      }),
      HeadingWithIdExtension,
      ListItemExtension,
      Highlight.configure({
        HTMLAttributes: {
          class: "editor-highlight",
        },
      }),
      CustomImageExtension,
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
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list",
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: "task-item",
        },
        nested: true,
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
      TrailingNodeExtension,
      UnderlineExtension,
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

  const words = editor.storage.characterCount.words()
  const readingTime = Math.max(1, Math.ceil(words / 200))

  return (
    <div className="relative w-full">
      {editable && (
        <>
          <EditorToolbar editor={editor} />
        </>
      )}

      {children}

      <EditorContent editor={editor} />

      {editable && (
        <div className="mt-2 flex items-center justify-end gap-3 text-xs text-text-tertiary">
          <span>{words.toLocaleString()} từ</span>
          <span>{editor.storage.characterCount.characters().toLocaleString()} ký tự</span>
          <span>~{readingTime} phút đọc</span>
        </div>
      )}
    </div>
  )
}

export type { JSONContent }
