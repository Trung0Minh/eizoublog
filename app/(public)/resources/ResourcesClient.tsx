"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateResourcesPage } from "./actions"

interface ResourceCard {
  url: string
  domain: string
  logo: string
  description: string
  isLink?: boolean
}

interface ResourcesData {
  title: string
  description: string
  resources: ResourceCard[]
}

interface ResourcesClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPage: { content: any } | null
  isAdmin: boolean
  appName: string
}

const defaultResources: ResourceCard[] = [
  {
    url: "https://blog.sakugabooru.com/",
    domain: "Sakugabooru Blog",
    logo: "/logos/sakuga-blog.png",
    description: "Blog chuyên sâu về sakuga uy tín bậc nhất trong cộng đồng, cung cấp góc nhìn chuyên môn về hoạt hình và ngành công nghiệp anime. Đây cũng là nguồn tài liệu mà bọn mình tham khảo rất nhiều cho các bài viết.",
  },
  {
    url: "https://www.sakugabooru.com/",
    domain: "Sakugabooru",
    logo: "/logos/sakugabooru.png",
    description: "Thư viện lưu trữ và tổng hợp các đoạn clip (cut) sakuga đỉnh cao từ mọi bộ anime, giúp người xem dễ dàng chiêm ngưỡng kỹ năng của các họa sĩ diễn hoạt (animator).",
  },
  {
    url: "https://keyframe-stafflist.com/",
    domain: "Keyframe Stafflist",
    logo: "/logos/keyframe.png",
    description: "Trang web hàng đầu để theo dõi thông tin nhân sự (staff) và credit của các bộ anime dành cho những ai không rành tiếng Nhật. Giao diện trực quan, thông tin được trình bày đẹp mắt và vô cùng đầy đủ nhờ vào đội ngũ quản trị tâm huyết và cống hiến.",
  },
  {
    url: "https://x.com",
    domain: "Các tạp chí & X (Twitter)",
    logo: "X",
    description: "Rất nhiều thông tin giá trị đến từ các bài phỏng vấn không cố định trên các tạp chí chuyên đề hoặc báo điện tử. Cách tốt nhất để theo dõi là cập nhật thông tin từ tài khoản X (Twitter) chính thức của từng bộ anime, nơi họ sẽ đăng tải các liên kết phỏng vấn công khai mỗi khi có bài mới.",
    isLink: false
  },
  {
    url: "https://www.animenewsnetwork.com/",
    domain: "Anime News Network",
    logo: "/logos/ann.png",
    description: "Nguồn tin tức anime quốc tế uy tín, đồng thời là một bách khoa toàn thư để tra cứu nhân sự tham gia sản xuất và tin tức chung.",
  },
  {
    url: "https://anidb.net/",
    domain: "AniDB",
    logo: "/logos/anidb.png",
    description: "Cơ sở dữ liệu đồ sộ để theo dõi staff. Dù thông tin đôi khi được cập nhật đầy đủ hơn cả ANN, nhưng tốc độ cập nhật với các bộ mới thường khá chậm. Nhìn chung, bọn mình vẫn ưu tiên sử dụng keyframe-stafflist hơn cho mục đích tra cứu.",
  },
  {
    url: "https://anilist.co/",
    domain: "AniList",
    logo: "/logos/anilist.svg",
    description: "Nền tảng tuyệt vời để theo dõi lịch chiếu phim, quản lý danh sách anime/manga đang xem, cũng như tương tác với cộng đồng người hâm mộ.",
  },
]

