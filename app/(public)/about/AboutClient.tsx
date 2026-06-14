"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Save, X, Plus, Trash2 } from "lucide-react"
import type { JSONContent } from "@tiptap/react"
import Link from "next/link"

import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { PostBody } from "@/components/posts/PostBody"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateAboutPage } from "./actions"

interface AboutClientProps {
  initialPage: { content: any; contentText: string | null } | null
  isAdmin: boolean
  appName: string
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

export function AboutClient({ initialPage, isAdmin, appName }: AboutClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Determine if initial content is old format (just Tiptap) or new format
  const isNewFormat = initialPage?.content && typeof initialPage.content === "object" && !initialPage.content.type;
  
  const initialData = isNewFormat ? initialPage.content : {
    title: `${appName} là một nơi yên tĩnh dành cho những bài viết nghiêm túc về hoạt hình Nhật Bản.`,
    body: (initialPage?.content as JSONContent) || defaultBody,
    publishingNotes: defaultPublishingNotes
  }

  const [data, setData] = useState(initialData)
  const [contentText, setContentText] = useState(initialPage?.contentText || "")

  async function handleSave() {
    setIsSaving(true)
    try {
      await updateAboutPage(data, contentText)
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Lỗi khi lưu. Vui lòng thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-8 animate-in fade-in pb-20">
        <div className="flex items-center justify-between sticky top-[56px] z-10 bg-background/90 backdrop-blur py-4 border-b border-border-default">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-editorial">
            Chỉnh sửa trang Giới thiệu
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setData(initialData)
                setIsEditing(false)
              }}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
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
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="text-2xl font-bold resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Nội dung giới thiệu</label>
            <div className="rounded-md border border-border-default p-4 bg-background">
              <TiptapEditor
                content={data.body}
                editable={true}
                onChange={(json, text) => {
                  setData({ ...data, body: json })
                  setContentText(text)
                }}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border-default">
            <label className="block text-lg font-semibold mb-4 text-text-primary">Những gì chúng tôi xuất bản</label>
            <div className="space-y-6">
              {data.publishingNotes.map((note: any, index: number) => (
                <div key={index} className="flex gap-4 items-start p-4 border border-border-default rounded-md relative group bg-subtle-bg/30">
                  <div className="flex-1 space-y-4">
                    <Input 
                      value={note.title}
                      onChange={(e) => {
                        const newNotes = [...data.publishingNotes]
                        newNotes[index].title = e.target.value
                        setData({ ...data, publishingNotes: newNotes })
                      }}
                      placeholder="Tiêu đề (VD: Phân tích chuyên sâu)"
                      className="font-semibold bg-background"
                    />
                    <Textarea 
                      value={note.text}
                      onChange={(e) => {
                        const newNotes = [...data.publishingNotes]
                        newNotes[index].text = e.target.value
                        setData({ ...data, publishingNotes: newNotes })
                      }}
                      placeholder="Mô tả..."
                      rows={3}
                      className="bg-background"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const newNotes = [...data.publishingNotes]
                      newNotes.splice(index, 1)
                      setData({ ...data, publishingNotes: newNotes })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => {
                  setData({
                    ...data,
                    publishingNotes: [...data.publishingNotes, { title: "", text: "" }]
                  })
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Thêm mục mới
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative group">
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

      <section className="border-b border-border-default pb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Giới thiệu
        </p>
        <h1 className="max-w-3xl text-balance text-[32px] font-bold leading-tight tracking-tight md:text-[40px] whitespace-pre-wrap text-text-primary">
          {data.title}
        </h1>
        
        <div className="mt-8 font-serif text-[17px] leading-[1.8] text-text-secondary max-w-3xl [&_.ProseMirror]:!mx-0 [&_.ProseMirror>p]:!mx-0 [&_.ProseMirror>p]:!max-w-none">
          <PostBody content={data.body} />
        </div>
      </section>

      <section className="py-10">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Những gì chúng tôi xuất bản
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {data.publishingNotes.map((note: any) => (
            <article className="border-t border-border-default py-5 sm:border-t-0 sm:border-l sm:pl-5 sm:first:border-l-0 sm:first:pl-0" key={note.title}>
              <h2 className="font-semibold tracking-tight text-text-primary">{note.title}</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">
                {note.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border-default py-8">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          Đọc toàn bộ kho lưu trữ.
        </h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
          Bắt đầu với những bài luận mới nhất, hoặc gặp gỡ các tác giả đang định hình ấn phẩm này.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-[5px] bg-button-bg px-4 text-[13px] font-medium text-button-text transition-colors hover:bg-button-bg/90"
            href="/"
          >
            Bài viết mới nhất
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-[5px] border border-border-default px-4 text-[13px] font-medium transition-colors hover:bg-subtle-bg text-text-primary"
            href="/contributors"
          >
            Người đóng góp
          </Link>
        </div>
      </section>
    </div>
  )
}
