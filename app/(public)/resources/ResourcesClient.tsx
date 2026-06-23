"use client"

import { useEffect, useRef, useState, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import { GripVertical, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TextReveal } from "@/components/ui/TextReveal"
import { ScrollReveal } from "@/components/ui/ScrollReveal"
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
  resources: ResourceCard[]
}

interface ResourcesClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPage: { content: any } | null
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

function isAvatarLogo(logoPath: string) {
  const avatarLogos = [
    "magicalstage",
    "ultimatemegax",
    "artistunknown",
    "sarca",
    "rcanime",
    "lkr",
    "uts",
    "canipa",
    "hiphopsakuga",
    "hobbessakuga"
  ]
  return avatarLogos.some(name => logoPath.toLowerCase().includes(name))
}

const backfilledBlogResources: ResourceCard[] = [
  {
    url: "https://washiblog.wordpress.com/",
    domain: "Washi's Blog",
    logo: "/logos/washi-blog.svg",
    description: "Blog cá nhân với tagline \"Good at Anime\", tập trung vào các bài viết, ghi chú và phân tích về anime từ góc nhìn của một cây bút lâu năm. Đây là nguồn tham khảo hữu ích khi cần thêm bối cảnh phê bình và quan sát chi tiết về các tác phẩm hoặc xu hướng trong cộng đồng anime.",
    category: "Blog",
  },
  {
    url: "https://animetudes.com/",
    domain: "Animétudes",
    logo: "/logos/animetudes.svg",
    description: "Blog nghiên cứu về nghệ thuật và lịch sử hoạt hình, nổi bật với các series dài hơi về Mushi Pro, Tatsunoko, trường phái Kanada, TMS và nhiều bài dịch/phân tích chuyên sâu. Đây là nguồn rất giá trị cho các bài viết cần bối cảnh lịch sử, lý thuyết hoạt hình và nghiên cứu sakuga nghiêm túc.",
    category: "Blog",
  },
  {
    url: "https://sakuga.fandom.com/wiki/Sakuga_Wiki",
    domain: "Sakuga Wiki",
    logo: "/logos/sakuga-wiki.svg",
    description: "Bách khoa toàn thư cộng đồng về quy trình và kỹ thuật sản xuất anime, giải thích các thuật ngữ như e-konte, genga, douga, shiage, settei và nhiều khái niệm trong pipeline. Đây là nguồn tra cứu nhanh hữu ích khi cần chuẩn hóa thuật ngữ hoặc giải thích các bước sản xuất trong bài viết.",
    category: "Blog",
  },
  {
    url: "https://ghiblicon.blogspot.com/",
    domain: "Ghibli Blog",
    logo: "/logos/ghibli-blog.ico",
    description: "Blog dành cho người yêu Studio Ghibli, hoạt hình và điện ảnh, tập trung vào tin tức, review, tiểu luận và các bài viết chuyên sâu về Hayao Miyazaki, Isao Takahata cùng những tác phẩm liên quan. Đây là nguồn tham khảo hữu ích khi cần góc nhìn lịch sử, phê bình và bối cảnh về Studio Ghibli.",
    category: "Blog",
  },
]

const backfilledDatabaseResources: ResourceCard[] = [
  {
    url: "https://setteidreams.net/",
    domain: "Settei Dreams",
    logo: "/logos/settei-dreams.png",
    description: "Kho lưu trữ lớn về tư liệu sản xuất hoạt hình, bao gồm settei, color design, artbook, storyboard và production sketch. Trang rất hữu ích để tham khảo thiết kế nhân vật, đạo cụ, bối cảnh và các sheet hậu trường phục vụ nghiên cứu, fan art, dựng hình 3D hoặc cosplay.",
    category: "Cơ sở dữ liệu",
  },
]

const backfilledYoutubeResources: ResourceCard[] = [
  {
    url: "https://www.youtube.com/@ArchipelDocumentaries",
    domain: "Archipel",
    logo: "/logos/archipel.png",
    description: "Kênh tài liệu chuyên phỏng vấn và ghi lại chân dung các nghệ sĩ, nhà sáng tạo và nhân sự trong ngành văn hóa đại chúng Nhật Bản. Archipel đặc biệt hữu ích khi cần tư liệu dạng documentary về quá trình sáng tạo, tư duy nghề nghiệp và bối cảnh làm việc của các cá nhân trong ngành anime, manga, game và nghệ thuật thị giác.",
    category: "Kênh YouTube",
  },
]

