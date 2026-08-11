"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Save, X, HelpCircle } from "lucide-react"
import type { Editor, JSONContent } from "@tiptap/react"
import Link from "next/link"
import { toast } from "sonner"

import { PostBody } from "@/components/posts/PostBody"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { useAdminAccess } from "@/lib/clientSession"
import { cn } from "@/lib/utils"

const TiptapEditor = dynamic(
  () =>
    import("@/components/editor/TiptapEditor").then(
      (module) => module.TiptapEditor,
    ),
  { ssr: false },
)

const CoverImageUpload = dynamic(
  () =>
    import("@/components/posts/CoverImageUpload").then(
      (module) => module.CoverImageUpload,
    ),
  { ssr: false },
)

interface IntroPageContent {
  body: JSONContent
  title: string
  shortIntro: string
  coverUrl?: string
}

interface IntroToSakugaClientProps {
  initialPage: { content: unknown; contentText: string | null } | null
  isAdmin?: boolean
}

const defaultBody: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Chào mừng bạn đến với chuyên mục dành riêng cho những ai muốn bắt đầu tìm hiểu về Sakuga (作画) và quy trình sản xuất anime. Dưới đây là tập hợp đầy đủ những nguồn tài liệu uy tín, được chọn lọc kỹ càng để bạn tự học từ cơ bản đến nâng cao mà không cần mất công tìm kiếm khắp nơi.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Phần 1: Khái niệm & Thuật ngữ cơ bản" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            { type: "bold" },
            {
              type: "link",
              attrs: {
                href: "https://www.animenewsnetwork.com/feature/2015-09-30/the-joy-of-sakuga/.93437",
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          ],
          text: "The Joy of Sakuga (Anime News Network)",
        },
        {
          type: "text",
          text: ": Bài viết kinh điển giải thích Sakuga là gì, tinh thần tôn vinh họa sĩ, và tại sao việc hiểu chuyển động lại làm thay đổi hoàn toàn cách chúng ta thưởng thức anime. Bạn nên bắt đầu từ đây để lấy cảm hứng.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            { type: "bold" },
            {
              type: "link",
              attrs: {
                href: "https://blog.sakugabooru.com/glossary/",
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          ],
          text: "Sakuga Glossary (Sakugabooru Blog)",
        },
        {
          type: "text",
          text: ": Từ điển tra cứu nhanh tất cả thuật ngữ kỹ thuật hoạt họa từ Genga, Douga đến các kỹ thuật phức tạp hơn. Đây là cẩm nang hữu ích khi bạn tham gia thảo luận chuyên sâu.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Phần 2: Quy trình sản xuất Anime (Production Pipeline)" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            { type: "bold" },
            {
              type: "link",
              attrs: {
                href: "https://blog.sakugabooru.com/2017/05/02/the-pre-production-of-anime-series-production-notes-1/",
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          ],
          text: "The Pre-Production of Anime Series (Sakuga Blog)",
        },
        {
          type: "text",
          text: ": Chuỗi bài viết gồm 4 phần giải thích tường tận cách một ý tưởng kịch bản (Scripting), thiết kế nhân vật (Design Work), và lập kế hoạch (Planning) được triển khai trước khi animator đặt bút vẽ.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            { type: "bold" },
            {
              type: "link",
              attrs: {
                href: "https://blog.sakugabooru.com/2016/09/20/guide-to-ending-credits-production-notes/",
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          ],
          text: "Guide to Ending Credits (Sakuga Blog)",
        },
        {
          type: "text",
          text: ": Hướng dẫn chi tiết cách đọc bảng chữ chạy cuối phim (credits) để hiểu chính xác họa sĩ diễn hoạt (Key Animator) hay đạo diễn tập phim (Episode Director) đóng vai trò gì.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            { type: "bold" },
            {
              type: "link",
              attrs: {
                href: "https://washida.org/posts/anime-production-detailed-guide",
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          ],
          text: "Anime Production detailed guide (Washi's Blog)",
        },
        {
          type: "text",
          text: ": Bài viết trực quan kèm sơ đồ quy trình công việc chi tiết từ phân cảnh phân giải (E-konte) đến khâu ghép hiệu ứng ánh sáng kỹ thuật số.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Phần 3: Hướng dẫn thực hành & Starter Pack" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            { type: "bold" },
            {
              type: "link",
              attrs: {
                href: "https://animetudes.com/2021/04/09/exploring-sakuga-a-sakuga-starter-pack/",
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          ],
          text: "Exploring Sakuga - A Sakuga Starter Pack (Animetudes)",
        },
        {
          type: "text",
          text: ": Bản đồ định hướng hoàn chỉnh cho người mới: đề xuất những bộ anime nổi bật, các video tổng hợp (MAD), và danh sách animator tiêu biểu để bạn theo dõi.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "Anime đề xuất để hiểu rõ hơn: ",
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "italic" }],
                  text: "Shirobako",
                },
                {
                  type: "text",
                  text: ": Series truyền hình mô phỏng chân thực và đầy đủ nhất mọi khía cạnh trong quy trình vận hành của một studio anime.",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "italic" }],
                  text: "Keep Your Hands Off Eizouken!",
                },
                {
                  type: "text",
                  text: ": Bộ anime tôn vinh niềm đam mê sáng tạo hoạt họa thô mộc và tinh thần tự làm phim ngắn.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Phần 4: Cơ sở dữ liệu nâng cao" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [
            { type: "bold" },
            {
              type: "link",
              attrs: {
                href: "https://www.sakugabooru.com",
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          ],
          text: "Sakugabooru Database",
        },
        {
          type: "text",
          text: ": Trang web lớn nhất lưu trữ các trích đoạn phim nổi bật. Bạn có thể sử dụng hệ thống tag để tìm kiếm trực tiếp tác phẩm của những animator yêu thích (như Yutaka Nakamura, Yoh Yoshinari) và nghiên cứu phong cách của họ.",
        },
      ],
    },
  ],
}

