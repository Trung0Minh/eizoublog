"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Save, X, HelpCircle } from "lucide-react"
import type { Editor, JSONContent } from "@tiptap/react"
import Link from "next/link"

import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { PostBody } from "@/components/posts/PostBody"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

interface IntroPageContent {
  body: JSONContent
  title: string
  shortIntro: string
}

interface IntroToSakugaClientProps {
  initialPage: { content: unknown; contentText: string | null } | null
  isAdmin: boolean
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
          marks: [{ type: "bold" }],
          text: "The Joy of Sakuga (Anime News Network): ",
        },
        {
          type: "text",
          text: "Bài viết kinh điển giải thích Sakuga là gì, tinh thần tôn vinh họa sĩ, và tại sao việc hiểu chuyển động lại làm thay đổi hoàn toàn cách chúng ta thưởng thức anime. Bạn nên bắt đầu từ đây để lấy cảm hứng.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "Sakuga Glossary (Sakugabooru Blog): ",
        },
        {
          type: "text",
          text: "Từ điển tra cứu nhanh tất cả thuật ngữ kỹ thuật hoạt họa từ Genga, Douga đến các kỹ thuật phức tạp hơn. Đây là cẩm nang hữu ích khi bạn tham gia thảo luận chuyên sâu.",
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
          marks: [{ type: "bold" }],
          text: "The Pre-Production of Anime Series (Sakuga Blog): ",
        },
        {
          type: "text",
          text: "Chuỗi bài viết gồm 4 phần giải thích tường tận cách một ý tưởng kịch bản (Scripting), thiết kế nhân vật (Design Work), và lập kế hoạch (Planning) được triển khai trước khi animator đặt bút vẽ.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "Guide to Ending Credits (Sakuga Blog): ",
        },
        {
          type: "text",
          text: "Hướng dẫn chi tiết cách đọc bảng chữ chạy cuối phim (credits) để hiểu chính xác họa sĩ diễn hoạt (Key Animator) hay đạo diễn tập phim (Episode Director) đóng vai trò gì.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "Anime Production detailed guide (Washi's Blog): ",
        },
        {
          type: "text",
          text: "Bài viết trực quan kèm sơ đồ quy trình công việc chi tiết từ phân cảnh phân giải (E-konte) đến khâu ghép hiệu ứng ánh sáng kỹ thuật số.",
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
          marks: [{ type: "bold" }],
          text: "Exploring Sakuga - A Sakuga Starter Pack (Animetudes): ",
        },
        {
          type: "text",
          text: "Bản đồ định hướng hoàn chỉnh cho người mới: đề xuất những bộ anime nổi bật, các video tổng hợp (MAD), và danh sách animator tiêu biểu để bạn theo dõi.",
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
          marks: [{ type: "bold" }],
          text: "Sakugabooru Database: ",
        },
        {
          type: "text",
          text: "Trang web lớn nhất lưu trữ các trích đoạn phim nổi bật. Bạn có thể sử dụng hệ thống tag để tìm kiếm trực tiếp tác phẩm của những animator yêu thích (như Yutaka Nakamura, Yoh Yoshinari) và nghiên cứu phong cách của họ.",
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

export function IntroToSakugaClient({ initialPage, isAdmin }: IntroToSakugaClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const initialData: IntroPageContent = isIntroPageContent(initialPage?.content) ? initialPage.content : {
    title: "Nhập môn Sakuga (作画)",
    shortIntro: "Hướng dẫn và tài liệu tham khảo hoàn chỉnh dành cho người mới bắt đầu.",
    body: (initialPage?.content as JSONContent) || defaultBody,
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
      router.refresh()
    } catch (error) {
      console.error("Failed to save:", error)
      alert(error instanceof Error ? error.message : "Lỗi khi lưu. Vui lòng thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-8 animate-in fade-in pb-20">
        <div className="flex items-center justify-between sticky top-[56px] z-10 bg-background/90 backdrop-blur py-4 border-b border-border-default">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-editorial">
            Chỉnh sửa trang Nhập môn Sakuga
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

        <div className="space-y-6 max-w-4xl mt-6">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Tiêu đề chính</label>
            <Textarea
              value={data.title}
              onChange={(e) =>
                updateData((currentData) => ({
                  ...currentData,
                  title: e.target.value,
                }))
              }
              className="text-2xl font-bold resize-none rounded-[16px] bg-background border-[2px]"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Mô tả ngắn</label>
            <Textarea
              value={data.shortIntro}
              onChange={(e) =>
                updateData((currentData) => ({
                  ...currentData,
                  shortIntro: e.target.value,
                }))
              }
              className="text-base resize-none rounded-[16px] bg-background border-[2px]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Nội dung hướng dẫn</label>
            <div className="rounded-[16px] border-[2px] border-border-default p-4 md:pt-[44px] bg-background [&_.ProseMirror_p]:!mx-0 [&_.ProseMirror_ul]:!mx-0 [&_.ProseMirror_ol]:!mx-0 [&_.ProseMirror_p]:!max-w-none">
              <TiptapEditor
                content={data.body}
                editable={true}
                onEditorReady={handleEditorReady}
                onChange={(json, text) => {
                  updateData((currentData) => ({
                    ...currentData,
                    body: json,
                  }))
                  updateContentText(text)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col pt-0 group relative">
      {isAdmin && (
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

      <main className="flex-1 w-full max-w-[1000px] mx-auto pt-8 md:pt-16 pb-20">
        <div className="bg-subtle-bg/80 backdrop-blur-sm border-[3px] border-border/60 rounded-[24px] p-6 md:p-12 shadow-xl relative isolate overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-tr-[100px] -z-10" />

          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
            <ScrollReveal delay={0.2} className="w-full md:w-[40%]">
              <div className="relative aspect-[3/4] rounded-[16px] overflow-hidden border-4 border-white dark:border-border shadow-lg rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
                <img
                  src="https://picsum.photos/seed/sakugamascot/800/1000"
                  alt="Mascot"
                  className="object-cover w-full h-full"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-4 -right-4 bg-accent text-white w-16 h-16 rounded-full flex items-center justify-center font-display font-bold shadow-md rotate-12">
                  Start!
                </div>
              </div>
            </ScrollReveal>

            <div className="w-full md:w-[60%] flex flex-col">
              <ScrollReveal>
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-6 h-6 text-accent animate-pulse" />
                  <h1 className="text-[32px] md:text-[42px] font-display font-bold text-text-primary leading-tight">
                    <TextReveal className="text-accent" text={data.title} />
                  </h1>
                </div>
              </ScrollReveal>

              <div className="space-y-4 text-[16px] text-text-secondary font-sans [&_.post-content]:!mx-0 [&_.post-content]:!max-w-none [&_.ProseMirror_p]:!mx-0 [&_.ProseMirror_ul]:!mx-0 [&_.ProseMirror_ol]:!mx-0 [&_.ProseMirror_p]:!max-w-none">
                {data.shortIntro && (
                  <ScrollReveal delay={0.1}>
                    <p className="text-[15px] italic text-text-secondary border-l-4 border-accent pl-4 py-1 bg-subtle-bg/40 rounded-r-md">
                      {data.shortIntro}
                    </p>
                  </ScrollReveal>
                )}

                <ScrollReveal delay={0.2}>
                  <PostBody content={data.body} />
                </ScrollReveal>

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
                      href="/resources"
                    >
                      Nguồn tham khảo
                    </Link>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
