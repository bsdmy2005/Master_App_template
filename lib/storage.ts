import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  type PutObjectCommandInput
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Initialize R2 client (S3-compatible)
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const r2Endpoint = process.env.R2_ENDPOINT
const r2BucketName = process.env.R2_BUCKET_NAME
const r2PublicUrl = process.env.R2_PUBLIC_URL

let s3Client: S3Client | null = null

if (r2AccessKeyId && r2SecretAccessKey && r2Endpoint) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey
    }
  })
}

// ============================================================================
// Types
// ============================================================================

export interface UploadOptions {
  /** The file content as a Buffer or string */
  body: Buffer | string | Uint8Array
  /** The key (path) where the file will be stored */
  key: string
  /** MIME type of the file */
  contentType?: string
  /** Custom metadata to attach to the file */
  metadata?: Record<string, string>
  /** Cache control header */
  cacheControl?: string
}

export interface UploadResult {
  success: boolean
  /** The key (path) of the uploaded file */
  key?: string
  /** Public URL if R2_PUBLIC_URL is configured */
  url?: string
  error?: string
}

export interface DownloadResult {
  success: boolean
  /** The file content as a Buffer */
  body?: Buffer
  /** MIME type of the file */
  contentType?: string
  /** File size in bytes */
  size?: number
  error?: string
}

export interface DeleteResult {
  success: boolean
  error?: string
}

export interface FileInfo {
  key: string
  size: number
  lastModified: Date
  contentType?: string
}

export interface ListResult {
  success: boolean
  files?: FileInfo[]
  /** Continuation token for pagination */
  nextToken?: string
  error?: string
}

export interface PresignedUrlResult {
  success: boolean
  url?: string
  expiresAt?: Date
  error?: string
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Upload a file to R2 storage
 *
 * @example
 * ```ts
 * // Upload a buffer
 * const result = await uploadFile({
 *   body: imageBuffer,
 *   key: "uploads/avatar.png",
 *   contentType: "image/png"
 * })
 *
 * // Upload with metadata
 * const result = await uploadFile({
 *   body: documentBuffer,
 *   key: "documents/report.pdf",
 *   contentType: "application/pdf",
 *   metadata: { uploadedBy: "user123" }
 * })
 * ```
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  if (!s3Client || !r2BucketName) {
    console.warn("R2 storage not configured. Set R2_* environment variables.")
    return {
      success: false,
      error: "Storage service not configured"
    }
  }