const backfilledNewsResources: ResourceCard[] = [
  {
    url: "https://www3.nhk.or.jp/nhkworld/en/shows/anime_manga/",
    domain: "NHK World Anime Manga Explosion",
    logo: "/logos/nhk-anime-manga.svg",
    description: "Chuyên mục của NHK World về anime và manga, gồm các video giới thiệu, phỏng vấn và phóng sự ngắn về tác phẩm, tác giả và xu hướng trong ngành. Lưu ý là series thật sự có nhiều tập hơn, nhưng trang này thường chỉ giữ một phần các tập mới và gỡ bớt tập cũ; nếu cần video cũ hơn thì nên tìm lại trên YouTube, nếu may mắn vẫn còn bản lưu.",
    category: "Tin tức",
  },
]

const defaultResources: ResourceCard[] = [
  // Blog / Editorial
  {
    url: "https://blog.sakugabooru.com/",
    domain: "Sakugabooru Blog",
    logo: "/logos/sakuga-blog.png",
    description: "Blog chuyên sâu về sakuga uy tín bậc nhất trong cộng đồng, cung cấp góc nhìn chuyên môn về hoạt hình và ngành công nghiệp anime. Đây cũng là nguồn tài liệu mà bọn mình tham khảo rất nhiều cho các bài viết.",
    category: "Blog",
  },
  {
    url: "https://artistunknown.info/",
    domain: "ArtistUnknown",
    logo: "/logos/artistunknown.jpg",
    description: "Trang blog chuyên sâu về phân tích sakuga và quy trình sản xuất anime. Đây là nơi chia sẻ những bài phân tích chi tiết về phong cách của các họa sĩ diễn hoạt (animator), đạo diễn, cùng các thông tin/phóng sự từ các sự kiện anime lớn như Otakon.",
    category: "Blog",
  },
  {
    url: "https://fullfrontal.moe/",
    domain: "fullfrontal.moe",
    logo: "/logos/fullfrontal.png",
    description: "Chuyên trang uy tín về diễn hoạt và văn hóa anime/manga, nổi bật với chuyên mục \"Sakuga Espresso\" phân tích chi tiết các phân cảnh hoạt họa ấn tượng. Trang web còn cung cấp nhiều bài phỏng vấn chuyên sâu với các nhân sự trong ngành cùng các phân tích sắc sảo về khía cạnh kinh doanh của anime.",
    category: "Blog",
  },
  {
    url: "https://magicalstage.moe/",
    domain: "Magical Stage",
    logo: "/logos/magicalstage.jpg",
    description: "Nền tảng báo chí và bình luận anime độc lập được vận hành bởi buildknuckle và các cộng sự. Trang web nổi tiếng với phong cách viết hài hước xen lẫn các bài phỏng vấn dịch thuật nghiêm túc, sâu sắc về đội ngũ sản xuất và các xu hướng mới trong ngành công nghiệp anime.",
    category: "Blog",
  },
  {
    url: "https://shinseiki.blog/",
    domain: "SHINSEIKI",
    logo: "/logos/shinseiki.png",
    description: "Dự án phi lợi nhuận chuyên dịch thuật các bài phỏng vấn đạo diễn, họa sĩ diễn hoạt và nhà sản xuất anime từ các nguồn tư liệu gốc tiếng Nhật (như sách, tạp chí, booklet). Đây là nguồn tài liệu vô cùng quý giá để tìm hiểu sâu về tư duy nghệ thuật và hậu trường sản xuất của nhiều tác phẩm kinh điển.",
    category: "Blog",
  },
  {
    url: "https://ultimatemegax.wordpress.com/",
    domain: "Ultimate MegaX",
    logo: "/logos/ultimatemegax.png",
    description: "Trang blog lâu đời và vô cùng uy tín trong cộng đồng nghiên cứu anime quốc tế. Blog nổi tiếng với những bài dịch phỏng vấn nhân sự và phân tích chi tiết về ban sản xuất (production committee), đặc biệt là các thông tin chuyên sâu xoay quanh studio Kyoto Animation.",
    category: "Blog",
  },
  {
    url: "https://www.anime-atelier.com/author/sarca/",
    domain: "Sarca (Anime Atelier)",
    logo: "/logos/sarca.png",
    description: "Cây bút phân tích tự do trên chuyên trang Anime Atelier. Tác giả Sarca nổi tiếng với những bài viết nghiên cứu sâu sắc về hậu trường sản xuất, phân tích phong cách nghệ thuật của các đạo diễn (như Shin Oonuma, Satoshi Mori), và các bài thảo luận về chất lượng diễn họa của các dự án anime nổi tiếng.",
    category: "Blog",
  },
  ...backfilledBlogResources,
  // Database
  {
    url: "https://www.sakugabooru.com/",
    domain: "Sakugabooru",
    logo: "/logos/sakugabooru.png",
    description: "Thư viện lưu trữ và tổng hợp các đoạn clip (cut) sakuga đỉnh cao từ mọi bộ anime, giúp người xem dễ dàng chiêm ngưỡng kỹ năng của các họa sĩ diễn hoạt (animator).",
    category: "Cơ sở dữ liệu",
  },
  {
    url: "https://keyframe-stafflist.com/",
    domain: "Keyframe Stafflist",
    logo: "/logos/keyframe.png",
    description: "Trang web hàng đầu để theo dõi thông tin nhân sự (staff) và credit của các bộ anime dành cho những ai không rành tiếng Nhật. Giao diện trực quan, thông tin được trình bày đẹp mắt và vô cùng đầy đủ nhờ vào đội ngũ quản trị tâm huyết và cống hiến.",
    category: "Cơ sở dữ liệu",
  },
  {
    url: "https://www.animenewsnetwork.com/",
    domain: "Anime News Network",
    logo: "/logos/ann.png",
    description: "Nguồn tin tức anime quốc tế uy tín, đồng thời là một bách khoa toàn thư để tra cứu nhân sự tham gia sản xuất và tin tức chung.",
    category: "Cơ sở dữ liệu",
  },
  {
    url: "https://anidb.net/",
    domain: "AniDB",
    logo: "/logos/anidb.png",
    description: "Cơ sở dữ liệu đồ sộ để theo dõi staff. Dù thông tin đôi khi được cập nhật đầy đủ hơn cả ANN, nhưng tốc độ cập nhật với các bộ mới thường khá chậm. Nhìn chung, bọn mình vẫn ưu tiên sử dụng keyframe-stafflist hơn cho mục đích tra cứu.",
    category: "Cơ sở dữ liệu",
  },
  {
    url: "https://anilist.co/",
    domain: "AniList",
    logo: "/logos/anilist.svg",
    description: "Nền tảng tuyệt vời để theo dõi lịch chiếu phim, quản lý danh sách anime/manga đang xem, cũng như tương tác với cộng đồng người hâm mộ.",
    category: "Cơ sở dữ liệu",
  },
  ...backfilledDatabaseResources,
  // Misc
  {
    url: "https://x.com",
    domain: "Các tạp chí & X (Twitter)",
    logo: "X",
    description: "Rất nhiều thông tin giá trị đến từ các bài phỏng vấn không cố định trên các tạp chí chuyên đề hoặc báo điện tử. Cách tốt nhất để theo dõi là cập nhật thông tin từ tài khoản X (Twitter) chính thức của từng bộ anime, nơi họ sẽ đăng tải các liên kết phỏng vấn công khai mỗi khi có bài mới.",
    isLink: false,
    category: "Khác",
  },
  // YouTube
  {
    url: "https://www.youtube.com/@RCAnime",
    domain: "RCAnime",
    logo: "/logos/rcanime.jpg",
    description: "Kênh video essay nổi tiếng về anime trên YouTube, tập trung vào nghệ thuật diễn hoạt, lịch sử ngành công nghiệp và các kỹ thuật kể chuyện bằng hình ảnh. RCAnime nổi bật với các bài phân tích sâu sắc về cách các đạo diễn sử dụng khung hình, nhịp điệu và màu sắc để truyền tải cảm xúc.",
    category: "Kênh YouTube",
  },
  {
    url: "https://www.youtube.com/@LKR9029",
    domain: "LKR",
    logo: "/logos/lkr.jpg",
    description: "Kênh YouTube chuyên tổng hợp và thực hiện các video tri ân (tribute) dành riêng cho các họa sĩ diễn hoạt (animator) nổi tiếng trong ngành công nghiệp anime. LKR cung cấp các clip tuyển tập sakuga chất lượng cao kèm thông tin chi tiết về phong cách đặc trưng của từng họa sĩ.",
    category: "Kênh YouTube",
  },
  {
    url: "https://www.youtube.com/@UnderTheScopeAnime",
    domain: "Under the Scope",
    logo: "/logos/uts.jpg",
    description: "Kênh YouTube chuyên về video essay phân tích nghệ thuật điện ảnh trong anime. Under the Scope được đánh giá cao nhờ những phân tích tỉ mỉ về ngôn ngữ hình ảnh, bố cục khung hình, kỹ thuật đạo diễn và âm nhạc trong các tác phẩm của Kyoto Animation cùng nhiều studio tên tuổi khác.",
    category: "Kênh YouTube",
  },
  {
    url: "https://www.youtube.com/@TheCanipaEffect",
    domain: "The Canipa Effect",
    logo: "/logos/canipa.jpg",
    description: "Kênh YouTube uy tín hàng đầu được vận hành bởi nhà báo Callum May, chuyên thực hiện các phóng sự và phân tích chi tiết về quy trình sản xuất anime, lịch sử các studio hoạt hình và chân dung của những họa sĩ diễn hoạt (animator) tài ba. Đây là nguồn tư liệu chuẩn xác và phong phú cho cộng đồng yêu thích sakuga.",
    category: "Kênh YouTube",
  },
  {
    url: "https://www.youtube.com/@HipHopSakuga",
    domain: "Hip-Hop Sakuga",
    logo: "/logos/hiphopsakuga.jpg",
    description: "Kênh YouTube độc đáo kết hợp các đoạn cắt sakuga đỉnh cao của anime với các bản nhạc hip-hop/lo-fi sôi động. Đây là nơi tuyệt vời để vừa thưởng thức kỹ năng diễn hoạt xuất sắc của các animator vừa tận hưởng không gian âm nhạc thư giãn.",
    category: "Kênh YouTube",
  },
  {
    url: "https://www.youtube.com/@HobbesSakuga",
    domain: "Hobbes Sakuga",
    logo: "/logos/hobbessakuga.jpg",
    description: "Kênh YouTube chuyên thực hiện các video tổng hợp (sakuga MAD) chất lượng cao và phân tích ngắn về các phân cảnh hoạt họa xuất sắc trong anime. Kênh tập trung giới thiệu nét vẽ cá nhân của các họa sĩ diễn hoạt và sự phát triển của phong cách sakuga qua các thời kỳ.",
    category: "Kênh YouTube",
  },
  ...backfilledYoutubeResources,
  ...backfilledNewsResources,
]

