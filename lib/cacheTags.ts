export const SITE_PAGES_CACHE_TAG = "site-pages"

export function getPostDetailCacheTag(slug: string) {
  return `post-detail:${slug}`
}
