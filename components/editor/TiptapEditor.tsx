"use client"

import CharacterCount from "@tiptap/extension-character-count"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import TextStyle from "@tiptap/extension-text-style"

import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TaskItem from "@tiptap/extension-task-item"
import TaskList from "@tiptap/extension-task-list"
import TextAlign from "@tiptap/extension-text-align"
import Typography from "@tiptap/extension-typography"
import {
  EditorContent,
  useEditor,
  type Editor,
  type JSONContent,
} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { common, createLowlight } from "lowlight"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { normalizeEditorContent } from "@/components/editor/content"
import { getClipboardImageFiles } from "@/components/editor/clipboardImages"
import { getModifiedClickLink } from "@/components/editor/editorLinks"
import { EditorToolbar } from "@/components/editor/EditorToolbar"
import { uploadFilesThroughServer } from "@/components/editor/MediaUpload"
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
  onEditorReady?: (editor: Editor | null) => void
  placeholder?: string
  ariaLabel?: string
  mode?: "default" | "profile"
}

export function TiptapEditor({
  children,
  content,
  editable = true,
  onChange,
  onEditorReady,
  placeholder = "Bắt đầu viết bài...",
  ariaLabel,
  mode = "default",
}: TiptapEditorProps) {
  const [spellcheckEnabled, setSpellcheckEnabled] = useState(false)
  const [pasteUploadProgress, setPasteUploadProgress] = useState<number | null>(null)
  const [isLinkModifierPressed, setIsLinkModifierPressed] = useState(false)
  const editorRef = useRef<Editor | null>(null)
  const normalizedContent = useMemo(
    () => (content ? normalizeEditorContent(content) : ""),
    [content],
  )
  
  const editor = useEditor({
    content: normalizedContent,
    editable,
    editorProps: {
      attributes: {
        class: editable
          ? "prose-editor min-h-[420px] focus:outline-none"
          : "prose prose-lg dark:prose-invert max-w-none focus:outline-none",
        ...(ariaLabel && { "aria-label": ariaLabel }),
        spellcheck: "false",
      },
      handleClick: (_view, _position, event) => {
        if (!editable) {
          return false
        }

        const href = getModifiedClickLink(event)
        if (!href) {
          return false
        }

        event.preventDefault()
        window.open(href, "_blank", "noopener,noreferrer")
        return true
      },
      handlePaste: (_view, event) => {
        const imageFiles = event.clipboardData
          ? getClipboardImageFiles(event.clipboardData)
          : []

        if (imageFiles.length === 0) {
          return false
        }

        event.preventDefault()
        setPasteUploadProgress(0)

        // Clipboard images use the same-origin upload route. This avoids
        // browser-to-R2 CORS failures that can occur with presigned PUTs.
        void uploadFilesThroughServer(imageFiles, setPasteUploadProgress)
          .then((urls) => {
            editorRef.current
              ?.chain()
              .focus()
              .insertContent(
                urls.map((url) => ({
                  attrs: { alt: "", src: url },
                  type: "customImage",
                })),
              )
              .run()
          })
          .catch((error: unknown) => {
            toast.error("Could not paste image", {
              description:
                error instanceof Error ? error.message : "Please try again.",
            })
          })
          .finally(() => setPasteUploadProgress(null))

        return true
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
        multicolor: true,
      }),
      TextStyle,
      Color.configure({
        types: [TextStyle.name],
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

  useEffect(() => {
    if (!editor) return

    const dom = editor.view?.dom
    if (!dom) return

    dom.setAttribute("spellcheck", String(spellcheckEnabled))
  }, [editor, spellcheckEnabled])

  useEffect(() => {
    editorRef.current = editor
    onEditorReady?.(editor ?? null)

    return () => {
      editorRef.current = null
      onEditorReady?.(null)
    }
  }, [editor, onEditorReady])

  useEffect(() => {
    if (!editable) {
      return
    }

    const updateModifierState = (event: KeyboardEvent) => {
      setIsLinkModifierPressed(event.ctrlKey || event.metaKey)
    }
    const clearModifierState = () => setIsLinkModifierPressed(false)

    window.addEventListener("keydown", updateModifierState)
    window.addEventListener("keyup", updateModifierState)
    window.addEventListener("blur", clearModifierState)

    return () => {
      window.removeEventListener("keydown", updateModifierState)
      window.removeEventListener("keyup", updateModifierState)
      window.removeEventListener("blur", clearModifierState)
    }
  }, [editable])

  const isReady = !!editor

  const words = isReady ? editor!.storage.characterCount.words() : 0
  const readingTime = Math.max(1, Math.ceil(words / 200))

  return (
    <div
      className={
        isLinkModifierPressed
          ? "relative w-full [&_.ProseMirror_a]:cursor-pointer"
          : "relative w-full"
      }
    >
      {isReady && editable && (
        <>
          <EditorToolbar
            editor={editor!}
            onToggleSpellcheck={() =>
              setSpellcheckEnabled((current) => !current)
            }
            spellcheckEnabled={spellcheckEnabled}
            mode={mode}
          />
        </>
      )}

      {pasteUploadProgress !== null && (
        <div
          aria-live="polite"
          className="mb-2 text-center text-xs font-medium text-accent"
          role="status"
        >
          Đang tải ảnh từ clipboard... {pasteUploadProgress}%
        </div>
      )}

      {children}

      {isReady ? (
        <EditorContent editor={editor!} />
      ) : (
        <div className="prose-editor min-h-[420px]" />
      )}

      {isReady && editable && (
        <div className="mt-2 flex items-center justify-end gap-3 text-xs text-text-tertiary">
          <span>{words.toLocaleString()} từ</span>
          <span>{editor!.storage.characterCount.characters().toLocaleString()} ký tự</span>
          <span>~{readingTime} phút đọc</span>
        </div>
      )}
    </div>
  )
}

export type { JSONContent }