function withMissingDefaultResources(resources: ResourceCard[]) {
  const defaultUrls = new Set(defaultResources.map((resource) => resource.url))
  const existingUrls = new Set(resources.map((resource) => resource.url))
  const usesDefaultResourceSet = resources.some((resource) =>
    defaultUrls.has(resource.url),
  )

  if (!usesDefaultResourceSet) {
    return resources
  }

  return [
    ...resources,
    ...[
      ...backfilledBlogResources,
      ...backfilledDatabaseResources,
      ...backfilledYoutubeResources,
      ...backfilledNewsResources,
    ].filter((resource) => !existingUrls.has(resource.url)),
  ]
}

export function ResourcesClient({ initialPage, isAdmin, appName }: ResourcesClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draggedResourceIndex, setDraggedResourceIndex] = useState<number | null>(null)

  const initialData: ResourcesData = initialPage?.content
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
      sourceIndex >= data.resources.length ||
      targetIndex >= data.resources.length
    ) {
      return
    }

    const newResources = [...data.resources]
    const [resource] = newResources.splice(sourceIndex, 1)
    newResources.splice(targetIndex, 0, resource)
    setData({ ...data, resources: newResources })
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
            Chỉnh sửa Nguồn tham khảo
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-border-default font-bold"
              onClick={() => {
                setData(initialData)
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
            <label className="block text-sm font-semibold text-text-primary mb-2">Tiêu đề trang</label>
            <Input
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className="text-xl font-bold rounded-xl bg-background border-[2px] border-border-default"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Đoạn giới thiệu</label>
            <Textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              rows={3}
              className="rounded-xl bg-background border-[2px] border-border-default"
            />
          </div>

          <div className="pt-6 border-t border-border-default">
            <label className="block text-lg font-semibold mb-4 text-text-primary">Các nguồn tham khảo</label>
            <div className="space-y-6">
              {data.resources.map((resource, index) => (
                <div
                  className={[
                    "flex gap-4 items-start p-6 border-[2px] border-border-default rounded-[24px] relative group bg-subtle-bg/30 transition-colors",
                    draggedResourceIndex === index ? "opacity-60 border-accent" : "",
                  ].join(" ")}
                  data-testid={`resource-editor-card-${resource.domain || index}`}
                  key={index}
                  onDragOver={handleResourceDragOver}
                  onDrop={(event) => handleResourceDrop(event, index)}
                >
                  <button
                    aria-label={`Kéo ${resource.domain || `nguồn ${index + 1}`} để sắp xếp`}
                    className="mt-1 grid h-9 w-9 shrink-0 cursor-grab place-items-center rounded-[5px] border border-border-default bg-background text-text-tertiary transition-colors hover:border-accent hover:text-text-primary active:cursor-grabbing"
                    draggable
                    onDragEnd={() => setDraggedResourceIndex(null)}
                    onDragStart={(event) => {
                      setDraggedResourceIndex(index)
                      event.dataTransfer.effectAllowed = "move"
                    }}
                    title="Kéo để sắp xếp"
                    type="button"
                  >
                    <GripVertical aria-hidden="true" className="h-4 w-4" />
                  </button>
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
                          className="bg-background rounded-xl border-[2px] border-border-default"
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
                          className="bg-background rounded-xl border-[2px] border-border-default"
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
                          className="bg-background rounded-xl border-[2px] border-border-default"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Phân loại (Category)</label>
                        <Input
                          value={resource.category || ""}
                          onChange={(e) => {
                            const newResources = [...data.resources]
                            newResources[index].category = e.target.value
                            setData({ ...data, resources: newResources })
                          }}
                          placeholder="Ví dụ: Cơ sở dữ liệu..."
                          className="bg-background rounded-xl border-[2px] border-border-default"
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
                        className="bg-background rounded-xl border-[2px] border-border-default"
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
                className="w-full border-dashed rounded-[24px] py-8 text-text-secondary hover:text-text-primary"
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


  // Group by category
  const categories = Array.from(new Set(data.resources.map((r) => r.category || "Khác")));

  return (
    <div className="relative group">
      {isAdmin && (
        <Button
          onClick={() => setIsEditing(true)}
          className="absolute right-0 top-0 z-10 shadow-sm"
          size="sm"
          variant="outline"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Chỉnh sửa trang
        </Button>
      )}

      <div className="min-h-screen flex flex-col pt-0">
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 pt-8 md:pt-16 pb-20">
          <h1 className="text-[40px] md:text-[56px] font-bold font-display tracking-tight text-text-primary leading-[1.1] mb-6">
            <TextReveal text={data.title.split(" ")[0] || "Nguồn"} /> <br />
            <TextReveal text={data.title.split(" ").slice(1).join(" ") || "tham khảo"} className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500" />
          </h1>
          <ScrollReveal delay={0.2}>
            <p className="text-[18px] text-text-secondary leading-relaxed mb-16 max-w-[600px] whitespace-pre-wrap">
              {data.description}
            </p>
          </ScrollReveal>

          <div className="space-y-16">
            {categories.map((category) => (
              <div key={category}>
                <ScrollReveal delay={0.1}>
                  <h2 className="text-[24px] font-bold font-display text-text-primary mb-6 flex items-center gap-3">
                    <span className="w-8 h-[2px] bg-accent rounded-full inline-block"></span>
                    {category}
                  </h2>
                </ScrollReveal>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.resources
                    .filter((r) => (r.category || "Khác") === category)
                    .map((resource, index) => {
                      const isLink = resource.isLink !== false

                      const CardContent = () => (
                        <>
                            <div className="absolute top-0 right-0 p-4 opacity-0 transition-opacity translate-x-2 duration-300 group-hover/resource:translate-x-0 group-hover/resource:opacity-100">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                              <path d="M7 17l9.2-9.2M17 17V7H7" />
                            </svg>
                          </div>
                          <div className="flex items-center gap-4 mb-4">
                            <div className={cn(
                              "w-12 h-12 bg-background rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-border shadow-sm",
                              isAvatarLogo(resource.logo || "") ? "p-0" : "p-2"
                            )}>
                              {resource.logo === "X" ? (
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full fill-current text-text-primary">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.045z"></path>
                                </svg>
                              ) : resource.logo ? (
                                <img
                                  src={resource.logo}
                                  alt={`${resource.domain} logo`}
                                  className={cn(
                                    "w-full h-full",
                                    isAvatarLogo(resource.logo) ? "object-cover" : "object-contain"
                                  )}
                                />
                              ) : null}
                            </div>
                            <h3 className="text-[20px] font-bold font-display text-text-primary transition-colors group-hover/resource:text-accent">
                              {resource.domain}
                            </h3>
                          </div>
                          <p className="text-[14px] leading-relaxed text-text-secondary">
                            {resource.description}
                          </p>
                        </>
                      )

                      const commonClasses = "glass-card group/resource block p-6 overflow-hidden"

                      if (isLink) {
                        return (
                          <ScrollReveal key={index} delay={index * 0.1}>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={commonClasses}
                            >
                              <CardContent />
                            </a>
                          </ScrollReveal>
                        )
                      }

                      return (
                        <ScrollReveal key={index} delay={index * 0.1}>
                          <div className={commonClasses}>
                            <CardContent />
                          </div>
                        </ScrollReveal>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
