"use server"

import { db } from "@/db/db"
import { files, type FileRecord, type NewFileRecord } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { ActionState } from "@/types/actions-types"
import {
  uploadFile,
  deleteFile,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  generateUniqueKey,
  isStorageConfigured
} from "@/lib/storage"

/**
 * Server Actions for File Storage
 *
 * These actions handle file uploads to Cloudflare R2 and
 * track file metadata in the database. They follow the
 * same patterns as other server actions in the app.
 */

// ============================================================================
// UPLOAD
// ============================================================================

interface UploadFileInput {
  file: File
  uploaderId: string
  folder?: string
  description?: string
}

/**
 * Upload a file to R2 and track it in the database
 */
export async function uploadFileAction(
  formData: FormData
): Promise<ActionState<FileRecord>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    if (!isStorageConfigured()) {
      return { isSuccess: false, message: "Storage service not configured" }
    }

    const file = formData.get("file") as File | null
    const uploaderId = formData.get("uploaderId") as string | null
    const folder = (formData.get("folder") as string) || "uploads"
    const description = formData.get("description") as string | null

    if (!file) {
      return { isSuccess: false, message: "No file provided" }
    }

    if (!uploaderId) {
      return { isSuccess: false, message: "Uploader ID is required" }
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique storage key
    const storageKey = generateUniqueKey(folder, file.name)

    // Upload to R2
    const uploadResult = await uploadFile({
      body: buffer,
      key: storageKey,
      contentType: file.type
    })

    if (!uploadResult.success) {
      return {
        isSuccess: false,
        message: uploadResult.error || "Failed to upload file"
      }
    }

    // Save metadata to database (no publicUrl - files are accessed via presigned URLs)
    const fileData: NewFileRecord = {
      uploaderId,
      storageKey,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      folder,
      description: description || undefined
    }

    const [newFile] = await db.insert(files).values(fileData).returning()

    revalidatePath("/dashboard/storage")

    return {
      isSuccess: true,
      message: "File uploaded successfully",
      data: newFile
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to upload file"
    }
  }
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get all files for a user
 */
export async function getUserFilesAction(
  uploaderId: string
): Promise<ActionState<FileRecord[]>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const userFiles = await db
      .select()
      .from(files)
      .where(eq(files.uploaderId, uploaderId))
      .orderBy(desc(files.createdAt))

    return {
      isSuccess: true,
      message: "Files retrieved successfully",
      data: userFiles
    }
  } catch (error) {
    console.error("Error fetching files:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch files"
    }
  }
}

/**
 * Get a single file by ID
 */
export async function getFileByIdAction(
  id: string
): Promise<ActionState<FileRecord>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const [file] = await db.select().from(files).where(eq(files.id, id))

    if (!file) {
      return { isSuccess: false, message: "File not found" }
    }

    return {
      isSuccess: true,
      message: "File retrieved successfully",
      data: file
    }
  } catch (error) {
    console.error("Error fetching file:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch file"
    }
  }
}

/**
 * Get all files (admin view)
 */
export async function getAllFilesAction(): Promise<ActionState<FileRecord[]>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const allFiles = await db
      .select()
      .from(files)
      .orderBy(desc(files.createdAt))

    return {
      isSuccess: true,
      message: "Files retrieved successfully",
      data: allFiles
    }
  } catch (error) {
    console.error("Error fetching files:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to fetch files"
    }
  }
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete a file from R2 and database
 */
export async function deleteFileAction(
  id: string
): Promise<ActionState<FileRecord>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    // Get file record first
    const [file] = await db.select().from(files).where(eq(files.id, id))

    if (!file) {
      return { isSuccess: false, message: "File not found" }
    }

    // Delete from R2
    if (isStorageConfigured()) {
      const deleteResult = await deleteFile(file.storageKey)
      if (!deleteResult.success) {
        console.warn("Failed to delete file from R2:", deleteResult.error)
        // Continue to delete from database even if R2 deletion fails
      }
    }

    // Delete from database
    const [deletedFile] = await db
      .delete(files)
      .where(eq(files.id, id))
      .returning()

    revalidatePath("/dashboard/storage")

    return {
      isSuccess: true,
      message: "File deleted successfully",
      data: deletedFile
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    return {
      isSuccess: false,
      message: error instanceof Error ? error.message : "Failed to delete file"
    }
  }
}

// ============================================================================
// PRESIGNED URLS
// ============================================================================

interface PresignedUrlResponse {
  url: string
  expiresAt: Date
}

/**
 * Get a presigned URL for direct client-side upload
 * Useful for large files to avoid server memory usage
 */
export async function getPresignedUploadUrlAction(
  filename: string,
  contentType: string,
  folder: string = "uploads"
): Promise<ActionState<PresignedUrlResponse & { storageKey: string }>> {
  try {
    if (!isStorageConfigured()) {
      return { isSuccess: false, message: "Storage service not configured" }
    }

    const storageKey = generateUniqueKey(folder, filename)
    const result = await getPresignedUploadUrl(storageKey, contentType, 3600)

    if (!result.success || !result.url || !result.expiresAt) {
      return {
        isSuccess: false,
        message: result.error || "Failed to generate presigned URL"
      }
    }

    return {
      isSuccess: true,
      message: "Presigned URL generated",
      data: {
        url: result.url,
        expiresAt: result.expiresAt,
        storageKey
      }
    }
  } catch (error) {
    console.error("Error generating presigned upload URL:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate presigned URL"
    }
  }
}

/**
 * Get a presigned URL for downloading a private file
 */
export async function getPresignedDownloadUrlAction(
  storageKey: string
): Promise<ActionState<PresignedUrlResponse>> {
  try {
    if (!isStorageConfigured()) {
      return { isSuccess: false, message: "Storage service not configured" }
    }

    const result = await getPresignedDownloadUrl(storageKey, 3600)

    if (!result.success || !result.url || !result.expiresAt) {
      return {
        isSuccess: false,
        message: result.error || "Failed to generate presigned URL"
      }
    }

    return {
      isSuccess: true,
      message: "Presigned URL generated",
      data: {
        url: result.url,
        expiresAt: result.expiresAt
      }
    }
  } catch (error) {
    console.error("Error generating presigned download URL:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate presigned URL"
    }
  }
}

/**
 * Save file metadata after a presigned upload completes
 * Call this after successfully uploading via presigned URL
 */
export async function saveFileMetadataAction(
  data: Omit<NewFileRecord, "id" | "createdAt" | "updatedAt">
): Promise<ActionState<FileRecord>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not configured" }
    }

    const [newFile] = await db.insert(files).values(data).returning()

    revalidatePath("/dashboard/storage")

    return {
      isSuccess: true,
      message: "File metadata saved successfully",
      data: newFile
    }
  } catch (error) {
    console.error("Error saving file metadata:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to save file metadata"
    }
  }
}
