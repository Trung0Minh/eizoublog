"use client"

import { useEffect, useRef, useState, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ExternalLink,
  FolderPlus,
  GripVertical,
  Link2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { useAdminAccess } from "@/lib/clientSession"
import { cn } from "@/lib/utils"
import { ResourceLogo, isAvatarLogo } from "@/app/(public)/resources/ResourceLogo"
import {
  defaultResources, isResourcesData, withMissingDefaultResources,
  type ResourceCard, type ResourcesData,
} from "@/app/(public)/resources/resourcesData"

interface ResourcesClientProps {
  initialPage: { content: unknown } | null
  isAdmin?: boolean
  appName: string
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

  return "Lỗi khi lưu. Vui lòng thử lại."
}

function createEmptyResource(): ResourceCard {
  return {
    category: "Khác",
    description: "",
    domain: "",
    logo: "",
    url: "",
  }
}

function getDomainInitial(domain: string) {
  return domain.trim().charAt(0).toUpperCase() || "+"
}

function getUrlHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

export function ResourcesClient({
  initialPage,
  isAdmin: isAdminOverride,
  appName,
}: ResourcesClientProps) {
  const router = useRouter()
  const isAdmin = useAdminAccess(isAdminOverride)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draggedResourceIndex, setDraggedResourceIndex] = useState<number | null>(null)
  const [selectedResourceIndex, setSelectedResourceIndex] = useState(0)
  const [isCreatingResource, setIsCreatingResource] = useState(false)
  const [draftResource, setDraftResource] = useState<ResourceCard>(createEmptyResource)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)

  const initialData: ResourcesData = isResourcesData(initialPage?.content)
    ? {
        ...initialPage.content,
        resources: withMissingDefaultResources(initialPage.content.resources ?? []),
      }
    : {
        title: "Nguồn tham khảo",
        description: `Dưới đây là danh sách các trang web, thư viện lưu trữ và cộng đồng uy tín mà ${appName} thường xuyên tham khảo để thu thập thông tin, nghiên cứu chuyên sâu về hoạt hình và ngành công nghiệp anime.`,
        resources: defaultResources
      }

  const [data, setData] = useState<ResourcesData>(initialData)
  const dataRef = useRef(data)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  function reorderResource(sourceIndex: number, targetIndex: number) {
    if (
      sourceIndex === targetIndex ||
      sourceIndex < 0 ||
      targetIndex < 0 ||
      sourceIndex >= dataRef.current.resources.length ||
      targetIndex >= dataRef.current.resources.length
    ) {
      return
    }

    setData((currentData) => {
      const resources = [...currentData.resources]
      const [resource] = resources.splice(sourceIndex, 1)
      resources.splice(targetIndex, 0, resource)
      return { ...currentData, resources }
    })
    setSelectedResourceIndex(targetIndex)
  }

  function moveVisibleResource(visibleIndex: number, direction: -1 | 1) {
    const sourceEntry = filteredResourceEntries[visibleIndex]
    const targetEntry = filteredResourceEntries[visibleIndex + direction]

    if (!sourceEntry || !targetEntry) {
      return
    }

    reorderResource(sourceEntry.index, targetEntry.index)
  }

  function updateResource(index: number, patch: Partial<ResourceCard>) {
    setData((currentData) => {
      if (index < 0 || index >= currentData.resources.length) {
        return currentData
      }

      const resources = [...currentData.resources]
      resources[index] = { ...resources[index], ...patch }
      return { ...currentData, resources }
    })
  }

  function startCreatingResource() {
    const fallbackCategory = activeCategory ?? categories[0] ?? "Khác"
    setDraftResource({ ...createEmptyResource(), category: fallbackCategory })
    setIsCreatingResource(true)
  }

  function createCategory() {
    const category = newCategoryName.trim()
    if (!category) {
      return
    }

    setActiveCategory(category)
    setDraftResource({ ...createEmptyResource(), category })
    setNewCategoryName("")
    setIsAddingCategory(false)
    setIsCreatingResource(true)
  }

  function selectCategory(category: string) {
    if (isCreatingResource) {
      setDraftResource((resource) => ({ ...resource, category }))
      setIsCategoryMenuOpen(false)
      return
    }

    updateResource(selectedResourceIndex, { category })
    setIsCategoryMenuOpen(false)
  }

  function addDraftResource() {
    const normalizedDraft = {
      ...draftResource,
      category: (draftResource.category ?? "").trim() || "Khác",
      domain: draftResource.domain.trim() || getUrlHostname(draftResource.url) || "Nguồn mới",
      logo: draftResource.logo.trim(),
      url: draftResource.url.trim(),
    }

    setData((currentData) => ({
      ...currentData,
      resources: [...currentData.resources, normalizedDraft],
    }))
    setSelectedResourceIndex(dataRef.current.resources.length)
    setIsCreatingResource(false)
    setDraftResource(createEmptyResource())
  }

  function deleteSelectedResource() {
    if (isCreatingResource) {
      setDraftResource(createEmptyResource())
      setIsCreatingResource(false)
      return
    }

    setData((currentData) => {
      if (
        selectedResourceIndex < 0 ||
        selectedResourceIndex >= currentData.resources.length
      ) {
        return currentData
      }

      const resources = currentData.resources.filter(
        (_, index) => index !== selectedResourceIndex,
      )
      return { ...currentData, resources }
    })
    setSelectedResourceIndex((currentIndex) => Math.max(0, currentIndex - 1))
  }

  function handleResourceDrop(event: DragEvent<HTMLDivElement>, targetIndex: number) {
    event.preventDefault()

    if (draggedResourceIndex === null) {
      return
    }

    reorderResource(draggedResourceIndex, targetIndex)
    setDraggedResourceIndex(null)
  }

  function handleResourceDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()

    const edgeSize = 96
    const scrollStep = 18

    if (event.clientY < edgeSize) {
      window.scrollBy({ top: -scrollStep })
      return
    }

    if (window.innerHeight - event.clientY < edgeSize) {
      window.scrollBy({ top: scrollStep })
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/site-pages/resources", {
        body: JSON.stringify({ content: dataRef.current }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setIsEditing(false)
      toast.success("Đã lưu trang Tài nguyên")
      router.refresh()
    } catch (error) {
      console.error("Failed to save:", error)
      toast.error("Không thể lưu trang Tài nguyên", {
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const categories = Array.from(
    new Set(data.resources.map((resource) => resource.category || "Khác")),
  )
  const selectedResource = data.resources[selectedResourceIndex] ?? data.resources[0]
  const editorResource = isCreatingResource
    ? draftResource
    : selectedResource ?? createEmptyResource()
  const editorCategory = editorResource.category ?? ""
  const duplicateUrl = Boolean(
    editorResource.url &&
      (isCreatingResource
        ? data.resources.some((resource) => resource.url === editorResource.url)
        : data.resources.some(
            (resource, index) =>
              index !== selectedResourceIndex && resource.url === editorResource.url,
          )),
  )
  const filteredResourceEntries = data.resources
    .map((resource, index) => ({ resource, index }))
    .filter(
      ({ resource }) =>
        activeCategory === null || (resource.category || "Khác") === activeCategory,
    )

  return (
    <div className="relative group min-h-screen flex flex-col pt-0 pb-20">
      {isAdmin && !isEditing && (
        <Button
          aria-label="Chỉnh sửa trang"
          onClick={() => setIsEditing(true)}
          className="absolute right-0 top-0 z-10 shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
          size="icon"
          title="Chỉnh sửa trang"
          variant="outline"
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
        </Button>
      )}

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pb-20 pt-8 md:pt-16">
        <div className="mb-8">
          <ScrollReveal>
            {isEditing ? (
              <input
                className="w-full border-none bg-transparent text-[40px] md:text-[56px] font-bold font-display tracking-tight text-text-primary leading-[1.1] outline-none focus:ring-2 focus:ring-accent rounded-[8px] placeholder:text-text-tertiary"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder="Tiêu đề trang..."
              />
            ) : (
              <h1
                aria-label={data.title}
                className="mb-6 flex flex-nowrap items-baseline gap-x-0 whitespace-nowrap text-[36px] font-bold leading-[1.1] tracking-tight text-text-primary sm:text-[44px] md:text-[56px]"
              >
                <TextReveal text={data.title.split(" ")[0] || "Nguồn"} />
                <TextReveal
                  text={data.title.split(" ").slice(1).join(" ") || "tham khảo"}
                  className="flex-nowrap whitespace-nowrap bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent [&>span:last-child]:mr-0"
                />
              </h1>
            )}
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            {isEditing ? (
              <Textarea
                className="text-[18px] text-text-secondary leading-relaxed max-w-[600px] border-t border-b border-border/50 py-4 mt-4 resize-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-accent rounded-none"
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                placeholder="Mô tả..."
                rows={4}
              />
            ) : (
              <p className="text-[18px] text-text-secondary leading-relaxed mb-16 max-w-[600px] whitespace-pre-wrap">
                {data.description}
              </p>
            )}
          </ScrollReveal>
        </div>

        {isEditing && (
          <div
            className="mb-6 flex flex-col gap-3 rounded-[20px] border border-border-default bg-background/90 p-3 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-4"
            data-inline-editor-bar
          >
            <h2 className="min-w-0 text-[12px] font-bold uppercase tracking-widest text-editorial sm:text-sm">
              Đang chỉnh sửa Nguồn tham khảo
            </h2>
            <div className="flex gap-2 sm:justify-end">
              <Button
                variant="outline"
                className="flex-1 rounded-full border-border-default font-bold sm:flex-none"
                aria-label="Hủy chỉnh sửa"
                title="Hủy chỉnh sửa"
                onClick={() => {
                  setData(initialData)
                  setDraftResource(createEmptyResource())
                  setIsCreatingResource(false)
                  setIsEditing(false)
                }}
                disabled={isSaving}
              >
                <X aria-hidden="true" className="mr-2 h-4 w-4" />
                Hủy
              </Button>
              <Button
                aria-label={isSaving ? "Đang lưu trang" : "Lưu trang"}
                className="flex-1 rounded-full bg-accent font-bold text-white hover:bg-accent/90 sm:flex-none"
                onClick={handleSave}
                disabled={isSaving}
                title={isSaving ? "Đang lưu trang" : "Lưu trang"}
              >
                <Save aria-hidden="true" className="mr-2 h-4 w-4" />
                {isSaving ? "Đang lưu" : "Lưu trang"}
              </Button>
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="glass-card flex min-h-[520px] flex-col overflow-hidden border-accent/20 p-0 lg:h-[720px]">
              <div className="flex flex-col gap-4 border-b border-border-default/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-[24px] font-bold text-text-primary">
                    Thư viện nguồn
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Chọn một nguồn để sửa, hoặc kéo từng hàng để đổi thứ tự hiển thị.
                  </p>
                </div>
                <Button
                  className="w-full bg-accent text-white hover:bg-accent/90 sm:w-auto"
                  onClick={startCreatingResource}
                >
                  <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
                  Nguồn mới
                </Button>
              </div>

              <div className="border-b border-border-default/70 p-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    className={cn(
                      "shrink-0 rounded-full border border-border-default bg-background/70 px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-accent hover:text-text-primary",
                      activeCategory === null &&
                        "border-accent bg-accent/10 text-text-primary",
                    )}
                    onClick={() => setActiveCategory(null)}
                  >
                    Tất cả
                    <span className="ml-2 text-text-tertiary">
                      {data.resources.length}
                    </span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={cn(
                        "shrink-0 rounded-full border border-border-default bg-background/70 px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-accent hover:text-text-primary",
                        activeCategory === category &&
                          "border-accent bg-accent/10 text-text-primary",
                      )}
                      onClick={() => {
                        setActiveCategory(category)
                      }}
                    >
                      {category}
                      <span className="ml-2 text-text-tertiary">
                        {
                          data.resources.filter(
                            (resource) => (resource.category || "Khác") === category,
                          ).length
                        }
                      </span>
                    </button>
                  ))}
                  <button
                    aria-label="Thêm phân loại mới"
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-accent/50 bg-background/70 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/10"
                    onClick={() => setIsAddingCategory((value) => !value)}
                  >
                    <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                    Phân loại
                  </button>
                </div>
                {isAddingCategory && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      aria-label="Tên phân loại mới"
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          createCategory()
                        }
                      }}
                      placeholder="Tên phân loại mới..."
                      value={newCategoryName}
                    />
                    <Button
                      className="bg-accent text-white hover:bg-accent/90"
                      onClick={createCategory}
                      type="button"
                    >
                      Tạo
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid flex-1 content-start gap-2 overflow-y-auto p-3">
                {isCreatingResource && (
                  <div className="rounded-[16px] border border-dashed border-accent bg-accent/10 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-background text-sm font-bold text-accent">
                        {getDomainInitial(draftResource.domain)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-text-primary">
                          {draftResource.domain || "Nguồn mới chưa đặt tên"}
                        </p>
                        <p className="truncate text-xs text-text-secondary">
                          {draftResource.url || "Điền thông tin ở khung bên phải"}
                        </p>
                      </div>
                      <span className="rounded-full bg-background px-2 py-1 text-[11px] font-bold text-accent">
                        Nháp
                      </span>
                    </div>
                  </div>
                )}

                {filteredResourceEntries.map(({ resource, index }, visibleIndex) => (
                  <div
                    key={`${resource.url}-${index}`}
                    className={cn(
                      "group/resource grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[16px] border border-border-default bg-background/70 p-3 transition-all hover:border-accent/50 hover:bg-background",
                      !isCreatingResource &&
                        selectedResourceIndex === index &&
                        "border-accent bg-accent/10 shadow-sm",
                    )}
                    data-testid={`resource-editor-card-${resource.domain}`}
                    draggable
                    onDragOver={handleResourceDragOver}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move"
                      setDraggedResourceIndex(index)
                    }}
                    onDrop={(event) => handleResourceDrop(event, index)}
                  >
                    <div
                      aria-label={`Kéo ${resource.domain} để sắp xếp`}
                      role="button"
                      tabIndex={0}
                      title={`Kéo ${resource.domain} để sắp xếp`}
                      className="flex h-9 w-9 cursor-grab items-center justify-center rounded-[5px] text-text-tertiary transition-colors hover:bg-subtle-bg hover:text-text-primary active:cursor-grabbing"
                    >
                      <GripVertical aria-hidden="true" className="h-4 w-4" />
                    </div>

                    <button
                      type="button"
                      className="min-w-0 text-left"
                      onClick={() => {
                        setSelectedResourceIndex(index)
                        setIsCreatingResource(false)
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-sm font-bold text-text-primary shadow-sm",
                            isAvatarLogo(resource.logo || "") ? "p-0" : "p-2",
                          )}
                        >
                          <ResourceLogo logo={resource.logo} alt={""} fallback={getDomainInitial(resource.domain)} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-text-primary">
                            {resource.domain || "Nguồn chưa đặt tên"}
                          </span>
                          <span className="block truncate text-xs text-text-secondary">
                            {resource.url || "Chưa có URL"}
                          </span>
                        </span>
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      <span className="hidden rounded-full border border-border-default bg-background/70 px-2 py-1 text-[11px] font-bold text-text-secondary sm:inline-flex">
                        {resource.category || "Khác"}
                      </span>
                      <Button
                        aria-label={`Đưa ${resource.domain} lên`}
                        title={`Đưa ${resource.domain} lên`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          moveVisibleResource(visibleIndex, -1)
                        }}
                      >
                        <ArrowUp aria-hidden="true" className="h-4 w-4" />
                      </Button>
                      <Button
                        aria-label={`Đưa ${resource.domain} xuống`}
                        title={`Đưa ${resource.domain} xuống`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          moveVisibleResource(visibleIndex, 1)
                        }}
                      >
                        <ArrowDown aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="glass-card flex min-h-[520px] flex-col overflow-hidden border-accent/20 p-0 lg:sticky lg:top-24 lg:h-[720px]">
              <div className="flex items-start justify-between gap-4 border-b border-border-default/70 p-5 pb-4">
                <div>
                  <h2 className="font-display text-[24px] font-bold text-text-primary">
                    {isCreatingResource ? "Thêm nguồn mới" : "Sửa nguồn"}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {isCreatingResource
                      ? "Điền thông tin một lần, xem preview, rồi thêm vào danh sách."
                      : "Mọi thay đổi ở đây nằm trong bản nháp trang cho tới khi bấm lưu."}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {editorResource.url && (
                    <Button
                      aria-label="Mở nguồn trong tab mới"
                      asChild
                      size="icon"
                      title="Mở nguồn trong tab mới"
                      variant="ghost"
                    >
                      <a
                        href={editorResource.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    aria-label={
                      isCreatingResource ? "Hủy nguồn mới" : "Xóa nguồn đang chọn"
                    }
                    className="text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={deleteSelectedResource}
                    size="icon"
                    title={
                      isCreatingResource ? "Hủy nguồn mới" : "Xóa nguồn đang chọn"
                    }
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                    URL
                  </span>
                  <div className="relative">
                    <Link2
                      aria-hidden="true"
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
                    />
                    <Input
                      className="pl-9"
                      onChange={(event) => {
                        const value = event.target.value
                        if (isCreatingResource) {
                          setDraftResource((resource) => ({
                            ...resource,
                            domain: resource.domain || getUrlHostname(value),
                            url: value,
                          }))
                          return
                        }
                        updateResource(selectedResourceIndex, { url: value })
                      }}
                      placeholder="https://..."
                      value={editorResource.url}
                    />
                  </div>
                </label>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                      Tên nguồn
                    </span>
                    <Input
                      onChange={(event) => {
                        const value = event.target.value
                        if (isCreatingResource) {
                          setDraftResource((resource) => ({
                            ...resource,
                            domain: value,
                          }))
                          return
                        }
                        updateResource(selectedResourceIndex, { domain: value })
                      }}
                      placeholder="Sakugabooru Blog"
                      value={editorResource.domain}
                    />
                  </label>

                  <div className="relative block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                      Phân loại
                    </span>
                    <button
                      aria-expanded={isCategoryMenuOpen}
                      aria-label="Chọn phân loại"
                      className="flex h-10 w-full items-center justify-between rounded-[5px] border border-border-default bg-background px-3 py-2 text-left text-sm text-text-primary ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => setIsCategoryMenuOpen((value) => !value)}
                      type="button"
                    >
                      <span className="truncate">
                        {editorCategory || "Chọn phân loại"}
                      </span>
                      <ChevronDown aria-hidden="true" className="h-4 w-4 text-text-tertiary" />
                    </button>
                    {isCategoryMenuOpen && (
                      <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-[12px] border border-border-default bg-background shadow-xl">
                        <div className="max-h-56 overflow-y-auto p-1">
                          {categories.map((category) => (
                            <button
                              key={category}
                              className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-accent/10 hover:text-text-primary"
                              onClick={() => selectCategory(category)}
                              type="button"
                            >
                              <span>{category}</span>
                              {editorCategory === category && (
                                <Check aria-hidden="true" className="h-4 w-4 text-accent" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-border-default p-2">
                          <div className="flex gap-2">
                            <Input
                              aria-label="Tạo phân loại từ menu"
                              className="h-9"
                              onChange={(event) => setNewCategoryName(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault()
                                  const category = newCategoryName.trim()
                                  if (category) {
                                    selectCategory(category)
                                    setActiveCategory(category)
                                    setNewCategoryName("")
                                  }
                                }
                              }}
                              placeholder="Phân loại mới..."
                              value={newCategoryName}
                            />
                            <Button
                              aria-label="Tạo phân loại"
                              className="h-9 bg-accent px-3 text-white hover:bg-accent/90"
                              onClick={() => {
                                const category = newCategoryName.trim()
                                if (category) {
                                  selectCategory(category)
                                  setActiveCategory(category)
                                  setNewCategoryName("")
                                }
                              }}
                              type="button"
                            >
                              <Plus aria-hidden="true" className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                    Logo
                  </span>
                  <Input
                    onChange={(event) => {
                      const value = event.target.value
                      if (isCreatingResource) {
                        setDraftResource((resource) => ({
                          ...resource,
                          logo: value,
                        }))
                        return
                      }
                      updateResource(selectedResourceIndex, { logo: value })
                    }}
                    placeholder="/logos/source.png hoặc X"
                    value={editorResource.logo}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                    Mô tả
                  </span>
                  <Textarea
                    className="min-h-[150px] resize-y text-sm leading-relaxed"
                    onChange={(event) => {
                      const value = event.target.value
                      if (isCreatingResource) {
                        setDraftResource((resource) => ({
                          ...resource,
                          description: value,
                        }))
                        return
                      }
                      updateResource(selectedResourceIndex, { description: value })
                    }}
                    placeholder="Nguồn này hữu ích vì..."
                    value={editorResource.description}
                  />
                </label>

                {duplicateUrl && (
                  <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600">
                    URL này đã có trong danh sách.
                  </div>
                )}

                <div className="rounded-[16px] border border-border-default bg-background/70 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-text-tertiary">
                    Preview
                  </p>
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-sm font-bold text-text-primary shadow-sm",
                        isAvatarLogo(editorResource.logo || "") ? "p-0" : "p-2",
                      )}
                    >
                      <ResourceLogo logo={editorResource.logo} alt={""} fallback={getDomainInitial(editorResource.domain)} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-[20px] font-bold text-text-primary">
                        {editorResource.domain || "Tên nguồn"}
                      </h3>
                      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-text-secondary">
                        {editorResource.description ||
                          "Mô tả ngắn giúp người đọc hiểu vì sao nguồn này đáng tham khảo."}
                      </p>
                    </div>
                  </div>
                </div>

                {isCreatingResource && (
                  <div className="flex flex-col-reverse gap-2 border-t border-border-default pt-4 sm:flex-row sm:justify-end">
                    <Button
                      onClick={() => {
                        setDraftResource(createEmptyResource())
                        setIsCreatingResource(false)
                      }}
                      type="button"
                      variant="outline"
                    >
                      Hủy
                    </Button>
                    <Button
                      className="bg-accent text-white hover:bg-accent/90"
                      disabled={!editorResource.url.trim() || duplicateUrl}
                      onClick={addDraftResource}
                      type="button"
                    >
                      <FolderPlus aria-hidden="true" className="mr-2 h-4 w-4" />
                      Thêm vào danh sách
                    </Button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div className="space-y-16">
            {categories.map((category) => (
              <div key={category}>
                <ScrollReveal delay={0.1}>
                  <h2 className="mb-6 flex items-center gap-3 font-display text-[24px] font-bold text-text-primary">
                    <span className="inline-block h-[2px] w-8 rounded-full bg-accent"></span>
                    {category}
                  </h2>
                </ScrollReveal>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {data.resources
                    .map((resource, index) => ({ resource, index }))
                    .filter(
                      ({ resource }) => (resource.category || "Khác") === category,
                    )
                    .map(({ resource, index }) => {
                      const isLink = resource.isLink !== false

                      const cardContent = (
                        <>
                          <div className="absolute right-0 top-0 p-4 opacity-0 transition-opacity duration-300 translate-x-2 group-hover/resource:translate-x-0 group-hover/resource:opacity-100">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-accent"
                            >
                              <path d="M7 17l9.2-9.2M17 17V7H7" />
                            </svg>
                          </div>

                          <div className="mb-4 flex items-center gap-4">
                            <div
                              className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background shadow-sm",
                                isAvatarLogo(resource.logo || "") ? "p-0" : "p-2",
                              )}
                            >
                              <ResourceLogo logo={resource.logo} alt={`${resource.domain} logo`} iconClassName="text-text-primary" />
                            </div>

                            <h3 className="font-display text-[20px] font-bold text-text-primary transition-colors group-hover/resource:text-accent">
                              {resource.domain}
                            </h3>
                          </div>

                          <p className="text-[14px] leading-relaxed text-text-secondary">
                            {resource.description}
                          </p>
                        </>
                      )

                      const commonClasses = "glass-card group/resource relative block overflow-hidden p-6"

                      if (isLink) {
                        return (
                          <ScrollReveal
                            key={index}
                            transition={{
                              delay: Math.min(index * 0.04, 0.12),
                              duration: 0.35,
                              ease: [0.2, 0.65, 0.3, 0.9],
                            }}
                          >
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={commonClasses}
                            >
                              {cardContent}
                            </a>
                          </ScrollReveal>
                        )
                      }

                      return (
                        <ScrollReveal
                          key={index}
                          transition={{
                            delay: Math.min(index * 0.04, 0.12),
                            duration: 0.35,
                            ease: [0.2, 0.65, 0.3, 0.9],
                          }}
                        >
                          <div className={commonClasses}>{cardContent}</div>
                        </ScrollReveal>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