  try {
    const command: PutObjectCommandInput = {
      Bucket: r2BucketName,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
      Metadata: options.metadata,
      CacheControl: options.cacheControl
    }

    await s3Client.send(new PutObjectCommand(command))

    const url = r2PublicUrl ? `${r2PublicUrl}/${options.key}` : undefined

    return {
      success: true,
      key: options.key,
      url
    }
  } catch (error) {
    console.error("Failed to upload file:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Download a file from R2 storage
 *
 * @example
 * ```ts
 * const result = await downloadFile("uploads/avatar.png")
 * if (result.success && result.body) {
 *   // Use the buffer
 *   fs.writeFileSync("local-copy.png", result.body)
 * }
 * ```
 */
export async function downloadFile(key: string): Promise<DownloadResult> {
  if (!s3Client || !r2BucketName) {
    console.warn("R2 storage not configured. Set R2_* environment variables.")
    return {
      success: false,
      error: "Storage service not configured"
    }
  }

  try {
    const command = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: key
    })

    const response = await s3Client.send(command)

    if (!response.Body) {
      return {
        success: false,
        error: "File not found"
      }
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    const body = Buffer.concat(chunks)

    return {
      success: true,
      body,
      contentType: response.ContentType,
      size: response.ContentLength
    }
  } catch (error) {
    console.error("Failed to download file:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Delete a file from R2 storage
 *
 * @example
 * ```ts
 * const result = await deleteFile("uploads/old-avatar.png")
 * if (result.success) {
 *   console.log("File deleted")
 * }
 * ```
 */
export async function deleteFile(key: string): Promise<DeleteResult> {
  if (!s3Client || !r2BucketName) {
    console.warn("R2 storage not configured. Set R2_* environment variables.")
    return {
      success: false,
      error: "Storage service not configured"
    }
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: r2BucketName,
      Key: key
    })

    await s3Client.send(command)

    return { success: true }
  } catch (error) {
    console.error("Failed to delete file:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * List files in R2 storage with optional prefix filtering
 *
 * @example
 * ```ts
 * // List all files in uploads folder
 * const result = await listFiles("uploads/")
 *
 * // Paginate through results
 * const page1 = await listFiles("uploads/", 10)
 * const page2 = await listFiles("uploads/", 10, page1.nextToken)
 * ```
 */
export async function listFiles(
  prefix?: string,
  maxKeys: number = 100,
  continuationToken?: string
): Promise<ListResult> {
  if (!s3Client || !r2BucketName) {
    console.warn("R2 storage not configured. Set R2_* environment variables.")
    return {
      success: false,
      error: "Storage service not configured"
    }
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: r2BucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken
    })

    const response = await s3Client.send(command)

    const files: FileInfo[] =
      response.Contents?.map((item) => ({
        key: item.Key || "",
        size: item.Size || 0,
        lastModified: item.LastModified || new Date()
      })) || []

    return {
      success: true,
      files,
      nextToken: response.NextContinuationToken
    }
  } catch (error) {
    console.error("Failed to list files:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Get file metadata without downloading the content
 *
 * @example
 * ```ts
 * const info = await getFileInfo("uploads/avatar.png")
 * if (info) {
 *   console.log(`Size: ${info.size} bytes`)
 * }
 * ```
 */
export async function getFileInfo(key: string): Promise<FileInfo | null> {
  if (!s3Client || !r2BucketName) {
    console.warn("R2 storage not configured. Set R2_* environment variables.")
    return null
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: r2BucketName,
      Key: key
    })

    const response = await s3Client.send(command)

    return {
      key,
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType
    }
  } catch {
    return null
  }
}

// ============================================================================
// Presigned URLs
// ============================================================================

/**
 * Generate a presigned URL for uploading a file directly from the client
 * This is useful for large files to avoid server memory usage
 *
 * @example
 * ```ts
 * const result = await getPresignedUploadUrl("uploads/large-file.zip", "application/zip")
 * if (result.success && result.url) {
 *   // Client can PUT directly to this URL
 *   await fetch(result.url, { method: "PUT", body: file })
 * }
 * ```
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType?: string,
  expiresIn: number = 3600
): Promise<PresignedUrlResult> {
  if (!s3Client || !r2BucketName) {
    console.warn("R2 storage not configured. Set R2_* environment variables.")
    return {
      success: false,
      error: "Storage service not configured"
    }
  }

  try {
    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      ContentType: contentType
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    return {
      success: true,
      url,
      expiresAt
    }
  } catch (error) {
    console.error("Failed to generate presigned upload URL:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Generate a presigned URL for downloading a private file
 * Useful for granting temporary access to protected files
 *
 * @example
 * ```ts
 * const result = await getPresignedDownloadUrl("private/document.pdf", 3600)
 * if (result.success && result.url) {
 *   // Share this URL - expires in 1 hour
 * }
 * ```
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<PresignedUrlResult> {
  if (!s3Client || !r2BucketName) {
    console.warn("R2 storage not configured. Set R2_* environment variables.")
    return {
      success: false,
      error: "Storage service not configured"
    }
  }

  try {
    const command = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: key
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    return {
      success: true,
      url,
      expiresAt
    }
  } catch (error) {
    console.error("Failed to generate presigned download URL:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if storage service is configured
 */
export function isStorageConfigured(): boolean {
  return s3Client !== null && r2BucketName !== undefined
}

/**
 * Get the public URL for a file (if R2_PUBLIC_URL is configured)
 * Returns null if public access is not configured
 */
export function getPublicUrl(key: string): string | null {
  if (!r2PublicUrl) {
    return null
  }
  return `${r2PublicUrl}/${key}`
}

/**
 * Generate a unique key for a file upload
 * Includes a timestamp and random string to avoid collisions
 *
 * @example
 * ```ts
 * const key = generateUniqueKey("uploads", "avatar.png")
 * // Returns: "uploads/1704067200000-abc123.png"
 * ```
 */
export function generateUniqueKey(folder: string, filename: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = filename.includes(".") ? `.${filename.split(".").pop()}` : ""
  return `${folder}/${timestamp}-${random}${extension}`
}

/**
 * Get the bucket name
 */
export function getBucketName(): string | undefined {
  return r2BucketName
}