export function ResourcesClient({ initialPage, isAdmin, appName }: ResourcesClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const initialData: ResourcesData = initialPage?.content || {
    title: "Nguồn tham khảo",
    description: `Dưới đây là danh sách các trang web, thư viện lưu trữ và cộng đồng uy tín mà ${appName} thường xuyên tham khảo để thu thập thông tin, nghiên cứu chuyên sâu về hoạt hình và ngành công nghiệp anime.`,
    resources: defaultResources
  }

  const [data, setData] = useState<ResourcesData>(initialData)

  function moveResource(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= data.resources.length) return

    const newResources = [...data.resources]
    const [resource] = newResources.splice(index, 1)
    newResources.splice(targetIndex, 0, resource)
    setData({ ...data, resources: newResources })
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await updateResourcesPage(data)
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
            Chỉnh sửa Nguồn tham khảo
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
            <label className="block text-sm font-semibold text-text-primary mb-2">Tiêu đề trang</label>
            <Input 
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="text-xl font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Đoạn giới thiệu</label>
            <Textarea 
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="pt-6 border-t border-border-default">
            <label className="block text-lg font-semibold mb-4 text-text-primary">Các nguồn tham khảo</label>
            <div className="space-y-6">
              {data.resources.map((resource, index) => (
                <div key={index} className="flex gap-4 items-start p-4 border border-border-default rounded-md relative group bg-subtle-bg/30">
                  <div className="flex shrink-0 flex-col gap-1 pt-1">
                    <Button
                      aria-label={`Di chuyển ${resource.domain || `nguồn ${index + 1}`} lên`}
                      disabled={index === 0}
                      onClick={() => moveResource(index, -1)}
                      size="icon"
                      title="Di chuyển lên"
                      type="button"
                      variant="outline"
                    >
                      <ArrowUp aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    <Button
                      aria-label={`Di chuyển ${resource.domain || `nguồn ${index + 1}`} xuống`}
                      disabled={index === data.resources.length - 1}
                      onClick={() => moveResource(index, 1)}
                      size="icon"
                      title="Di chuyển xuống"
                      type="button"
                      variant="outline"
                    >
                      <ArrowDown aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Tên trang web</label>
                        <Input 
                          value={resource.domain}
                          onChange={(e) => {
                            const newResources = [...data.resources]
                            newResources[index].domain = e.target.value
                            setData({ ...data, resources: newResources })
                          }}
                          placeholder="Tên web (VD: Sakugabooru)"
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Đường dẫn URL</label>
                        <Input 
                          value={resource.url}
                          onChange={(e) => {
                            const newResources = [...data.resources]
                            newResources[index].url = e.target.value
                            setData({ ...data, resources: newResources })
                          }}
                          placeholder="https://..."
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Đường dẫn Logo (hoặc chữ &quot;X&quot;)</label>
                        <Input 
                          value={resource.logo}
                          onChange={(e) => {
                            const newResources = [...data.resources]
                            newResources[index].logo = e.target.value
                            setData({ ...data, resources: newResources })
                          }}
                          placeholder="/logos/..."
                          className="bg-background"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Mô tả</label>
                      <Textarea 
                        value={resource.description}
                        onChange={(e) => {
                          const newResources = [...data.resources]
                          newResources[index].description = e.target.value
                          setData({ ...data, resources: newResources })
                        }}
                        placeholder="Mô tả về trang web này..."
                        rows={7}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                    onClick={() => {
                      const newResources = [...data.resources]
                      newResources.splice(index, 1)
                      setData({ ...data, resources: newResources })
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
                    resources: [...data.resources, { domain: "", url: "", logo: "", description: "" }]
                  })
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Thêm nguồn mới
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

      <section className="mb-12">
        <h1 className="text-[32px] font-bold leading-tight tracking-tight md:text-[40px] text-text-primary">
          {data.title}
        </h1>
        <p className="mt-4 text-[15px] text-text-secondary md:text-[16px] leading-relaxed max-w-3xl whitespace-pre-wrap">
          {data.description}
        </p>
      </section>

      <div className="flex flex-col gap-6">
        {data.resources.map((resource, index) => (
          <div
            key={index}
            className="group flex flex-col sm:flex-row items-start rounded-[12px] border border-border-default bg-subtle-bg/30 p-6 transition-all hover:border-accent/40 hover:bg-subtle-bg/60 hover:shadow-sm gap-6"
          >
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[10px] bg-background border border-border-default shadow-sm p-1.5 overflow-hidden">
              {resource.logo === "X" ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-10 w-10 fill-current text-text-primary">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.045z"></path>
                </svg>
              ) : resource.logo ? (
                <img src={resource.logo} alt={`${resource.domain} logo`} className="max-h-full max-w-full object-contain" />
              ) : null}
            </div>

            <div className="flex flex-col flex-1">
              {resource.isLink === false ? (
                <h3 className="mb-2 text-[17px] font-bold text-text-primary">
                  {resource.domain}
                </h3>
              ) : (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-2 inline-flex items-center text-[17px] font-bold text-text-primary hover:text-accent transition-colors"
                >
                  {resource.domain}
                  <svg
                    className="ml-1.5 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
              <p className="text-[14px] sm:text-[15px] leading-relaxed text-text-secondary">
                {resource.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