function isIntroPageContent(value: unknown): value is IntroPageContent {
  return (
    typeof value === "object" &&
    value !== null &&
    !("type" in value) &&
    "body" in value &&
    "title" in value &&
    "shortIntro" in value
  )
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

export function IntroToSakugaClient({
  initialPage,
  isAdmin: isAdminOverride,
}: IntroToSakugaClientProps) {
  const router = useRouter()
  const isAdmin = useAdminAccess(isAdminOverride)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isAdmin) return

    void import("@/components/editor/TiptapEditor")
    void import("@/components/posts/CoverImageUpload")
  }, [isAdmin])

  const initialData: IntroPageContent = isIntroPageContent(initialPage?.content) ? initialPage.content : {
    title: "Nhập môn Sakuga (作画)",
    shortIntro: "Hướng dẫn và tài liệu tham khảo hoàn chỉnh dành cho người mới bắt đầu.",
    body: (initialPage?.content as JSONContent) || defaultBody,
    coverUrl: "https://picsum.photos/seed/sakugamascot/800/500",
  }

  const [data, setData] = useState(initialData)
  const [contentText, setContentText] = useState(initialPage?.contentText || "")
  const dataRef = useRef(data)
  const contentTextRef = useRef(contentText)
  const editorRef = useRef<Editor | null>(null)

  function updateData(updater: (currentData: IntroPageContent) => IntroPageContent) {
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

      const response = await fetch("/api/admin/site-pages/nhap-mon-sakuga", {
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
      toast.success("Đã lưu trang Nhập môn Sakuga")
      router.refresh()
    } catch (error) {
      console.error("Failed to save:", error)
      toast.error("Không thể lưu trang Nhập môn Sakuga", {
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col pt-0 group relative">
      {isAdmin && !isEditing && (
        <Button
          aria-label="Chỉnh sửa trang"
          onClick={() => setIsEditing(true)}
          className="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-100 z-10"
          size="icon"
          title="Chỉnh sửa trang"
          variant="outline"
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
        </Button>
      )}

      {isEditing && (
        <div
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-xl items-center justify-between gap-3 rounded-[20px] border-[2px] border-border-default bg-background/95 px-3 py-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-8 sm:bottom-8 sm:left-1/2 sm:right-auto sm:w-max sm:max-w-[calc(100vw-4rem)] sm:-translate-x-1/2 sm:gap-8 sm:rounded-full sm:px-6 sm:py-3"
          data-inline-editor-bar
        >
          <h2 className="min-w-0 truncate whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-editorial sm:text-sm">
            Đang chỉnh sửa...
          </h2>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border-default font-bold"
              aria-label="Hủy chỉnh sửa"
              title="Hủy chỉnh sửa"
              onClick={() => {
                dataRef.current = initialData
                contentTextRef.current = initialPage?.contentText || ""
                setData(initialData)
                setContentText(initialPage?.contentText || "")
                setIsEditing(false)
              }}
              disabled={isSaving}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Button
              aria-label={isSaving ? "Đang lưu trang" : "Lưu trang"}
              size="icon"
              className="rounded-full bg-accent text-white hover:bg-accent/90 font-bold"
              onClick={handleSave}
              disabled={isSaving}
              title={isSaving ? "Đang lưu trang" : "Lưu trang"}
            >
              <Save aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1100px] mx-auto pt-8 md:pt-16 pb-32 px-4 md:px-6">
        <div className={cn("-mx-4 w-[calc(100%+2rem)] bg-background/90 backdrop-blur-md border-[3px] border-border/60 rounded-[24px] p-6 md:mx-0 md:w-auto md:p-12 shadow-xl relative isolate overflow-hidden", isEditing && "border-editorial/40 shadow-editorial/10")}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-tr-[100px] -z-10" />

          <div className="flex flex-col">
            {/* Title & Header Block */}
            <div className="text-center mb-8">
              <ScrollReveal>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <HelpCircle className="w-6 h-6 text-accent animate-pulse shrink-0" />
                  {isEditing ? (
                    <input
                      className="w-full text-center border-none bg-transparent text-[36px] md:text-[48px] lg:text-[56px] font-display font-bold text-text-primary leading-tight outline-none focus:ring-2 focus:ring-accent rounded-[8px] placeholder:text-text-tertiary"
                      value={data.title}
                      onChange={(e) => updateData(d => ({ ...d, title: e.target.value }))}
                      placeholder="Tiêu đề trang..."
                    />
                  ) : (
                    <h1 className="text-[36px] md:text-[48px] lg:text-[56px] font-display font-bold text-text-primary leading-tight">
                      <TextReveal className="text-accent" text={data.title} />
                    </h1>
                  )}
                </div>
              </ScrollReveal>
              
              <ScrollReveal delay={0.1}>
                {isEditing ? (
                  <Textarea
                    className="text-[16px] md:text-[18px] italic text-text-secondary border-t border-b border-border/50 py-3 mt-4 max-w-[600px] mx-auto text-center resize-none bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-accent rounded-none"
                    value={data.shortIntro}
                    onChange={(e) => updateData(d => ({ ...d, shortIntro: e.target.value }))}
                    placeholder="Mô tả ngắn..."
                    rows={2}
                  />
                ) : data.shortIntro ? (
                  <p className="text-[16px] md:text-[18px] italic text-text-secondary border-t border-b border-border/50 py-3 mt-4 max-w-[600px] mx-auto text-center">
                    {data.shortIntro}
                  </p>
                ) : null}
              </ScrollReveal>
            </div>

            {/* Mascot Hero Card */}
            <ScrollReveal delay={0.2} className="w-full max-w-none mx-auto mb-8">
              <div className="relative rounded-[16px] overflow-hidden border-4 border-white dark:border-border shadow-lg bg-background">
                {isEditing ? (
                  <CoverImageUpload
                    preserveAspectRatio
                    value={data.coverUrl || ""}
                    onChange={(url) => updateData(d => ({ ...d, coverUrl: url }))}
                  />
                ) : (
                  <img
                    src={data.coverUrl || "https://picsum.photos/seed/sakugamascot/800/500"}
                    alt="Mascot"
                    className="h-auto w-full"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </ScrollReveal>

            {/* Main Content Column */}
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
                  <PostBody
                    content={data.body}
                    contentClassName="sakuga-content"
                    presentation="article"
                  />
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
                      href="/resources"
                    >
                      Nguồn tham khảo
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
