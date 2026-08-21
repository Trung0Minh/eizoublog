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

const legacyLogoReplacements: Record<string, string> = {
  "/logos/archipel.svg": "/logos/archipel.png",
  "/logos/sakuga-blog.svg": "/logos/sakuga-blog.png",
  "/logos/settei-dreams.svg": "/logos/settei-dreams.png",
}

function isResourceCard(value: unknown): value is ResourceCard {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const resource = value as Record<string, unknown>

  return (
    typeof resource.url === "string" &&
    typeof resource.domain === "string" &&
    typeof resource.logo === "string" &&
    typeof resource.description === "string" &&
    (resource.category === undefined || typeof resource.category === "string") &&
    (resource.isLink === undefined || typeof resource.isLink === "boolean")
  )
}

function isResourcesData(value: unknown): value is ResourcesData {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const data = value as Record<string, unknown>

  return (
    typeof data.title === "string" &&
    typeof data.description === "string" &&
    Array.isArray(data.resources) &&
    data.resources.every(isResourceCard)
  )
}

function normalizeResourceLogos(resources: ResourceCard[]) {
  return resources.map((resource) => ({
    ...resource,
    logo: legacyLogoReplacements[resource.logo] ?? resource.logo,
  }))
}

function withMissingDefaultResources(resources: ResourceCard[]) {
  const normalizedResources = normalizeResourceLogos(resources)
  const defaultUrls = new Set(defaultResources.map((resource) => resource.url))
  const existingUrls = new Set(normalizedResources.map((resource) => resource.url))
  const usesDefaultResourceSet = normalizedResources.some((resource) =>
    defaultUrls.has(resource.url),
  )

  if (!usesDefaultResourceSet) {
    return normalizedResources
  }

  return [
    ...normalizedResources,
    ...[
      ...backfilledBlogResources,
      ...backfilledDatabaseResources,
      ...backfilledYoutubeResources,
      ...backfilledNewsResources,
    ].filter((resource) => !existingUrls.has(resource.url)),
  ]
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
                          {resource.logo === "X" ? (
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              className="h-full w-full fill-current"
                            >
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.045z"></path>
                            </svg>
                          ) : resource.logo ? (
                            <img
                              src={resource.logo}
                              alt=""
                              className={cn(
                                "h-full w-full",
                                isAvatarLogo(resource.logo)
                                  ? "object-cover"
                                  : "object-contain",
                              )}
                            />
                          ) : (
                            getDomainInitial(resource.domain)
                          )}
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
                      {editorResource.logo === "X" ? (
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="h-full w-full fill-current"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.045z"></path>
                        </svg>
                      ) : editorResource.logo ? (
                        <img
                          src={editorResource.logo}
                          alt=""
                          className={cn(
                            "h-full w-full",
                            isAvatarLogo(editorResource.logo)
                              ? "object-cover"
                              : "object-contain",
                          )}
                        />
                      ) : (
                        getDomainInitial(editorResource.domain)
                      )}
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
                              {resource.logo === "X" ? (
                                <svg
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                  className="h-full w-full fill-current text-text-primary"
                                >
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.936H5.045z"></path>
                                </svg>
                              ) : resource.logo ? (
                                <img
                                  src={resource.logo}
                                  alt={`${resource.domain} logo`}
                                  className={cn(
                                    "h-full w-full",
                                    isAvatarLogo(resource.logo)
                                      ? "object-cover"
                                      : "object-contain",
                                  )}
                                />
                              ) : null}
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
