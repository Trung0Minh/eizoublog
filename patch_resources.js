const fs = require('fs');

let content = fs.readFileSync('app/(public)/resources/ResourcesClient.tsx', 'utf8');

// 1. Add category to ResourceCard
content = content.replace(
  /interface ResourceCard {[\s\S]*?}/,
  `interface ResourceCard {
  url: string
  domain: string
  logo: string
  description: string
  category?: string
  isLink?: boolean
}`
);

// 2. Update default resources with categories
const defaultResourcesMatch = content.match(/const defaultResources: ResourceCard\[\] = \[([\s\S]*?)\];/);
if (defaultResourcesMatch) {
  let defaultResourcesStr = defaultResourcesMatch[1];

  // Replace items to include category
  defaultResourcesStr = defaultResourcesStr.replace(
    /domain: "Sakugabooru Blog",/,
    'domain: "Sakugabooru Blog",\n    category: "Cơ sở dữ liệu & Bách khoa toàn thư",'
  ).replace(
    /domain: "Sakugabooru",/,
    'domain: "Sakugabooru",\n    category: "Cơ sở dữ liệu & Bách khoa toàn thư",'
  ).replace(
    /domain: "Keyframe Stafflist",/,
    'domain: "Keyframe Stafflist",\n    category: "Cơ sở dữ liệu & Bách khoa toàn thư",'
  ).replace(
    /domain: "Anime News Network",/,
    'domain: "Anime News Network",\n    category: "Cơ sở dữ liệu & Bách khoa toàn thư",'
  ).replace(
    /domain: "AniDB",/,
    'domain: "AniDB",\n    category: "Cơ sở dữ liệu & Bách khoa toàn thư",'
  ).replace(
    /domain: "AniList",/,
    'domain: "AniList",\n    category: "Cơ sở dữ liệu & Bách khoa toàn thư",'
  ).replace(
    /domain: "Các tạp chí & X \(Twitter\)",/,
    'domain: "Các tạp chí & X (Twitter)",\n    category: "Phân tích & Bình luận (Blog)",'
  ).replace(
    /domain: "ArtistUnknown",/,
    'domain: "ArtistUnknown",\n    category: "Phân tích & Bình luận (Blog)",'
  ).replace(
    /domain: "fullfrontal\.moe",/,
    'domain: "fullfrontal.moe",\n    category: "Phân tích & Bình luận (Blog)",'
  ).replace(
    /domain: "Magical Stage",/,
    'domain: "Magical Stage",\n    category: "Phân tích & Bình luận (Blog)",'
  ).replace(
    /domain: "SHINSEIKI",/,
    'domain: "SHINSEIKI",\n    category: "Phân tích & Bình luận (Blog)",'
  ).replace(
    /domain: "Ultimate MegaX",/,
    'domain: "Ultimate MegaX",\n    category: "Phân tích & Bình luận (Blog)",'
  ).replace(
    /domain: "Sarca \(Anime Atelier\)",/,
    'domain: "Sarca (Anime Atelier)",\n    category: "Phân tích & Bình luận (Blog)",'
  ).replace(
    /domain: "RCAnime",/,
    'domain: "RCAnime",\n    category: "Kênh YouTube",'
  ).replace(
    /domain: "LKR",/,
    'domain: "LKR",\n    category: "Kênh YouTube",'
  ).replace(
    /domain: "Under the Scope",/,
    'domain: "Under the Scope",\n    category: "Kênh YouTube",'
  ).replace(
    /domain: "The Canipa Effect",/,
    'domain: "The Canipa Effect",\n    category: "Kênh YouTube",'
  ).replace(
    /domain: "Hip-Hop Sakuga",/,
    'domain: "Hip-Hop Sakuga",\n    category: "Kênh YouTube",'
  );

  content = content.replace(defaultResourcesMatch[1], defaultResourcesStr);
}

fs.writeFileSync('app/(public)/resources/ResourcesClient.tsx', content);
