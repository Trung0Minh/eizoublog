import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

interface UploadToR2Options {
  body: Buffer
  contentType: string
  key: string
}

interface R2Config {
  accountId: string
  accessKeyId: string
  bucketName: string
  publicUrl: string
  secretAccessKey: string
}

function getR2Config(): R2Config {
  const {
    R2_ACCOUNT_ID: accountId,
    R2_ACCESS_KEY_ID: accessKeyId,
    R2_BUCKET_NAME: bucketName,
    R2_PUBLIC_URL: publicUrl,
    R2_SECRET_ACCESS_KEY: secretAccessKey,
  } = process.env

  if (!accountId || !accessKeyId || !bucketName || !publicUrl || !secretAccessKey) {
    throw new Error("Cloudflare R2 environment variables are not configured")
  }

  return { accountId, accessKeyId, bucketName, publicUrl, secretAccessKey }
}

function createR2Client(config: R2Config) {
  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    region: "auto",
  })
}

function getR2ObjectKey(publicUrl: string, configuredPublicUrl: string) {
  try {
    const base = new URL(`${configuredPublicUrl.replace(/\/$/, "")}/`)
    const candidate = new URL(publicUrl)

    if (
      candidate.origin !== base.origin ||
      !candidate.pathname.startsWith(base.pathname)
    ) {
      return null
    }

    const key = decodeURIComponent(candidate.pathname.slice(base.pathname.length))
    return key || null
  } catch {
    return null
  }
}

export async function deleteR2Objects(publicUrls: readonly string[]) {
  if (publicUrls.length === 0) return

  const config = getR2Config()
  const keys = Array.from(
    new Set(
      publicUrls.flatMap((publicUrl) => {
        const key = getR2ObjectKey(publicUrl, config.publicUrl)
        return key ? [key] : []
      }),
    ),
  )

  if (keys.length === 0) return

  const client = createR2Client(config)

  for (let index = 0; index < keys.length; index += 1000) {
    const batch = keys.slice(index, index + 1000)
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: config.bucketName,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    )

    if (result.Errors?.length) {
      throw new Error("Cloudflare R2 failed to delete one or more objects")
    }
  }
}

export async function uploadToR2({
  body,
  contentType,
  key,
}: UploadToR2Options): Promise<string> {
  const config = getR2Config()
  const client = createR2Client(config)

  await client.send(
    new PutObjectCommand({
      Body: body,
      Bucket: config.bucketName,
      ContentType: contentType,
      Key: key,
    }),
  )

  return `${config.publicUrl.replace(/\/$/, "")}/${key}`
}

export async function getPresignedUploadUrl({
  contentType,
  key,
}: Omit<UploadToR2Options, "body">): Promise<{ uploadUrl: string; publicUrl: string }> {
  const config = getR2Config()
  const client = createR2Client(config)
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    ContentType: contentType,
    Key: key,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
  const publicUrl = `${config.publicUrl.replace(/\/$/, "")}/${key}`

  return { uploadUrl, publicUrl }
}
