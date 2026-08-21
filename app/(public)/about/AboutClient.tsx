"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Save, X, Heart } from "lucide-react"
import type { Editor, JSONContent } from "@tiptap/react"
import Link from "next/link"
import { toast } from "sonner"

import { PostBody } from "@/components/posts/PostBody"
import { Button } from "@/components/ui/button"
import { FourPointSparkle } from "@/components/ui/FourPointSparkle"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
import { cn } from "@/lib/utils"
import { useAdminAccess } from "@/lib/clientSession"

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

interface PublishingNote {
  text: string
  title: string
}

interface AboutPageContent {
  body: JSONContent
  publishingNotes: PublishingNote[]
  title: string
  whyWeDoThis: JSONContent | string
  coverUrl?: string
}

interface AboutClientProps {
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
          text: "Ấn phẩm này được xây dựng dành cho các bài tiểu luận, bài phê bình và ghi chú cần không gian để phân tích sâu. Trọng tâm không phải là các cuộc thảo luận hàng ngày hay chấm điểm nhanh chóng. Mà là sự chú ý kỹ lưỡng: một cảnh phim đang thể hiện điều gì, nó được thực hiện như thế nào và tại sao những lựa chọn đó lại quan trọng.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Các tác giả tham gia theo lời mời để trang web có thể duy trì quy mô nhỏ, có chủ đích và được biên tập theo một tiêu chuẩn chung cho các bài phê bình anime dài kỳ.",
        },
      ],
    },
  ],
}

const defaultPublishingNotes = [
  {
    title: "Phân tích chuyên sâu",
    text: "Những bài luận xem xét hoạt hình, đạo diễn, chỉnh sửa và diễn xuất như những lựa chọn đáng nghiên cứu từng khung hình.",
  },
  {
    title: "Đánh giá có bối cảnh",
    text: "Những bài viết về series và tập phim quan tâm đến kỹ thuật, lịch sử sản xuất và những kỳ vọng mà tác phẩm đang đáp ứng.",
  },
  {
    title: "Ghi chú sản xuất",
    text: "Những bài viết ngắn hơn về các studio, nhân viên, mô-típ hình ảnh và những quyết định thực tế đằng sau những cảnh anime đáng nhớ.",
  },
]

function toRichTextContent(value: JSONContent | string): JSONContent {
  if (typeof value !== "string") return value

  return {
    content: [
      {
        content: value ? [{ text: value, type: "text" }] : undefined,
        type: "paragraph",
      },
    ],
    type: "doc",
  }
}

function hasWhyContent(value: JSONContent | string) {
  if (typeof value === "string") return value.trim().length > 0
  return Boolean(value.content?.length)
}

