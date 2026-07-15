"use client"

import { FolderTree, Pencil, Plus, Tags, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface CategoryItem {
  _count: { children: number; posts: number }
  children?: CategoryItem[]
  description: string | null
  id: string
  name: string
  parentId: string | null
  slug: string
}

interface TagItem {
  _count: { posts: number }
  id: string
  name: string
  slug: string
}

interface CategoryFormState {
  description: string
  name: string
  parentId: string
}

interface TagFormState {
  name: string
}

type Tab = "categories" | "tags"

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

function flattenCategories(categories: CategoryItem[]) {
  return categories.flatMap((category) => [
    category,
    ...(category.children ?? []).map((child) => ({
      ...child,
      name: `${category.name} / ${child.name}`,
    })),
  ])
}

export function AdminContentManager({
  categories,
  tags,
}: {
  categories: CategoryItem[]
  tags: TagItem[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("categories")
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({
    description: "",
    name: "",
    parentId: "",
  })
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: "category" | "tag"
    item: CategoryItem | TagItem
    impact: string
  } | null>(null)
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [tagForm, setTagForm] = useState<TagFormState>({ name: "" })

  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  )
  const categoryRows = useMemo(
    () =>
      categories.flatMap((category) => [
        { category, depth: 0 },
        ...(category.children ?? []).map((child) => ({ category: child, depth: 1 })),
      ]),
    [categories],
  )

  function resetCategoryForm() {
    setCategoryForm({ description: "", name: "", parentId: "" })
    setEditingCategoryId(null)
    setIsModalOpen(false)
    setError("")
  }

  function resetTagForm() {
    setTagForm({ name: "" })
    setEditingTagId(null)
    setIsModalOpen(false)
    setError("")
  }

  function openAddModal(tab: Tab) {
    setActiveTab(tab)
    if (tab === "categories") {
      setCategoryForm({ description: "", name: "", parentId: "" })
      setEditingCategoryId(null)
    } else {
      setTagForm({ name: "" })
      setEditingTagId(null)
    }
    setIsModalOpen(true)
    setError("")
  }

  function openAddChildModal(parentId: string) {
    setCategoryForm({ description: "", name: "", parentId })
    setEditingCategoryId(null)
    setIsModalOpen(true)
    setError("")
  }

  async function submitCategory() {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch(
        editingCategoryId
          ? `/api/admin/content/categories/${editingCategoryId}`
          : "/api/admin/content/categories",
        {
          body: JSON.stringify({
            description: categoryForm.description,
            name: categoryForm.name,
            parentId: categoryForm.parentId || null,
          }),
          headers: { "Content-Type": "application/json" },
          method: editingCategoryId ? "PATCH" : "POST",
        },
      )
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      resetCategoryForm()
      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save category",
      )
    } finally {
      setIsPending(false)
    }
  }

  async function performDeleteCategory(category: CategoryItem) {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch(`/api/admin/content/categories/${category.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setDeleteConfirmation(null)
      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to delete category",
      )
    } finally {
      setIsPending(false)
    }
  }

  async function submitTag() {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch(
        editingTagId ? `/api/admin/content/tags/${editingTagId}` : "/api/admin/content/tags",
        {
          body: JSON.stringify({ name: tagForm.name }),
          headers: { "Content-Type": "application/json" },
          method: editingTagId ? "PATCH" : "POST",
        },
      )
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      resetTagForm()
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to save tag")
    } finally {
      setIsPending(false)
    }
  }

  async function performDeleteTag(tag: TagItem) {
    setError("")
    setIsPending(true)

    try {
      const response = await fetch(`/api/admin/content/tags/${tag.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setDeleteConfirmation(null)
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to delete tag")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="w-full">
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[32px] border border-border-default/50 bg-background/95 backdrop-blur-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <h2 className="text-[18px] font-bold text-text-primary mb-2">
              Delete {deleteConfirmation.type === "category" ? "Category" : "Tag"}
            </h2>
            <p className="text-[14px] text-text-secondary mb-4">
              Are you sure you want to delete <span className="font-bold text-text-primary">&quot;{deleteConfirmation.item.name}&quot;</span>?
            </p>
            {deleteConfirmation.impact && (
              <div className="mb-6 rounded-[12px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive shadow-sm">
                {deleteConfirmation.impact}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirmation(null)}
                className="h-11 rounded-[12px] px-6 font-semibold hover:bg-subtle-bg transition-colors"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (deleteConfirmation.type === "category") {
                    void performDeleteCategory(deleteConfirmation.item as CategoryItem)
                  } else {
                    void performDeleteTag(deleteConfirmation.item as TagItem)
                  }
                }}
                className="h-11 rounded-[12px] bg-destructive px-6 font-bold text-white shadow-md shadow-destructive/20 transition-all hover:scale-[1.02] hover:shadow-destructive/40 hover:bg-destructive/90"
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[32px] border border-border-default/50 bg-background/95 backdrop-blur-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={activeTab === "categories" ? resetCategoryForm : resetTagForm}
              className="absolute right-6 top-6 rounded-full p-1.5 text-text-secondary hover:bg-subtle-bg hover:text-text-primary transition-colors"
            >
              <X className="h-5 w-5"/>
            </button>

            {error && (
              <div className="mb-6 rounded-[12px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive shadow-sm">
                {error}
              </div>
            )}

            {activeTab === "categories" ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-bold text-text-primary">
                    {editingCategoryId ? "Edit Category" : "Add Category"}
                  </h2>
                  <p className="mt-1 text-[13px] text-text-tertiary">
                    Categories can be top-level or nested one level deep.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-text-secondary ml-1" htmlFor="category-name">
                    Name
                  </label>
                  <Input
                    id="category-name"
                    maxLength={80}
                    onChange={(event) =>
                      setCategoryForm({ ...categoryForm, name: event.target.value })
                    }
                    value={categoryForm.name}
                    className="h-11 rounded-[12px] border-border-default/60 bg-subtle-bg/30 px-4 focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20 transition-all text-[14px]"
                    placeholder="e.g. Analysis"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-text-secondary ml-1" htmlFor="category-parent">
                    Parent
                  </label>
                  <select
                    className="h-11 w-full rounded-[12px] border border-border-default/60 bg-subtle-bg/30 px-4 text-[14px] text-text-primary outline-none focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20 transition-all appearance-none cursor-pointer"
                    id="category-parent"
                    onChange={(event) =>
                      setCategoryForm({
                        ...categoryForm,
                        parentId: event.target.value,
                      })
                    }
                    value={categoryForm.parentId}
                  >
                    <option value="">No parent</option>
                    {flatCategories
                      .filter((category) => category.id !== editingCategoryId)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-text-secondary ml-1" htmlFor="category-description">
                    Description
                  </label>
                  <Textarea
                    id="category-description"
                    maxLength={500}
                    onChange={(event) =>
                      setCategoryForm({
                        ...categoryForm,
                        description: event.target.value,
                      })
                    }
                    rows={4}
                    value={categoryForm.description}
                    className="rounded-[12px] border-border-default/60 bg-subtle-bg/30 p-4 focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20 transition-all text-[14px] resize-none"
                    placeholder="Optional description..."
                  />
                </div>

                <Button
                  className="w-full h-11 rounded-[12px] bg-accent font-bold text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.02] hover:shadow-accent/40"
                  disabled={isPending || !categoryForm.name.trim()}
                  onClick={() => void submitCategory()}
                  type="button"
                >
                  {editingCategoryId ? "Save changes" : "Create category"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[18px] font-bold text-text-primary">
                    {editingTagId ? "Edit Tag" : "Add Tag"}
                  </h2>
                  <p className="mt-1 text-[13px] text-text-tertiary">
                    Tags stay flat and can be created by writers in the editor.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-text-secondary ml-1" htmlFor="tag-name">
                    Name
                  </label>
                  <Input
                    id="tag-name"
                    maxLength={50}
                    onChange={(event) => setTagForm({ name: event.target.value })}
                    value={tagForm.name}
                    className="h-11 rounded-[12px] border-border-default/60 bg-subtle-bg/30 px-4 focus:border-accent focus:bg-background focus:ring-2 focus:ring-accent/20 transition-all text-[14px]"
                    placeholder="e.g. sakuga"
                  />
                </div>

                <Button
                  className="w-full h-11 rounded-[12px] bg-accent font-bold text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.02] hover:shadow-accent/40"
                  disabled={isPending || !tagForm.name.trim()}
                  onClick={() => void submitTag()}
                  type="button"
                >
                  {editingTagId ? "Save changes" : "Create tag"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid items-stretch gap-8 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col rounded-[24px] border border-border-default/70 bg-background/75 p-4 shadow-sm backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FolderTree aria-hidden="true" className="h-4 w-4 text-accent" />
              <h2 className="text-[16px] font-bold text-text-primary">Categories</h2>
            </div>
            <Button
              aria-label="Add category"
              className="h-10 w-10 rounded-full bg-accent p-0 font-bold text-white shadow-md shadow-accent/20 transition-all hover:scale-105 hover:shadow-accent/40"
              onClick={() => openAddModal("categories")}
              title="Add category"
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
          <div
            className="min-h-0 w-full flex-1 overflow-x-auto pb-4"
            data-testid="category-management-scroll"
          >
            <div className="min-w-[680px] flex flex-col gap-2">
              <div className="flex h-10 items-center px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                <div className="min-w-0 flex-1 pr-4">Category</div>
                <div className="w-[120px] shrink-0 text-right">Posts</div>
                <div className="w-[120px] shrink-0 text-right">Children</div>
                <div className="w-[80px] shrink-0 text-right opacity-0">Actions</div>
              </div>
              <div className="flex flex-col gap-3">
                {categoryRows.map(({ category, depth }, index) => (
                  <div
                    className={cn(
                      "group relative flex items-center rounded-[20px] border border-transparent bg-subtle-bg/40 p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 hover:border-accent/30 hover:bg-white/60 hover:shadow-md dark:hover:bg-white/10",
                      depth === 1 && "ml-6 border-l-2 border-l-border-default/30"
                    )}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                    key={category.id}
                  >
                    <div className="min-w-0 flex-1 pr-4 pl-2">
                      <div className="truncate text-[14px] font-bold text-text-primary">
                        {category.name}
                      </div>
                      <div className="mt-1 truncate font-mono text-[11px] text-text-tertiary">
                        /category/{category.slug}
                      </div>
                    </div>
                    <div className="w-[120px] shrink-0 text-right text-[13px] font-medium text-text-secondary">
                      {category._count.posts}
                    </div>
                    <div className="w-[120px] shrink-0 text-right text-[13px] font-medium text-text-secondary">
                      {category._count.children}
                    </div>
                    <div className="w-[140px] shrink-0" />

                    <div className="absolute right-4 flex items-center justify-end gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100 bg-background/95 backdrop-blur-md rounded-[12px] shadow-sm border border-border-default/50 p-1.5 translate-x-4 group-hover:translate-x-0">
                      {depth === 0 && (
                        <Button
                          aria-label={`Add child to ${category.name}`}
                          onClick={() => openAddChildModal(category.id)}
                          className="h-8 w-8 rounded-[8px] p-0 hover:bg-subtle-bg text-text-secondary hover:text-text-primary transition-colors"
                          title="Add child category"
                          type="button"
                          variant="ghost"
                        >
                          <Plus aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        aria-label={`Edit category ${category.name}`}
                        onClick={() => {
                          setEditingCategoryId(category.id)
                          setCategoryForm({
                            description: category.description ?? "",
                            name: category.name,
                            parentId: category.parentId ?? "",
                          })
                          setIsModalOpen(true)
                        }}
                        className="h-8 w-8 rounded-[8px] p-0 hover:bg-subtle-bg text-text-secondary hover:text-text-primary transition-colors"
                        title="Edit category"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                      </Button>
                      <Button
                        aria-label={`Delete category ${category.name}`}
                        onClick={() => {
                          const impact = category._count.posts > 0
                            ? `This category is used by ${category._count.posts} post${category._count.posts === 1 ? "" : "s"}; deleting it will remove the category from those posts.`
                            : ""
                          setDeleteConfirmation({ type: "category", item: category, impact })
                        }}
                        className="h-8 w-8 rounded-[8px] p-0 hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
                        title="Delete category"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {categoryRows.length === 0 && (
                  <div className="rounded-[24px] border border-dashed border-border-default/50 bg-subtle-bg/20 p-8 text-center text-sm text-text-tertiary">
                    No categories yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-[24px] border border-border-default/70 bg-background/75 p-4 shadow-sm backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Tags aria-hidden="true" className="h-4 w-4 text-accent" />
              <h2 className="text-[16px] font-bold text-text-primary">Tags</h2>
            </div>
            <Button
              aria-label="Add tag"
              className="h-10 w-10 rounded-full bg-accent p-0 font-bold text-white shadow-md shadow-accent/20 transition-all hover:scale-105 hover:shadow-accent/40"
              onClick={() => openAddModal("tags")}
              title="Add tag"
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
          <div
            className="min-h-0 w-full flex-1 overflow-x-auto pb-4"
            data-testid="tag-management-scroll"
          >
            <div className="min-w-[520px] flex flex-col gap-2">
              <div className="flex h-10 items-center px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                <div className="min-w-0 flex-1 pr-4">Tag</div>
                <div className="w-[120px] shrink-0 text-right">Posts</div>
                <div className="w-[80px] shrink-0 text-right opacity-0">Actions</div>
              </div>
              <div className="flex flex-col gap-3">
                {tags.map((tag, index) => (
                  <div
                    className="group relative flex items-center rounded-[20px] border border-transparent bg-subtle-bg/40 p-4 transition-all duration-300 hover:border-accent/30 hover:bg-white/60 hover:shadow-md dark:hover:bg-white/10 animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                    key={tag.id}
                  >
                    <div className="min-w-0 flex-1 pr-4 pl-2">
                      <div className="truncate text-[14px] font-bold text-text-primary">
                        {tag.name}
                      </div>
                      <div className="mt-1 truncate font-mono text-[11px] text-text-tertiary">
                        /tag/{tag.slug}
                      </div>
                    </div>
                    <div className="w-[120px] shrink-0 text-right text-[13px] font-medium text-text-secondary">
                      {tag._count.posts}
                    </div>
                    <div className="w-[140px] shrink-0" />

                    <div className="absolute right-4 flex items-center justify-end gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100 bg-background/95 backdrop-blur-md rounded-[12px] shadow-sm border border-border-default/50 p-1.5 translate-x-4 group-hover:translate-x-0">
                      <Button
                        aria-label={`Edit tag ${tag.name}`}
                        onClick={() => {
                          setEditingTagId(tag.id)
                          setTagForm({ name: tag.name })
                          setIsModalOpen(true)
                        }}
                        className="h-8 w-8 rounded-[8px] p-0 hover:bg-subtle-bg text-text-secondary hover:text-text-primary transition-colors"
                        title="Edit tag"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                      </Button>
                      <Button
                        aria-label={`Delete tag ${tag.name}`}
                        onClick={() => {
                          const impact = tag._count.posts > 0
                            ? `This tag is used by ${tag._count.posts} post${tag._count.posts === 1 ? "" : "s"}; deleting it will remove the tag from those posts.`
                            : ""
                          setDeleteConfirmation({ type: "tag", item: tag, impact })
                        }}
                        className="h-8 w-8 rounded-[8px] p-0 hover:bg-accent/10 text-text-secondary hover:text-accent transition-colors"
                        title="Delete tag"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {tags.length === 0 && (
                  <div className="rounded-[24px] border border-dashed border-border-default/50 bg-subtle-bg/20 p-8 text-center text-sm text-text-tertiary">
                    No tags yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
