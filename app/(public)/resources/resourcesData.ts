export interface ResourceCard {
  url: string
  domain: string
  logo: string
  description: string
  category?: string
  isLink?: boolean
}

export interface ResourcesData {
  title: string
  description: string
  resources: ResourceCard[]
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

export const defaultResources: ResourceCard[] = [
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

export function isResourcesData(value: unknown): value is ResourcesData {
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

export function withMissingDefaultResources(resources: ResourceCard[]) {
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

