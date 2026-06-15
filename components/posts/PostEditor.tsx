"use client"

import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { EditorTopBar } from "@/components/editor/EditorTopBar"
import {
  TiptapEditor,
  type JSONContent,
} from "@/components/editor/TiptapEditor"
import { Textarea } from "@/components/ui/textarea"
import { CoverImageUpload } from "@/components/posts/CoverImageUpload"
import { DraftVisibilityToggle } from "@/components/posts/DraftVisibilityToggle"
import { TagInput, type TagOption } from "@/components/posts/TagInput"
import { useAutosave } from "@/hooks/useAutosave"
import { useWarnUnsaved } from "@/hooks/useWarnUnsaved"
import { cn } from "@/lib/utils"

interface CategoryOption {
  children: { id: string; name: string; slug?: string }[]
  id: string
  name: string
  slug: string
}

interface WriterOption {
  id: string
  name: string
  username: string
}

interface InitialPostData {
  categoryId: string | null
  coAuthorIds: string[]
  content: JSONContent
  contentText: string | null
  coverAlt: string | null
  coverUrl: string | null
  draftVisibility: "PRIVATE" | "CO_AUTHORS"
  excerpt: string | null
  id: string
  status: "DRAFT" | "PUBLISHED"
  tags: TagOption[]
  title: string
}

interface PostEditorProps {
  categories: CategoryOption[]
  currentUserId: string
  initialData?: InitialPostData
  initialTags?: TagOption[]
  writers: WriterOption[]
}

interface PostMutationResponse {
  id: string
  slug: string
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

  return "Something went wrong"
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
    return { id: value.data.id, slug: value.data.slug }
  }

  return null
}

const emptyDoc: JSONContent = {
  content: [{ type: "paragraph" }],
  type: "doc",
}

