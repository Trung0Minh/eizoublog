"use client"

import type { Editor } from "@tiptap/react"
import { X, ChevronLeft } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react"
import { useRouter } from "next/navigation"

import { EditorTopBar } from "@/components/editor/EditorTopBar"
import { EditorTableOfContents } from "@/components/editor/EditorTableOfContents"
import { EditorToolbar } from "@/components/editor/EditorToolbar"
import {
  TiptapEditor,
  type JSONContent,
} from "@/components/editor/TiptapEditor"
import { AnimatePresence, motion } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CoverImageUpload } from "@/components/posts/CoverImageUpload"
import { TagInput, type TagOption } from "@/components/posts/TagInput"
import { SaveStatusIndicator } from "@/components/editor/SaveStatusIndicator"
import { PostHistoryPanel } from "@/components/posts/PostHistoryPanel"
import { DurabilityBanner } from "@/components/durability/DurabilityBanner"
import { AutosaveConflictError, useAutosave } from "@/hooks/useAutosave"
import { usePostRecoveryDraft } from "@/hooks/usePostRecoveryDraft"
import { useWarnUnsaved } from "@/hooks/useWarnUnsaved"
import { cn } from "@/lib/utils"
import { MAX_POST_EXCERPT_CHARACTERS } from "@/lib/postLimits"
import { extractHeadings } from "@/lib/postHeadings"

interface CategoryOption {
  id: string
  name: string
  slug: string
}

interface WriterOption {
  id: string
  name: string
  username: string
}

type CoAuthorStatus = "PENDING" | "ACCEPTED" | "DECLINED"

interface CoAuthorState {
  status: CoAuthorStatus
  userId: string
}

interface InitialPostData {
  categoryId: string | null
  coAuthorIds: string[]
  coAuthors?: CoAuthorState[]
  content: JSONContent
  contentText: string | null
  coverAlt: string | null
  coverUrl: string | null
  draftVisibility?: "PRIVATE" | "CO_AUTHORS"
  excerpt: string | null
  excerptContent?: JSONContent | null
  authorId?: string
  id: string
  status: "DRAFT" | "PUBLISHED"
  tags: TagOption[]
  title: string
  version?: number
}

interface PostEditorProps {
  canPublish?: boolean
  canRestoreRevisions?: boolean
  categories: CategoryOption[]
  currentUserId: string
  initialData?: InitialPostData
  initialTags?: TagOption[]
  writers: WriterOption[]
}

interface PostMutationResponse {
  id: string
  slug: string
  version: number | null
}

function getExcerptPayload(
  excerpt: string,
  initialExcerpt: string | null | undefined,
  isExistingPost: boolean,
) {
  const isUnchangedLegacyExcerpt =
    isExistingPost &&
    excerpt === initialExcerpt &&
    excerpt.length > MAX_POST_EXCERPT_CHARACTERS

  return isUnchangedLegacyExcerpt ? {} : { excerpt }
}

interface RecoveryDraftPayload {
  categoryId: string
  coAuthorIds: string[]
  content: JSONContent
  contentText: string
  coverAlt: string
  coverUrl: string
  excerpt: string
  excerptContent: JSONContent
  tags: TagOption[]
  title: string
}

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Có lỗi xảy ra"
}

function getPostResponse(value: unknown): PostMutationResponse | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "id" in value.data &&
    "slug" in value.data &&
    typeof value.data.id === "string" &&
    typeof value.data.slug === "string"
  ) {
    return {
      id: value.data.id,
      slug: value.data.slug,
      version:
        "version" in value.data && typeof value.data.version === "number"
          ? value.data.version
          : null,
    }
  }

  return null
}

const emptyDoc: JSONContent = {
  content: [{ type: "paragraph" }],
  type: "doc",
}

const editorTabAppName = process.env.NEXT_PUBLIC_APP_NAME ?? "Eizou Blog"

const desktopSettingsQuery = "(min-width: 1024px)"

function subscribeDesktopSettings(callback: () => void) {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => undefined
  }

  const mediaQuery = window.matchMedia(desktopSettingsQuery)
  mediaQuery.addEventListener("change", callback)

  return () => mediaQuery.removeEventListener("change", callback)
}

function getDesktopSettingsSnapshot() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(desktopSettingsQuery).matches
  )
}

