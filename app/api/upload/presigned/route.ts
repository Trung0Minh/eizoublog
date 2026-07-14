import { nanoid } from "nanoid"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { getPresignedUploadUrl } from "@/lib/r2"

const ALLOWED_MIME_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
])
const MAX_BYTES_IMAGE = 20 * 1024 * 1024
const MAX_BYTES_GIF = 20 * 1024 * 1024
const MIME_EXTENSION: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
}
const MAX_BYTES_VIDEO = 100 * 1024 * 1024

function getFileExtension(filename: string, mimeType: string) {
  const parts = filename.split(".")
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined

  return extension || MIME_EXTENSION[mimeType] || "bin"
}

function getFolder(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return "uploads"
  }

  const folder = value.trim().replace(/^\/+|\/+$/g, "")

  if (folder.includes("..") || !/^[A-Za-z0-9/_-]+$/.test(folder)) {
    return "uploads"
  }

  return folder
}

function validateFile(type: string, size: number) {
  if (!ALLOWED_MIME_TYPES.has(type)) {
    return Response.json(
      { error: "Only JPEG, PNG, GIF, WebP images and MP4, WebM videos are allowed" },
      { status: 400 },
    )
  }

  let maxBytes = MAX_BYTES_IMAGE
  let limit = 20

  if (type === "image/gif") {
    maxBytes = MAX_BYTES_GIF
    limit = 20
  } else if (type.startsWith("video/")) {
    maxBytes = MAX_BYTES_VIDEO
    limit = 100
  }

  if (size > maxBytes) {
    return Response.json(
      { error: `File must be ${limit} MB or smaller` },
      { status: 400 },
    )
  }

  return null
}

export async function POST(request: Request) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    
    if (!body || !Array.isArray(body.files) || body.files.length === 0) {
      return Response.json({ error: "No files provided" }, { status: 400 })
    }

    const folder = getFolder(body.folder)
    
    for (const file of body.files) {
      if (!file.name || !file.type || typeof file.size !== "number") {
        return Response.json({ error: "Invalid file metadata" }, { status: 400 })
      }
      
      const error = validateFile(file.type, file.size)
      if (error) {
        return error
      }
    }

    const presignedUrls = await Promise.all(
      body.files.map(async (file: { name: string, type: string }) => {
        const key = `${folder}/${nanoid()}.${getFileExtension(file.name, file.type)}`
        return getPresignedUploadUrl({ contentType: file.type, key })
      })
    )

    return Response.json({ data: { files: presignedUrls } }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/upload/presigned]", error)
    return Response.json({ error: "Failed to generate upload URLs" }, { status: 500 })
  }
}