export function PostEditor({
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
  const [draftVisibility, setDraftVisibility] = useState<
    "PRIVATE" | "CO_AUTHORS"
  >(initialData?.draftVisibility ?? "PRIVATE")
  const [error, setError] = useState("")
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "")
  const [isDirty, setIsDirty] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [postId, setPostId] = useState<string | null>(initialData?.id ?? null)
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(
    initialData?.tags ?? initialTags,
  )
  const [title, setTitle] = useState(initialData?.title ?? "")
  const autosaveDraftRef = useRef({
    content,
    contentText,
    excerpt,
    title,
  })

  const hasCoAuthors = coAuthorIds.length > 0
  const effectiveDraftVisibility = hasCoAuthors ? draftVisibility : "PRIVATE"
  const isEditing = Boolean(postId)
  const canSave = title.trim().length > 0
  const autosaveHint = postId
    ? "Tự động lưu sau khi chỉnh sửa tiêu đề, đoạn trích hoặc nội dung."
    : "Lưu một lần để bật tự động lưu cho bản nháp này."

  useEffect(() => {
    autosaveDraftRef.current = {
      content,
      contentText,
      excerpt,
      title,
    }
  }, [content, contentText, excerpt, title])

  const performAutosave = useCallback(async () => {
    if (!postId) return

    const draft = autosaveDraftRef.current
    const response = await fetch(`/api/posts/${postId}`, {
      body: JSON.stringify({
        content: draft.content,
        contentText: draft.contentText,
        excerpt: draft.excerpt,
        title: draft.title,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const result: unknown = await response.json()

    if (!response.ok) {
      throw new Error(getApiError(result))
    }

    setIsDirty(false)
  }, [postId])

  const {
    scheduleDebounce,
    status: saveStatus,
  } = useAutosave({
    onSave: performAutosave,
    postId,
  })

  useWarnUnsaved(isDirty)

  const markDirty = useCallback(() => {
    setIsDirty(true)
  }, [])

  const markDirtyAndAutosave = useCallback(() => {
    setIsDirty(true)
    scheduleDebounce()
  }, [scheduleDebounce])

  async function savePost(status: "DRAFT" | "PUBLISHED") {
    setError("")

    const payload = {
      categoryId: categoryId || undefined,
      coAuthorIds,
      content,
      contentText,
      coverAlt: coverAlt || undefined,
      coverUrl: coverUrl || undefined,
      draftVisibility: effectiveDraftVisibility,
      excerpt,
      status,
      tagIds: selectedTags.map((tag) => tag.id),
      title,
    }

    try {
      const response = await fetch(
        postId ? `/api/posts/${postId}` : "/api/posts",
        {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: isEditing ? "PATCH" : "POST",
        },
      )
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      const post = getPostResponse(result)

      if (!post) {
        throw new Error("Post response did not include a slug")
      }

      if (status === "PUBLISHED") {
        setIsDirty(false)
        router.push(`/${post.slug}`)
        return
      }

      setPostId(post.id)
      setIsDirty(false)

      if (!postId) {
        router.push(`/dashboard/edit/${post.id}`)
      } else {
        router.refresh()
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Something went wrong",
      )
    }
  }

  function toggleCoAuthor(writerId: string) {
    markDirty()
    setCoAuthorIds((currentIds) => {
      const nextIds = currentIds.includes(writerId)
        ? currentIds.filter((id) => id !== writerId)
        : [...currentIds, writerId]

      if (nextIds.length === 0) {
        setDraftVisibility("PRIVATE")
      }

      return nextIds
    })
  }

  const availableWriters = writers.filter((writer) => writer.id !== currentUserId)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background text-text-primary"
      data-testid="post-editor-shell"
    >
      <EditorTopBar
        autosaveHint={autosaveHint}
        canSave={canSave}
        exitHref="/dashboard"
        isPending={isPending}
        isSettingsOpen={isSettingsOpen}
        isPublished={initialData?.status === "PUBLISHED"}
        onPublish={() => startTransition(() => void savePost("PUBLISHED"))}
        onSaveDraft={() => startTransition(() => void savePost("DRAFT"))}
        onToggleSettings={() => setIsSettingsOpen((current) => !current)}
        saveStatus={saveStatus}
        titlePreview={title}
      />

      <main className="relative mt-12 flex min-h-0 flex-1 overflow-hidden bg-subtle-bg/10 dark:bg-black/40">
        <button
          aria-label={isSettingsOpen ? "Đóng cài đặt" : "Mở cài đặt"}
          className={cn(
            "hidden lg:flex absolute top-1/2 -translate-y-1/2 z-50 h-16 w-8 items-center justify-center border border-border-default shadow-md bg-background text-text-secondary transition-all hover:bg-subtle-bg hover:text-text-primary",
            isSettingsOpen
              ? "left-[320px] xl:left-[360px] rounded-r-md border-l-0"
              : "left-0 rounded-r-md border-l-0"
          )}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          {isSettingsOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
        <aside
          className={cn(
            "w-full shrink-0 overflow-y-auto border-r border-border-default bg-subtle-bg/40 px-5 py-6 shadow-[8px_0_24px_rgba(0,0,0,0.02)] transition-all lg:w-[320px] xl:w-[360px]",
            isSettingsOpen ? "flex fixed inset-y-0 left-0 z-50 pt-16 bg-background flex-col lg:static lg:bg-subtle-bg/40 lg:pt-6" : "hidden"
          )}
          id="post-settings-panel"
        >
          <div className="mb-6 flex items-center justify-between gap-4 lg:mb-8">
            <div>
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-text-primary">
                Cài đặt bài viết
              </h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
                Ảnh bìa, phân loại, cộng tác viên, và quyền truy cập bản nháp.
              </p>
            </div>
            <button
              aria-label="Ẩn cài đặt bài viết"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-subtle-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setIsSettingsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <CoverImageUpload
                  onChange={(url) => {
                    setCoverUrl(url)
                    markDirty()
                  }}
                  value={coverUrl}
                />
                {coverUrl && (
                  <div className="mt-4 space-y-2">
                    <label
                      className="text-[12px] font-semibold text-text-secondary"
                      htmlFor="cover-alt"
                    >
                      Cover alt text
                    </label>
                    <input
                      className="h-10 w-full rounded-[5px] border border-border-default bg-background px-3 py-2 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent"
                      id="cover-alt"
                      maxLength={200}
                      onChange={(event) => {
                        setCoverAlt(event.target.value)
                        markDirty()
                      }}
                      placeholder="Mô tả ảnh bìa"
                      value={coverAlt}
                    />
                  </div>
                )}
            </div>

            <div className="space-y-2">
                  <label
                    className="text-[12px] font-semibold text-text-secondary"
                    htmlFor="post-category"
                  >
                    Danh mục
                  </label>
                  <select
                    className="h-9 w-full rounded-[5px] border border-border-default bg-background px-2.5 py-2 text-[13px] text-text-primary outline-none transition-colors focus:border-accent"
                    id="post-category"
                    onChange={(event) => {
                      setCategoryId(event.target.value)
                      markDirty()
                    }}
                    value={categoryId}
                  >
                    <option value="">Không có danh mục</option>
                    {categories.map((category) => (
                      <optgroup key={category.id} label={category.name}>
                        <option value={category.id}>{category.name}</option>
                        {category.children.map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <TagInput
                  onChange={(tags) => {
                    setSelectedTags(tags)
                    markDirty()
                  }}
                  selectedTags={selectedTags}
                />

                {availableWriters.length > 0 && (
                  <div className="space-y-2">
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
                            {writer.name}
                            <X aria-hidden="true" className="h-3.5 w-3.5 text-text-tertiary" />
                          </button>
                        ))}
                    </div>
                    <select
                      aria-label="Thêm đồng tác giả"
                      className="h-9 w-full rounded-[5px] border border-border-default bg-background px-2.5 py-2 text-[13px] text-text-secondary outline-none transition-colors focus:border-accent"
                      onChange={(event) => {
                        if (event.target.value) {
                          toggleCoAuthor(event.target.value)
                          event.target.value = ""
                        }
                      }}
                      value=""
                    >
                      <option value="">Thêm đồng tác giả...</option>
                      {availableWriters
                        .filter((writer) => !coAuthorIds.includes(writer.id))
                        .map((writer) => (
                          <option key={writer.id} value={writer.id}>
                            {writer.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <DraftVisibilityToggle
                  hasCoAuthors={hasCoAuthors}
                  onChange={(value) => {
                    setDraftVisibility(value)
                    markDirty()
                  }}
                  value={draftVisibility}
                />
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col px-4 pb-[120px] pt-6 md:px-6 md:pt-8">
            {error && (
              <div
                className="mb-4 rounded-[5px] border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            )}

            <section
              className="relative w-full bg-background md:rounded-[8px] md:border md:border-border-default md:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] dark:md:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2)]"
              data-testid="editor-writing-surface"
            >
              <div className="md:px-10 md:pb-12 md:pt-9">
                <TiptapEditor
                  content={content}
                  editable
                  onChange={(json, text) => {
                    setContent(json)
                    setContentText(text)
                    markDirtyAndAutosave()
                  }}
                >
                  <div className="mt-4 pb-2 md:mt-0">
                    <label className="sr-only" htmlFor="post-title">
                      Tiêu đề
                    </label>
                    <input
                      className="w-full border-none bg-transparent text-[22px] font-bold leading-[1.2] text-text-primary outline-none placeholder:text-text-tertiary placeholder:font-normal md:text-[28px]"
                      id="post-title"
                      maxLength={200}
                      onChange={(event) => {
                        setTitle(event.target.value)
                        markDirtyAndAutosave()
                      }}
                      placeholder="Tiêu đề bài viết..."
                      value={title}
                    />
                  </div>

                  <div className="pb-4">
                    <label className="sr-only" htmlFor="post-excerpt">
                      Đoạn trích
                    </label>
                    <Textarea
                      className="h-12 min-h-12 resize-none border-none bg-transparent px-0 text-[15px] text-text-secondary shadow-none placeholder:text-text-tertiary focus-visible:border-transparent focus-visible:ring-0"
                      id="post-excerpt"
                      maxLength={500}
                      onChange={(event) => {
                        setExcerpt(event.target.value)
                        markDirtyAndAutosave()
                      }}
                      placeholder="Đoạn trích ngắn hiển thị trên trang danh sách..."
                      value={excerpt}
                    />
                  </div>

                  <div className="mt-1 border-t border-border-default pt-6" />
                </TiptapEditor>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