function isAboutPageContent(value: unknown): value is AboutPageContent {
  return (
    typeof value === "object" &&
    value !== null &&
    !("type" in value) &&
    "body" in value &&
    "title" in value &&
    "whyWeDoThis" in value
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

export function AboutClient({
  initialPage,
  isAdmin: isAdminOverride,
}: AboutClientProps) {
  const router = useRouter()
  const isAdmin = useAdminAccess(isAdminOverride)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isAdmin) return

    void import("@/components/editor/TiptapEditor")
    void import("@/components/posts/CoverImageUpload")
  }, [isAdmin])

  const initialData: AboutPageContent = isAboutPageContent(initialPage?.content) ? initialPage.content : {
    title: `Chào mừng bạn đến với Eizou Blog!`, // Updated title
    whyWeDoThis: "Để lan tỏa tình yêu với hoạt hình và ghi nhận công sức của những nhà sáng tạo tuyệt vời đã thổi hồn vào những thế giới yêu thích của chúng ta. Chúng mình muốn tạo ra một nơi mà fan có thể đọc những bài tiểu luận sâu sắc cùng một tách trà trong một không gian ấm cúng, dễ thương! 💖",
    body: (initialPage?.content as JSONContent) || defaultBody,
    publishingNotes: defaultPublishingNotes,
    coverUrl: "https://picsum.photos/seed/animekawaiigirl/800/1000",
  }

  const [data, setData] = useState(initialData)
  const [contentText, setContentText] = useState(initialPage?.contentText || "")
  const dataRef = useRef(data)
  const contentTextRef = useRef(contentText)
  const aboutEditorRef = useRef<Editor | null>(null)
  const whyWeDoThisEditorRef = useRef<Editor | null>(null)
  const aboutGridRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const grid = aboutGridRef.current
    if (!grid) return

    const image = grid.querySelector<HTMLElement>("[data-about-portrait]")
    const content = grid.querySelector<HTMLElement>("[data-about-content]")
    const card = grid.parentElement
    const main = grid.closest("main")
    if (!image || !content || !card || !main) return

    let animationFrame = 0

    const balanceColumns = () => {
      content.style.width = ""

      if (window.innerWidth < 768 || isEditing) {
        return
      }

      const imageHeight = image.getBoundingClientRect().height
      if (imageHeight <= 0) return

      const mainStyle = getComputedStyle(main)
      const cardStyle = getComputedStyle(card)
      const gridStyle = getComputedStyle(grid)
      const availableWidth =
        main.clientWidth -
        parseFloat(mainStyle.paddingLeft) -
        parseFloat(mainStyle.paddingRight) -
        parseFloat(cardStyle.paddingLeft) -
        parseFloat(cardStyle.paddingRight) -
        parseFloat(cardStyle.borderLeftWidth) -
        parseFloat(cardStyle.borderRightWidth) -
        image.getBoundingClientRect().width -
        parseFloat(gridStyle.columnGap)

      let lowerWidth = 280
      let upperWidth = Math.max(lowerWidth, Math.min(760, availableWidth))
      let bestWidth = upperWidth
      let bestDifference = Number.POSITIVE_INFINITY

      // Binary-search once for the width whose intrinsic content height
      // most closely matches the uncropped portrait height.
      for (let index = 0; index < 9; index += 1) {
        const candidateWidth = (lowerWidth + upperWidth) / 2
        content.style.width = `${candidateWidth}px`
        const heightDifference = content.scrollHeight - imageHeight
        const absoluteDifference = Math.abs(heightDifference)

        if (absoluteDifference < bestDifference) {
          bestDifference = absoluteDifference
          bestWidth = candidateWidth
        }

        if (heightDifference > 0) {
          lowerWidth = candidateWidth
        } else {
          upperWidth = candidateWidth
        }
      }

      content.style.width = `${Math.round(bestWidth)}px`
    }

    const scheduleBalance = () => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(balanceColumns)
    }

    const observer = new ResizeObserver(scheduleBalance)
    observer.observe(image)
    observer.observe(main)
    window.addEventListener("resize", scheduleBalance)

    const imageElement = image.querySelector("img")
    imageElement?.addEventListener("load", scheduleBalance)
    void document.fonts.ready.then(scheduleBalance)
    scheduleBalance()

    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      window.removeEventListener("resize", scheduleBalance)
      imageElement?.removeEventListener("load", scheduleBalance)
      content.style.width = ""
    }
  }, [data.body, data.title, data.whyWeDoThis, isEditing])

  function updateData(updater: (currentData: AboutPageContent) => AboutPageContent) {
    const nextData = updater(dataRef.current)
    dataRef.current = nextData
    setData(nextData)
  }

  function updateContentText(nextContentText: string) {
    contentTextRef.current = nextContentText
    setContentText(nextContentText)
  }

  const handleEditorReady = useCallback((editor: Editor | null) => {
    aboutEditorRef.current = editor
  }, [])

  const handleWhyWeDoThisEditorReady = useCallback((editor: Editor | null) => {
    whyWeDoThisEditorRef.current = editor
  }, [])

  async function handleSave() {
    setIsSaving(true)
    try {
      const latestBody = aboutEditorRef.current?.getJSON()
      const latestContentText = aboutEditorRef.current?.getText()
      const latestWhyWeDoThis = whyWeDoThisEditorRef.current?.getJSON()

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

      if (latestWhyWeDoThis) {
        dataRef.current = {
          ...dataRef.current,
          whyWeDoThis: latestWhyWeDoThis,
        }
        setData(dataRef.current)
      }

      const response = await fetch("/api/admin/site-pages/about", {
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
      toast.success("Đã lưu trang Giới thiệu")
      router.refresh()
    } catch (error) {
      console.error("Failed to save:", error)
      toast.error("Không thể lưu trang Giới thiệu", {
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

      <main className="flex-1 w-full max-w-[1180px] mx-auto pt-8 md:pt-16 pb-32 px-4 md:px-6 xl:px-0">
        <div className={cn("-mx-4 w-[calc(100%+2rem)] bg-background/90 backdrop-blur-md border-[3px] border-border/60 rounded-[24px] p-6 shadow-xl relative isolate overflow-hidden md:mx-auto md:w-fit md:p-12", isEditing && "border-editorial/40 shadow-editorial/10")}>
          {/* Decorative Corner Flairs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-tr-[100px] -z-10" />

          <div ref={aboutGridRef} className="grid grid-cols-1 gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">

            <ScrollReveal delay={0.2} className="w-full md:w-[min(42vw,430px)]" data-about-portrait="true">
              <div className="relative h-auto rounded-[16px] overflow-hidden border-4 border-white dark:border-border shadow-lg rotate-[-2deg] hover:rotate-0 transition-transform duration-300 bg-background">
                 {isEditing ? (
                   <CoverImageUpload
                     preserveAspectRatio
                     value={data.coverUrl || ""}
                     onChange={(url) => updateData((currentData) => ({ ...currentData, coverUrl: url }))}
                   />
                 ) : (
                   <img
                      src={data.coverUrl || "https://picsum.photos/seed/animekawaiigirl/800/1000"}
                      alt="Mascot"
                      className="h-auto w-full"
                      referrerPolicy="no-referrer"
                   />
                 )}
              </div>
            </ScrollReveal>

            <div
              className="flex w-full min-w-0 flex-col md:self-start"
              data-about-content="true"
            >
              <ScrollReveal>
                <div className="mb-4">
                  {isEditing ? (
                    <input
                      className="w-full border-none bg-transparent text-[32px] md:text-[42px] font-display font-bold text-text-primary leading-tight outline-none focus:ring-2 focus:ring-accent rounded-[8px] placeholder:text-text-tertiary"
                      value={data.title}
                      onChange={(e) => updateData((currentData) => ({ ...currentData, title: e.target.value }))}
                      placeholder="Tiêu đề trang..."
                    />
                  ) : (
                    <h1 className="text-[32px] md:text-[42px] font-display font-bold text-text-primary leading-tight">
                      {data.title.includes('Eizou Blog!') ? (
                        <>
                          Chào mừng bạn đến với{" "}
                          <span className="inline-flex items-center gap-2 align-baseline text-accent">
                            <FourPointSparkle className="sparkle-glyph h-6 w-6 shrink-0" />
                            <TextReveal className="[&>span:last-child]:mr-0" text="Eizou Blog!" />
                            <FourPointSparkle className="sparkle-glyph h-6 w-6 shrink-0" />
                          </span>
                        </>
                      ) : (
                        <TextReveal className="text-accent" text={data.title} />
                      )}
                    </h1>
                  )}
                </div>
              </ScrollReveal>

              <div className={cn("space-y-4 text-[16px] text-text-secondary font-sans [&_.post-content]:!mx-0 [&_.post-content]:!max-w-none [&_.ProseMirror_p]:!mx-0 [&_.ProseMirror_ul]:!mx-0 [&_.ProseMirror_ol]:!mx-0 [&_.ProseMirror_p]:!max-w-none", isEditing && "bg-background rounded-[16px] p-4 border border-border-default mt-4")}>
                <ScrollReveal>
                  {isEditing ? (
                    <TiptapEditor
                      content={data.body}
                      editable={true}
                      onEditorReady={handleEditorReady}
                      onChange={(json, text) => {
                        updateData((currentData) => ({ ...currentData, body: json }))
                        updateContentText(text)
                      }}
                    />
                  ) : (
                    <PostBody content={data.body} />
                  )}
                </ScrollReveal>

                {(isEditing || hasWhyContent(data.whyWeDoThis)) && (
                  <ScrollReveal delay={0.2}>
                    <div className="mt-6 rounded-xl border border-accent/30 bg-background/80 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18),inset_0_1px_0_hsl(var(--accent)/0.16)] backdrop-blur-md ring-1 ring-border-default/70">
                      <h3 className="font-display font-bold text-text-primary flex items-center gap-2 text-[18px] mb-2">
                        <Heart className="w-5 h-5 text-accent" /> Tại sao chúng mình làm blog này
                      </h3>
                      {isEditing ? (
                        <TiptapEditor
                          ariaLabel="Lý do tạo blog"
                          content={toRichTextContent(data.whyWeDoThis)}
                          mode="compact"
                          onChange={(json) =>
                            updateData((currentData) => ({
                              ...currentData,
                              whyWeDoThis: json,
                            }))
                          }
                          onEditorReady={handleWhyWeDoThisEditorReady}
                          placeholder="Nhập lý do..."
                        />
                      ) : typeof data.whyWeDoThis === "string" ? (
                        <p className="text-[14px]">{data.whyWeDoThis}</p>
                      ) : (
                        <div className="post-content text-[14px] [&_p]:my-2">
                          <PostBody content={data.whyWeDoThis} />
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                )}

                {!isEditing && (
                  <ScrollReveal delay={0.3}>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row pt-4 border-t border-border/50">
                      <Link
                        className="inline-flex h-10 items-center justify-center rounded-[5px] bg-accent px-4 text-[13px] font-bold text-white transition-colors hover:bg-accent/90"
                        href="/"
                      >
                        Bài viết mới nhất
                      </Link>
                      <Link
                        className="inline-flex h-10 items-center justify-center rounded-[5px] border border-border px-4 text-[13px] font-bold text-text-primary transition-colors hover:bg-subtle-bg"
                        href="/contributors"
                      >
                        Người đóng góp
                      </Link>
                    </div>
                  </ScrollReveal>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