function getServerDesktopSettingsSnapshot() {
  return false
}

export function PostEditor({
  canPublish = true,
  canRestoreRevisions = false,
  categories,
  currentUserId,
  initialData,
  initialTags = [],
  writers,
}: PostEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "")
  const [coAuthorIds, setCoAuthorIds] = useState<string[]>(
    initialData?.coAuthorIds ?? [],
  )
  const [content, setContent] = useState<JSONContent>(
    initialData?.content ?? emptyDoc,
  )
  const [contentText, setContentText] = useState(initialData?.contentText ?? "")
  const [coverAlt, setCoverAlt] = useState(initialData?.coverAlt ?? "")
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl ?? "")
  const [error, setError] = useState("")
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "")
  const [excerptContent, setExcerptContent] = useState<JSONContent>(
    initialData?.excerptContent ?? emptyDoc,
  )
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null)
  const [bodyEditor, setBodyEditor] = useState<Editor | null>(null)
  const [spellcheckEnabled, setSpellcheckEnabled] = useState(false)
  const isDesktopSettingsDefault = useSyncExternalStore(
    subscribeDesktopSettings,
    getDesktopSettingsSnapshot,
    getServerDesktopSettingsSnapshot,
  )
  const [settingsPreference, setSettingsPreference] = useState<
    "auto" | "closed" | "open"
  >("auto")
  const isSettingsOpen =
    settingsPreference === "auto"
      ? isDesktopSettingsDefault
      : settingsPreference === "open"
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [savingAction, setSavingAction] = useState<"draft" | "publish" | null>(null)
  const [postId, setPostId] = useState<string | null>(initialData?.id ?? null)
  const [postVersion, setPostVersion] = useState(initialData?.version ?? 1)
  const postVersionRef = useRef(initialData?.version ?? 1)
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(
    initialData?.tags ?? initialTags,
  )
  const [title, setTitle] = useState(initialData?.title ?? "")
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null)
  const coAuthorStatusById = new Map(
    initialData?.coAuthors?.map((coAuthor) => [
      coAuthor.userId,
      coAuthor.status,
    ]) ?? [],
  )

  const autosaveDraftRef = useRef({
    categoryId,
    coAuthorIds,
    content,
    contentText,
    coverAlt,
    coverUrl,
    excerpt,
    excerptContent,
    tagIds: selectedTags.map((tag) => tag.id),
    title,
  })
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const enqueuePostSave = useCallback(<T,>(operation: () => Promise<T>) => {
    const queued = saveQueueRef.current.then(operation, operation)
    saveQueueRef.current = queued.then(
      () => undefined,
      () => undefined,
    )
    return queued
  }, [])
  const canSave = title.trim().length > 0
  const hasOutline = useMemo(() => extractHeadings(content).length > 0, [content])
  const hasInitialData = initialData !== undefined
  const initialExcerpt = initialData?.excerpt

  useEffect(() => {
    const textarea = titleTextareaRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight + 8}px`
  }, [title])

  useEffect(() => {
    const tabTitle = title.trim() || "Bài viết mới"
    document.title = `${tabTitle} | ${editorTabAppName}`
  }, [title])

  useEffect(() => {
    autosaveDraftRef.current = {
      categoryId,
      coAuthorIds,
      content,
      contentText,
      coverAlt,
      coverUrl,
      excerpt,
      excerptContent,
      tagIds: selectedTags.map((tag) => tag.id),
      title,
    }
  }, [categoryId, coAuthorIds, content, contentText, coverAlt, coverUrl, excerpt, excerptContent, selectedTags, title])

  const performAutosave = useCallback(async () => {
    if (!postId) return

    await enqueuePostSave(async () => {
      const draft = autosaveDraftRef.current
      const response = await fetch(`/api/posts/${postId}`, {
        body: JSON.stringify({
          baseVersion: postVersionRef.current,
          categoryId: draft.categoryId || undefined,
          coAuthorIds: draft.coAuthorIds,
          content: draft.content,
          contentText: draft.contentText,
          coverAlt: draft.coverAlt || undefined,
          coverUrl: draft.coverUrl || undefined,
          draftVisibility:
            draft.coAuthorIds.length > 0 ? "CO_AUTHORS" : "PRIVATE",
          excerptContent: draft.excerptContent,
          ...getExcerptPayload(draft.excerpt, initialExcerpt, hasInitialData),
          saveKind: "AUTO",
          tagIds: draft.tagIds,
          title: draft.title,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        if (response.status === 409) throw new AutosaveConflictError()
        throw new Error(getApiError(result))
      }

      const savedPost = getPostResponse(result)
      if (savedPost?.version !== null && savedPost?.version !== undefined) {
        postVersionRef.current = savedPost.version
        setPostVersion(savedPost.version)
      }
    })
  }, [enqueuePostSave, hasInitialData, initialExcerpt, postId])

  const {
    getGeneration,
    isDirty,
    markDirty,
    markSavedThrough,
    scheduleDebounce,
    status: saveStatus,
  } = useAutosave({
    onSave: performAutosave,
    postId,
  })

  const recoveryPayload = useMemo<RecoveryDraftPayload>(() => ({
    categoryId,
    coAuthorIds,
    content,
    contentText,
    coverAlt,
    coverUrl,
    excerpt,
    excerptContent,
    tags: selectedTags,
    title,
  }), [categoryId, coAuthorIds, content, contentText, coverAlt, coverUrl, excerpt, excerptContent, selectedTags, title])
  const recovery = usePostRecoveryDraft({
    isDirty,
    key: postId ? `post:${postId}` : `new:${currentUserId}`,
    payload: recoveryPayload,
  })

  useWarnUnsaved(isDirty)

  const markDirtyAndAutosave = useCallback(() => {
    markDirty()
    scheduleDebounce()
  }, [markDirty, scheduleDebounce])

  const handleBodyEditorReady = useCallback((editor: Editor | null) => {
    setBodyEditor(editor)
    setActiveEditor((current) => current ?? editor)
  }, [])

  const handleExcerptEditorReady = useCallback((editor: Editor | null) => {
    setActiveEditor((current) => current ?? editor)
  }, [])

  const recoverLocalDraft = useCallback(() => {
    const draft = recovery.accept()
    if (!draft) return
    setCategoryId(draft.categoryId)
    setCoAuthorIds(draft.coAuthorIds)
    setContent(draft.content)
    setContentText(draft.contentText)
    setCoverAlt(draft.coverAlt)
    setCoverUrl(draft.coverUrl)
    setExcerpt(draft.excerpt)
    setExcerptContent(draft.excerptContent ?? emptyDoc)
    setSelectedTags(draft.tags)
    setTitle(draft.title)
    markDirtyAndAutosave()
  }, [markDirtyAndAutosave, recovery])

  const downloadRecoveryCopy = useCallback(async () => {
    try {
      let recoveryData: unknown = {
        data: {
          exportedAt: new Date().toISOString(),
          formatVersion: 1,
          media: [coverUrl].filter(Boolean),
          post: recoveryPayload,
        },
      }
      if (postId) {
        const response = await fetch(`/api/posts/${postId}/export`)
        recoveryData = await response.json()
        if (!response.ok) throw new Error(getApiError(recoveryData))
      }

      const blob = new Blob([JSON.stringify(recoveryData, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `${title.trim() || "untitled-post"}.post-backup.json`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Could not download a recovery copy",
      )
    }
  }, [coverUrl, postId, recoveryPayload, title])

  async function savePost(status: "DRAFT" | "PUBLISHED") {
    if (status === "PUBLISHED") {
      if (!contentText || !contentText.trim()) {
        setError("Nội dung bài viết không được để trống khi đăng.")
        setSavingAction(null)
        return
      }
    }
    setSavingAction(status === "PUBLISHED" ? "publish" : "draft")
    setError("")
    let isNavigatingAway = false
    const savingGeneration = getGeneration()

    const currentPostId = postId
    const manualDraft = {
      categoryId,
      coAuthorIds,
      content,
      contentText,
      coverAlt,
      coverUrl,
      excerpt,
      excerptContent,
      tagIds: selectedTags.map((tag) => tag.id),
      title,
    }

    try {
      const post = await enqueuePostSave(async () => {
        const payload = {
          categoryId: manualDraft.categoryId || undefined,
          coAuthorIds: manualDraft.coAuthorIds,
          content: manualDraft.content,
          contentText: manualDraft.contentText,
          coverAlt: manualDraft.coverAlt || undefined,
          coverUrl: manualDraft.coverUrl || undefined,
          draftVisibility:
            manualDraft.coAuthorIds.length > 0 ? "CO_AUTHORS" : "PRIVATE",
          excerptContent: manualDraft.excerptContent,
          ...getExcerptPayload(
            manualDraft.excerpt,
            initialExcerpt,
            hasInitialData,
          ),
          status,
          tagIds: manualDraft.tagIds,
          title: manualDraft.title,
          ...(currentPostId && { baseVersion: postVersionRef.current }),
          saveKind: "MANUAL" as const,
        }
        const response = await fetch(
          currentPostId ? `/api/posts/${currentPostId}` : "/api/posts",
          {
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
            method: currentPostId ? "PATCH" : "POST",
          },
        )
        const result: unknown = await response.json()

        if (!response.ok) {
          throw new Error(getApiError(result))
        }

        const savedPost = getPostResponse(result)

        if (!savedPost) {
          throw new Error("Phản hồi bài viết không bao gồm slug")
        }

        if (savedPost.version !== null) {
          postVersionRef.current = savedPost.version
          setPostVersion(savedPost.version)
        }

        return savedPost
      })

      if (status === "PUBLISHED") {
        markSavedThrough(savingGeneration)
        recovery.discard()
        isNavigatingAway = true
        router.push(`/${post.slug}`)
        return
      }

      setPostId(post.id)
      markSavedThrough(savingGeneration)
      recovery.discard()

      if (!postId) {
        router.push(`/dashboard/edit/${post.id}`)
      } else {
        router.refresh()
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Có lỗi xảy ra",
      )
    } finally {
      if (!isNavigatingAway) {
        setSavingAction(null)
      }
    }
  }

  function toggleCoAuthor(writerId: string) {
    markDirtyAndAutosave()
    setCoAuthorIds((currentIds) => {
      const nextIds = currentIds.includes(writerId)
        ? currentIds.filter((id) => id !== writerId)
        : [...currentIds, writerId]

      return nextIds
    })
  }

  const availableWriters = writers.filter((writer) => writer.id !== currentUserId)

  function getCoAuthorStatus(writerId: string) {
    return coAuthorStatusById.get(writerId) ?? "PENDING"
  }

  function getCoAuthorStatusLabel(writerId: string) {
    if (!postId || !coAuthorStatusById.has(writerId)) {
      return "Chưa gửi"
    }

    switch (getCoAuthorStatus(writerId)) {
      case "ACCEPTED":
        return "Đã chấp nhận"
      case "DECLINED":
        return "Đã từ chối"
      case "PENDING":
        return "Đang chờ"
    }
  }

  function getCoAuthorStatusClass(writerId: string) {
    if (!postId || !coAuthorStatusById.has(writerId)) {
      return "border-border-default bg-subtle-bg text-text-tertiary"
    }

    switch (getCoAuthorStatus(writerId)) {
      case "ACCEPTED":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      case "DECLINED":
        return "border-destructive/30 bg-destructive/10 text-destructive"
      case "PENDING":
        return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex h-dvh min-h-dvh flex-col bg-transparent text-text-primary"
      data-editor-surface="true"
      data-testid="post-editor-shell"
    >
      <EditorTopBar
        canPublish={canPublish}
        canSave={canSave}
        exitHref="/dashboard"
        isPending={isPending || savingAction !== null}
        isSettingsOpen={isSettingsOpen}
        isPublished={initialData?.status === "PUBLISHED"}
        onPublish={() => startTransition(() => void savePost("PUBLISHED"))}
        onSaveDraft={() => startTransition(() => void savePost("DRAFT"))}
        onExport={() => void downloadRecoveryCopy()}
        onHistory={postId ? () => setIsHistoryOpen(true) : undefined}
        pendingAction={savingAction}
        previewHref={postId ? `/dashboard/preview/${postId}` : null}
        onToggleSettings={() =>
          setSettingsPreference(isSettingsOpen ? "closed" : "open")
        }
      />

      {/* Floating Save Status Pill */}
      <div className="fixed bottom-[72px] left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-border-default bg-card/75 px-3 py-2 text-[12px] backdrop-blur-md shadow-glass lg:bottom-6 lg:left-6 lg:translate-x-0 lg:px-4 lg:text-[13px]">
        {isPending || savingAction !== null ? (
          <span className="text-text-tertiary">Đang lưu...</span>
        ) : saveStatus === "idle" ? (
          <span className="text-text-tertiary">
            {canSave ? "Đã lưu" : "Thêm tiêu đề để lưu"}
          </span>
        ) : (
          <SaveStatusIndicator status={saveStatus} />
        )}
      </div>

      <main className="relative flex w-full min-h-0 flex-1 overflow-hidden bg-transparent">
        <AnimatePresence initial={false}>
          {isSettingsOpen && (
            <motion.aside
              aria-label="Cài đặt bài viết"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex w-full shrink-0 flex-col overflow-y-auto border-l border-border-default/40 bg-card/55 pb-24 pt-4 shadow-glass backdrop-blur-xl lg:w-[320px] lg:pb-0 lg:pt-6 xl:w-[360px]"
              id="post-settings-panel"
            >
              <div className="w-full px-5 py-6">

              <div className="mb-6 flex items-start justify-between gap-4 lg:mb-8">
                <div>
                  <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-primary">
                    Cài đặt bài viết
                  </h2>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
                    Ảnh bìa, phân loại, thẻ, và cộng tác viên.
                  </p>
                </div>
                <button
                  aria-label="Đóng cài đặt bài viết"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-default bg-background/70 text-text-secondary lg:hidden"
                  onClick={() => setSettingsPreference("closed")}
                  type="button"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 bg-background p-5 rounded-[20px] border border-border-default shadow-sm hover:shadow-md transition-all duration-300">
                    <CoverImageUpload
                      onChange={(url) => {
                        setCoverUrl(url)
                        markDirtyAndAutosave()
                      }}
                      value={coverUrl}
                    />
                    {coverUrl && (
                      <div className="mt-2 space-y-1.5">
                        <label
                          className="text-[13px] font-semibold text-text-secondary"
                          htmlFor="cover-alt"
                        >
                          Văn bản thay thế ảnh bìa
                        </label>
                        <input
                          className="h-11 w-full rounded-[5px] border border-border-default bg-background px-3 py-2 text-[15px] text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent"
                          id="cover-alt"
                          maxLength={200}
                          onChange={(event) => {
                            setCoverAlt(event.target.value)
                            markDirtyAndAutosave()
                          }}
                          placeholder="Mô tả ảnh bìa"
                          value={coverAlt}
                        />
                      </div>
                    )}
                </div>

                <div className="space-y-4 bg-background p-5 rounded-[20px] border border-border-default shadow-sm hover:shadow-md transition-all duration-300">
                      <label
                        className="text-[12px] font-semibold text-text-secondary"
                        htmlFor="post-category"
                      >
                        Danh mục
                      </label>
                      <Select
                        value={categoryId || "none"}
                        onValueChange={(value) => {
                          setCategoryId(value === "none" ? "" : value)
                          markDirtyAndAutosave()
                        }}
                      >
                        <SelectTrigger
                          aria-label="Danh mục"
                          className="w-full bg-background border-border-default text-[13px] transition-colors focus:border-accent"
                          id="post-category"
                        >
                          <SelectValue placeholder="Không có danh mục" />
                        </SelectTrigger>
                        <SelectContent className="z-[110]">
                          <SelectItem value="none">Không có danh mục</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                    <TagInput
                      onChange={(tags) => {
                        setSelectedTags(tags)
                        markDirtyAndAutosave()
                      }}
                      selectedTags={selectedTags}
                    />
                </div>

                {availableWriters.length > 0 && (!initialData || currentUserId === initialData.authorId) && (
                  <div className="space-y-4 bg-background p-5 rounded-[20px] border border-border-default shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="text-[12px] font-semibold text-text-secondary">
                          Đồng tác giả
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availableWriters
                            .filter((writer) => coAuthorIds.includes(writer.id))
                            .map((writer) => (
                              <button
                                aria-label={`Xóa ${writer.name}`}
                                className="inline-flex h-9 items-center gap-2 rounded-[5px] border border-border-default bg-background px-3 text-[13px] text-text-secondary transition-colors hover:bg-subtle-bg"
                                key={writer.id}
                                onClick={() => toggleCoAuthor(writer.id)}
                                type="button"
                              >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7b5ea7] text-[12px] font-semibold text-white">
                                  {writer.name.charAt(0)}
                                </span>
                                <span>{writer.name}</span>
                                <span
                                  className={cn(
                                    "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                    getCoAuthorStatusClass(writer.id),
                                  )}
                                >
                                  {getCoAuthorStatusLabel(writer.id)}
                                </span>
                                <X aria-hidden="true" className="h-3.5 w-3.5 text-text-tertiary" />
                              </button>
                            ))}
                        </div>
                        <p className="text-[12px] leading-relaxed text-text-tertiary">
                          Chọn đồng tác giả rồi bấm lưu để gửi lời mời. Trạng thái sẽ cập nhật khi họ phản hồi.
                        </p>
                        {coAuthorIds.length > 0 && (
                          <button
                            className="inline-flex h-9 items-center justify-center rounded-[5px] border border-border-default bg-background px-3 text-[13px] font-medium text-text-primary transition-colors hover:bg-subtle-bg disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!canSave || isPending}
                            onClick={() =>
                              startTransition(() => void savePost("DRAFT"))
                            }
                            type="button"
                          >
                            {postId ? "Gửi / cập nhật lời mời" : "Lưu nháp và gửi lời mời"}
                          </button>
                        )}
                        <Select
                          value="none"
                          onValueChange={(value) => {
                            if (value && value !== "none") {
                              toggleCoAuthor(value)
                            }
                          }}
                        >
                          <SelectTrigger
                            aria-label="Thêm đồng tác giả"
                            className="w-full bg-background border-border-default text-[13px] transition-colors focus:border-accent text-text-secondary"
                          >
                            <SelectValue placeholder="Thêm đồng tác giả..." />
                          </SelectTrigger>
                          <SelectContent className="z-[110]">
                            <SelectItem value="none">Thêm đồng tác giả...</SelectItem>
                            {availableWriters
                              .filter((writer) => !coAuthorIds.includes(writer.id) && writer.id !== (initialData?.authorId ?? currentUserId))
                              .map((writer) => (
                                <SelectItem key={writer.id} value={writer.id}>
                                  {writer.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Content shifts only slightly when the settings drawer opens, while
             the toggle parks just outside the drawer edge. */}
        <div
          className={cn(
            "flex min-w-0 flex-1 h-full",
            "transition-[margin-right] duration-300",
            isSettingsOpen ? "lg:mr-20 xl:mr-24" : "mr-0",
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
        >
          {/* Robust zero-width tracker for the toggle button */}
          <div className="pointer-events-none fixed inset-y-0 right-0 z-[60] hidden w-0 items-center lg:flex">
            <button
              aria-label={isSettingsOpen ? "Đóng cài đặt" : "Mở cài đặt"}
              className={cn(
                "pointer-events-auto absolute right-4 flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-card/60 text-text-secondary shadow-glass backdrop-blur-md transition-all duration-300 hover:bg-card hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSettingsOpen && "lg:right-[336px] xl:right-[376px]",
              )}
              onClick={() =>
                setSettingsPreference(isSettingsOpen ? "closed" : "open")
              }
            >
              <motion.div
                animate={{ rotate: isSettingsOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "anticipate" }}
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.div>
            </button>
          </div>

          <div className="min-w-0 flex-1 w-full h-full overflow-y-auto lg:ml-20 2xl:ml-0">
            {hasOutline && (
              <aside
                className={cn(
                  "hidden 2xl:fixed 2xl:bottom-6 2xl:top-6 2xl:z-20 2xl:block 2xl:w-40 2xl:overflow-y-auto 2xl:transition-[left] 2xl:duration-300",
                  isSettingsOpen
                    ? "2xl:left-[max(4.5rem,calc((100vw_-_1100px)_/_2_-_232px))]"
                    : "2xl:left-[max(4.5rem,calc((100vw_-_1100px)_/_2_-_184px))]",
                )}
              >
                <EditorTableOfContents content={content} editor={bodyEditor} />
              </aside>
            )}

            <div
              className={cn(
                "mx-auto flex w-full flex-col px-4 pb-[120px] pt-6 md:px-6 md:pt-8",
                "max-w-[1100px]",
              )}
            >
              <DurabilityBanner scope="writer" />
              {error && (
                <div
                  className="mb-4 rounded-[5px] border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {recovery.candidate && (
                <div
                  className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-accent/30 bg-accent/5 px-4 py-4 text-sm text-text-primary sm:px-5"
                  role="alert"
                >
                  <span>
                    This device has a newer unsaved copy of this post.
                  </span>
                  <span className="flex gap-2">
                    <Button onClick={recoverLocalDraft} size="sm" type="button">
                      Recover local copy
                    </Button>
                    <Button
                      onClick={recovery.discard}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Discard
                    </Button>
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "relative min-w-0",
                )}
              >
                <div className="min-w-0">
                  <EditorTableOfContents
                    className="mb-4 2xl:hidden"
                    collapsible
                    content={content}
                    editor={bodyEditor}
                  />

                  <section
                    className="relative z-30 mb-8 w-full rounded-[8px] border border-border-default/55 bg-background/45 backdrop-blur-xl max-sm:shadow-glass sm:border-border-default sm:bg-subtle-bg sm:backdrop-blur-md md:mb-12"
                    data-testid="editor-writing-surface"
                  >
                    <div className="px-3 py-4 sm:p-8 md:p-12">
                      <div className="mt-4 pb-2 md:mt-0 md:pb-3">
                        <label className="sr-only" htmlFor="post-title">
                          Tiêu đề
                        </label>
                        <textarea
                          ref={titleTextareaRef}
                          className="field-sizing-content min-h-[1.2lh] w-full resize-none overflow-hidden border-none bg-transparent px-0 pb-1 pt-2 font-display text-[32px] font-bold leading-[1.18] text-text-primary outline-none placeholder:font-normal placeholder:text-text-tertiary md:text-[40px]"
                          id="post-title"
                          maxLength={200}
                          onChange={(event) => {
                            setTitle(event.target.value)
                            markDirtyAndAutosave()
                          }}
                          placeholder="Tiêu đề bài viết..."
                          rows={1}
                          value={title}
                        />
                      </div>

                      <div className="sticky top-0 z-40 -mx-1 mb-5">
                        {activeEditor ? (
                          <EditorToolbar
                            editor={activeEditor}
                            onToggleSpellcheck={() =>
                              setSpellcheckEnabled((current) => !current)
                            }
                            spellcheckEnabled={spellcheckEnabled}
                          />
                        ) : (
                          <div className="flex min-h-[48px] items-center px-3 text-[13px] text-text-tertiary">
                            Chọn phần mô tả hoặc nội dung để dùng thanh công cụ.
                          </div>
                        )}
                      </div>

                      <div className="mb-7 rounded-[14px] border border-border-default/50 bg-background/25 px-4 py-4 transition-colors focus-within:border-accent/50 focus-within:bg-background/35 sm:px-5 sm:py-5">
                        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-text-tertiary">
                          Mô tả
                        </div>
                        <TiptapEditor
                          ariaLabel="Đoạn trích"
                          content={excerptContent}
                          editable
                          editorClassName="prose-editor min-h-[96px] focus:outline-none text-[16px] leading-[1.65] text-text-secondary"
                          onChange={(json, text) => {
                            setExcerptContent(json)
                            setExcerpt(
                              text.slice(0, MAX_POST_EXCERPT_CHARACTERS),
                            )
                            markDirtyAndAutosave()
                          }}
                          onEditorReady={handleExcerptEditorReady}
                          onFocus={setActiveEditor}
                          placeholder="Viết mô tả mở đầu cho bài viết..."
                          showFooterStats={false}
                          showToolbar={false}
                          spellcheckEnabled={spellcheckEnabled}
                        />
                      </div>

                      <div className="rounded-[14px] border border-transparent transition-colors focus-within:border-accent/35">
                        <TiptapEditor
                          content={content}
                          editable
                          presentation="article"
                          onChange={(json, text) => {
                            setContent(json)
                            setContentText(text)
                            markDirtyAndAutosave()
                          }}
                          onEditorReady={handleBodyEditorReady}
                          onFocus={setActiveEditor}
                          showToolbar={false}
                          spellcheckEnabled={spellcheckEnabled}
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PostHistoryPanel
        canRestore={canRestoreRevisions}
        currentVersion={postVersion}
        onOpenChange={setIsHistoryOpen}
        open={isHistoryOpen}
        postId={postId}
      />
    </div>
  )
}
