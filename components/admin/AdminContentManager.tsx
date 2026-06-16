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
  }

  function resetTagForm() {
    setTagForm({ name: "" })
    setEditingTagId(null)
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

  async function deleteCategory(category: CategoryItem) {
    const impact =
      category._count.posts > 0
        ? ` This category is used by ${category._count.posts} post${category._count.posts === 1 ? "" : "s"}; deleting it will remove the category from those posts.`
        : ""

    if (!window.confirm(`Delete category "${category.name}"?${impact}`)) {
      return
    }

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

  async function deleteTag(tag: TagItem) {
    const impact =
      tag._count.posts > 0
        ? ` This tag is used by ${tag._count.posts} post${tag._count.posts === 1 ? "" : "s"}; deleting it will remove the tag from those posts.`
        : ""

    if (!window.confirm(`Delete tag "${tag.name}"?${impact}`)) {
      return
    }

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

      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to delete tag")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        <div className="mb-4 inline-flex w-fit gap-1 rounded-[7px] border border-border-default bg-subtle-bg/50 p-[3px]">
          {[
            { icon: FolderTree, id: "categories" as const, label: "Categories" },
            { icon: Tags, id: "tags" as const, label: "Tags" },
          ].map(({ icon: Icon, id, label }) => {
            const active = activeTab === id

            return (
              <button
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:text-text-primary",
                  active &&
                    "bg-background font-semibold text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
                )}
                key={id}
                onClick={() => {
                  setActiveTab(id)
                  setError("")
                }}
                type="button"
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                {label}
              </button>
            )
          })}
        </div>

        {activeTab === "categories" ? (
          <div className="w-full overflow-x-auto rounded-[8px] border border-border-default bg-background">
            <div className="min-w-[680px]">
              <div className="flex h-[40px] items-center border-b border-border-default bg-subtle-bg px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
                <div className="min-w-0 flex-1 pr-4">Category</div>
                <div className="w-[120px] shrink-0 text-right">Posts</div>
                <div className="w-[120px] shrink-0 text-right">Children</div>
                <div className="w-[96px] shrink-0 text-right">Actions</div>
              </div>
              {categoryRows.map(({ category, depth }) => (
                <div
                  className="flex min-h-[56px] items-center border-b border-border-default px-4 last:border-0 hover:bg-subtle-bg"
                  key={category.id}
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div
                      className="truncate text-[13px] font-medium text-text-primary"
                      style={{ paddingLeft: depth * 18 }}
                    >
                      {depth > 0 && "↳ "}
                      {category.name}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-text-tertiary">
                      /category/{category.slug}
                    </div>
                  </div>
                  <div className="w-[120px] shrink-0 text-right text-[13px] text-text-secondary">
                    {category._count.posts}
                  </div>
                  <div className="w-[120px] shrink-0 text-right text-[13px] text-text-secondary">
                    {category._count.children}
                  </div>
                  <div className="flex w-[96px] shrink-0 justify-end gap-1">
                    <Button
                      aria-label={`Edit category ${category.name}`}
                      onClick={() => {
                        setEditingCategoryId(category.id)
                        setCategoryForm({
                          description: category.description ?? "",
                          name: category.name,
                          parentId: category.parentId ?? "",
                        })
                      }}
                      size="icon"
                      title="Edit category"
                      type="button"
                      variant="ghost"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    <Button
                      aria-label={`Delete category ${category.name}`}
                      onClick={() => void deleteCategory(category)}
                      size="icon"
                      title="Delete category"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {categoryRows.length === 0 && (
                <p className="p-6 text-sm text-text-tertiary">
                  No categories yet.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-[8px] border border-border-default bg-background">
            <div className="min-w-[520px]">
              <div className="flex h-[40px] items-center border-b border-border-default bg-subtle-bg px-4 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
                <div className="min-w-0 flex-1 pr-4">Tag</div>
                <div className="w-[120px] shrink-0 text-right">Posts</div>
                <div className="w-[96px] shrink-0 text-right">Actions</div>
              </div>
              {tags.map((tag) => (
                <div
                  className="flex min-h-[56px] items-center border-b border-border-default px-4 last:border-0 hover:bg-subtle-bg"
                  key={tag.id}
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="truncate text-[13px] font-medium text-text-primary">
                      {tag.name}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[11px] text-text-tertiary">
                      /tag/{tag.slug}
                    </div>
                  </div>
                  <div className="w-[120px] shrink-0 text-right text-[13px] text-text-secondary">
                    {tag._count.posts}
                  </div>
                  <div className="flex w-[96px] shrink-0 justify-end gap-1">
                    <Button
                      aria-label={`Edit tag ${tag.name}`}
                      onClick={() => {
                        setEditingTagId(tag.id)
                        setTagForm({ name: tag.name })
                      }}
                      size="icon"
                      title="Edit tag"
                      type="button"
                      variant="ghost"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    <Button
                      aria-label={`Delete tag ${tag.name}`}
                      onClick={() => void deleteTag(tag)}
                      size="icon"
                      title="Delete tag"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {tags.length === 0 && (
                <p className="p-6 text-sm text-text-tertiary">No tags yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <aside className="rounded-[8px] border border-border-default bg-background p-5">
        {error && (
          <div
            className="mb-4 rounded-[6px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        {activeTab === "categories" ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-text-primary">
                  {editingCategoryId ? "Edit category" : "Add category"}
                </h2>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Categories can be top-level or nested one level deep.
                </p>
              </div>
              {editingCategoryId && (
                <Button
                  aria-label="Cancel category edit"
                  onClick={resetCategoryForm}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-text-secondary" htmlFor="category-name">
                Name
              </label>
              <Input
                id="category-name"
                maxLength={80}
                onChange={(event) =>
                  setCategoryForm({ ...categoryForm, name: event.target.value })
                }
                value={categoryForm.name}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-text-secondary" htmlFor="category-parent">
                Parent
              </label>
              <select
                className="h-10 w-full rounded-[5px] border border-border-default bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
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

            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-text-secondary" htmlFor="category-description">
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
              />
            </div>

            <Button
              className="w-full"
              disabled={isPending || !categoryForm.name.trim()}
              onClick={() => void submitCategory()}
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {editingCategoryId ? "Save category" : "Add category"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-text-primary">
                  {editingTagId ? "Edit tag" : "Add tag"}
                </h2>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Tags stay flat and can be created by writers in the editor.
                </p>
              </div>
              {editingTagId && (
                <Button
                  aria-label="Cancel tag edit"
                  onClick={resetTagForm}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-text-secondary" htmlFor="tag-name">
                Name
              </label>
              <Input
                id="tag-name"
                maxLength={50}
                onChange={(event) => setTagForm({ name: event.target.value })}
                value={tagForm.name}
              />
            </div>

            <Button
              className="w-full"
              disabled={isPending || !tagForm.name.trim()}
              onClick={() => void submitTag()}
              type="button"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {editingTagId ? "Save tag" : "Add tag"}
            </Button>
          </div>
        )}
      </aside>
    </div>
  )
}
