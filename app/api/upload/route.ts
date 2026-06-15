import { nanoid } from "nanoid"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { uploadToR2 } from "@/lib/r2"

const ALLOWED_MIME_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
])
const MAX_BYTES_IMAGE = 5 * 1024 * 1024
const MAX_BYTES_GIF = 10 * 1024 * 1024
const MIME_EXTENSION: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
}
const MAX_BYTES_VIDEO = 100 * 1024 * 1024

function getFileExtension(file: File) {
  const parts = file.name.split(".")
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined

  return extension || MIME_EXTENSION[file.type] || "bin"
}

function getFolder(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return "uploads"
  }

  const folder = value.trim().replace(/^\/+|\/+$/g, "")

  if (folder.includes("..") || !/^[A-Za-z0-9/_-]+$/.test(folder)) {
    return "uploads"
  }

  return folder
}

function validateFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return Response.json(
      { error: "Only JPEG, PNG, GIF, WebP images and MP4, WebM videos are allowed" },
      { status: 400 },
    )
  }

  let maxBytes = MAX_BYTES_IMAGE
  let limit = 5

  if (file.type === "image/gif") {
    maxBytes = MAX_BYTES_GIF
    limit = 10
  } else if (file.type.startsWith("video/")) {
    maxBytes = MAX_BYTES_VIDEO
    limit = 100
  }

  if (file.size > maxBytes) {

    return Response.json(
      { error: `File must be ${limit} MB or smaller` },
      { status: 400 },
    )
  }

  return null
}

async function uploadFile(file: File, folder: string) {
  const key = `${folder}/${nanoid()}.${getFileExtension(file)}`
  const body = Buffer.from(await file.arrayBuffer())
  const url = await uploadToR2({ body, contentType: file.type, key })

  return { url }
}

export async function POST(request: Request) {
  const activeSession = await getActiveSession(["ADMIN", "WRITER"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const form = await request.formData()
    const entries = form.getAll("file")
    const folder = getFolder(form.get("folder"))
    const files: File[] = []

    if (entries.length === 0) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    for (const entry of entries) {
      if (!(entry instanceof File)) {
        return Response.json({ error: "No file provided" }, { status: 400 })
      }

      files.push(entry)
    }

    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        return error
      }
    }

    const uploaded = await Promise.all(
      files.map((file) => uploadFile(file, folder)),
    )

    if (uploaded.length === 1) {
      return Response.json({ data: { url: uploaded[0].url } }, { status: 201 })
    }

    return Response.json({ data: { files: uploaded } }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/upload]", error)
    return Response.json({ error: "Upload failed" }, { status: 500 })
  }
}
