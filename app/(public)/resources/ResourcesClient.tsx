"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Save, X, BookOpen } from "lucide-react"
import type { Editor, JSONContent } from "@tiptap/react"
import Link from "next/link"

import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { PostBody } from "@/components/posts/PostBody"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { CoverImageUpload } from "@/components/posts/CoverImageUpload"
import { cn } from "@/lib/utils"

interface ResourceCard {
  url: string
  domain: string
  logo: string
  description: string
  category?: string
  isLink?: boolean
}

interface ResourcesData {
  title: string
  description: string
  body?: JSONContent
  coverUrl?: string
  resources?: ResourceCard[]
}

interface ResourcesClientProps {
  initialPage: { content: unknown; contentText: string | null } | null
  isAdmin: boolean
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

function isResourcesData(value: unknown): value is ResourcesData {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    "description" in value
  )
}

const defaultResources: ResourceCard[] = [
  {
    url: "https://blog.sakugabooru.com/",
    domain: "Sakugabooru Blog",
    logo: "/logos/sakuga-blog.png",
    description: "Blog chuyên sâu về sakuga uy tín bậc nhất trong cộng đồng.",
    category: "Blog",
  },
  {
    url: "https://artistunknown.info/",
    domain: "ArtistUnknown",
    logo: "/logos/artistunknown.jpg",
    description: "Trang blog chuyên sâu về phân tích sakuga và quy trình sản xuất anime.",
    category: "Blog",
  },
  {
    url: "https://fullfrontal.moe/",
    domain: "fullfrontal.moe",
    logo: "/logos/fullfrontal.png",
    description: "Chuyên trang uy tín về diễn hoạt và văn hóa anime/manga.",
    category: "Blog",
  },
]

function resourcesToJSONContent(resources: ResourceCard[]): JSONContent {
  return {
    type: "doc",
    content: resources.map(r => ({
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            { type: "bold" },
            { type: "link", attrs: { href: r.url, target: "_blank" } }
          ],
          text: r.domain
        },
        {
          type: "text",
          text: `: ${r.description}`
        }
      ]
    }))
  }
}

