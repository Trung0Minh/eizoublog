export function toVideoEmbedUrl(raw: string): string {
  const youtubeId = raw.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  )?.[1]

  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?rel=0`
  }

  return raw
}

export function isNativeVideo(raw: string): boolean {
  try {
    const urlWithoutQuery = raw.split("?")[0]
    return /\.(mp4|webm|ogg)$/i.test(urlWithoutQuery)
  } catch {
    return false
  }
}
