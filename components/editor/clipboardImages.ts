export function getClipboardImageFiles(clipboardData: DataTransfer) {
  return Array.from(clipboardData.items).flatMap((item) => {
    if (item.kind !== "file" || !item.type.startsWith("image/")) {
      return []
    }

    const file = item.getAsFile()
    return file ? [file] : []
  })
}