export function ResourcesClient({ initialPage, isAdmin, appName }: ResourcesClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const parsedData = isResourcesData(initialPage?.content) ? initialPage.content : null

  const initialData: ResourcesData = parsedData
    ? {
        ...parsedData,
        body: parsedData.body || resourcesToJSONContent(parsedData.resources || defaultResources),
      }
    : {
        title: "Nguồn tham khảo",
        description: `Dưới đây là danh sách các trang web, thư viện lưu trữ và cộng đồng uy tín mà ${appName} thường xuyên tham khảo.`,
        body: resourcesToJSONContent(defaultResources),
        coverUrl: "https://picsum.photos/seed/librarysakuga/800/1000",
      }

  const [data, setData] = useState<ResourcesData>(initialData)
  const [contentText, setContentText] = useState(initialPage?.contentText || "")
  const dataRef = useRef(data)
  const contentTextRef = useRef(contentText)
  const editorRef = useRef<Editor | null>(null)

  function updateData(updater: (currentData: ResourcesData) => ResourcesData) {
    const nextData = updater(dataRef.current)
    dataRef.current = nextData
    setData(nextData)
  }

  function updateContentText(nextContentText: string) {
    contentTextRef.current = nextContentText
    setContentText(nextContentText)
  }

  const handleEditorReady = useCallback((editor: Editor | null) => {
    editorRef.current = editor
  }, [])

  async function handleSave() {
    setIsSaving(true)
    try {
      const latestBody = editorRef.current?.getJSON()
      const latestContentText = editorRef.current?.getText()

      if (latestBody) {
        dataRef.current = {
          ...dataRef.current,
          body: latestBody,
        }
        setData(dataRef.current)
      }

      if (latestContentText !== undefined) {
        contentTextRef.current = latestContentText
        setContentText(latestContentText)
      }

      const response = await fetch("/api/admin/site-pages/resources", {
        body: JSON.stringify({
          content: dataRef.current,
          contentText: contentTextRef.current,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to save:", error)
      alert(error instanceof Error ? error.message : "Lỗi khi lưu. Vui lòng thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col pt-0 group relative">
      {isAdmin && !isEditing && (
        <Button
          onClick={() => setIsEditing(true)}
          className="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-100 z-10"
          size="sm"
          variant="outline"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Chỉnh sửa trang
        </Button>
      )}

      {isEditing && (
        <div className="fixed top-[56px] left-0 right-0 z-[100] flex items-center justify-between bg-background/90 backdrop-blur py-2 px-4 border-b border-border-default shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-editorial">
            Chỉnh sửa trang Nguồn tham khảo
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-border-default font-bold"
              onClick={() => {
                dataRef.current = initialData
                contentTextRef.current = initialPage?.contentText || ""
                setData(initialData)
                setContentText(initialPage?.contentText || "")
                setIsEditing(false)
              }}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button size="sm" className="rounded-full bg-accent text-white hover:bg-accent/90 font-bold" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      )}

      <main className={cn("flex-1 w-full max-w-[800px] mx-auto pt-8 md:pt-16 pb-20 px-4 md:px-0", isEditing && "mt-[60px]")}>
        <div className={cn("bg-subtle-bg/80 backdrop-blur-sm border-[3px] border-border/60 rounded-[24px] p-6 md:p-12 shadow-xl relative isolate overflow-hidden", isEditing && "border-editorial/40 shadow-editorial/10")}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-tr-[100px] -z-10" />

          <div className="flex flex-col">
            <div className="text-center mb-8">
              <ScrollReveal>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <BookOpen className="w-6 h-6 text-accent animate-pulse shrink-0" />
                  {isEditing ? (
                    <input
                      className="w-full text-center border-none bg-transparent text-[32px] md:text-[40px] font-display font-bold text-text-primary leading-tight outline-none focus:ring-2 focus:ring-accent rounded-[8px] placeholder:text-text-tertiary"
                      value={data.title}
                      onChange={(e) => updateData(d => ({ ...d, title: e.target.value }))}
                      placeholder="Tiêu đề trang..."
                    />
                  ) : (
                    <h1 className="text-[32px] md:text-[40px] font-display font-bold text-text-primary leading-tight">
                      <TextReveal className="text-accent" text={data.title} />
                    </h1>
                  )}
                </div>
              </ScrollReveal>
              
              <ScrollReveal delay={0.1}>
                {isEditing ? (
                  <Textarea
                    className="text-[15px] italic text-text-secondary border-t border-b border-border/50 py-3 mt-4 max-w-[600px] mx-auto text-center resize-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-accent rounded-none"
                    value={data.description}
                    onChange={(e) => updateData(d => ({ ...d, description: e.target.value }))}
                    placeholder="Mô tả..."
                    rows={3}
                  />
                ) : data.description ? (
                  <p className="text-[15px] italic text-text-secondary border-t border-b border-border/50 py-3 mt-4 max-w-[600px] mx-auto text-center">
                    {data.description}
                  </p>
                ) : null}
              </ScrollReveal>
            </div>

            <ScrollReveal delay={0.2} className="w-full max-w-[480px] mx-auto mb-8">
              <div className="relative aspect-[16/10] rounded-[16px] overflow-hidden border-4 border-white dark:border-border shadow-lg bg-background">
                {isEditing ? (
                  <CoverImageUpload
                    value={data.coverUrl || ""}
                    onChange={(url) => updateData(d => ({ ...d, coverUrl: url }))}
                  />
                ) : (
                  <img
                    src={data.coverUrl || "https://picsum.photos/seed/librarysakuga/800/1000"}
                    alt="Mascot"
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </ScrollReveal>

            <div className={cn("space-y-4 text-[16px] text-text-secondary font-sans [&_.post-content]:!mx-0 [&_.post-content]:!max-w-none [&_.ProseMirror_p]:!mx-0 [&_.ProseMirror_ul]:!mx-0 [&_.ProseMirror_ol]:!mx-0 [&_.ProseMirror_p]:!max-w-none", isEditing && "bg-background rounded-[16px] p-4 border border-border-default")}>
              <ScrollReveal delay={0.3}>
                {isEditing ? (
                  <TiptapEditor
                    content={data.body}
                    editable={true}
                    onEditorReady={handleEditorReady}
                    onChange={(json, text) => {
                      updateData(d => ({ ...d, body: json }))
                      updateContentText(text)
                    }}
                  />
                ) : (
                  <PostBody content={data.body!} />
                )}
              </ScrollReveal>

              {!isEditing && (
                <ScrollReveal delay={0.4}>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center pt-6 border-t border-border/50">
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-[5px] bg-accent px-4 text-[13px] font-bold text-white transition-colors hover:bg-accent/90"
                      href="/"
                    >
                      Bài viết mới nhất
                    </Link>
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-[5px] border border-border px-4 text-[13px] font-bold text-text-primary transition-colors hover:bg-subtle-bg"
                      href="/about"
                    >
                      Giới thiệu
                    </Link>
                  </div>
                </ScrollReveal>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
