"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { Upload, X, FileIcon, ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { uploadFileAction } from "@/actions/storage-actions"
import type { FileRecord } from "@/db/schema"

interface FileUploaderProps {
  uploaderId: string
  folder?: string
  accept?: string
  maxSizeMB?: number
  onUploadComplete?: (file: FileRecord) => void
  onError?: (error: string) => void
  className?: string
}

export function FileUploader({
  uploaderId,
  folder = "uploads",
  accept = "image/*,application/pdf,.doc,.docx,.txt",
  maxSizeMB = 10,
  onUploadComplete,
  onError,
  className
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const handleFile = useCallback(
    (file: File) => {
      // Validate file size
      if (file.size > maxSizeBytes) {
        onError?.(`File size exceeds ${maxSizeMB}MB limit`)
        return
      }

      setSelectedFile(file)

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
    },
    [maxSizeBytes, maxSizeMB, onError]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const clearSelection = useCallback(() => {
    setSelectedFile(null)
    setPreview(null)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("uploaderId", uploaderId)
      formData.append("folder", folder)

      const result = await uploadFileAction(formData)

      if (result.isSuccess && result.data) {
        onUploadComplete?.(result.data)
        clearSelection()
      } else {
        onError?.(result.message)
      }
    } catch {
      onError?.("Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          selectedFile && "border-solid border-primary/50 bg-primary/5"
        )}
      >
        {selectedFile ? (
          // File Preview
          <div className="flex w-full flex-col items-center gap-4">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-32 w-32 rounded-lg object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6"
                  onClick={clearSelection}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-muted">
                  <FileIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-6 w-6"
                  onClick={clearSelection}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="text-center">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>

            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        ) : (
          // Empty State
          <>
            <div className="mb-4 rounded-full bg-muted p-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mb-2 text-lg font-medium">
              Drag and drop your file here
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              or click to browse (max {maxSizeMB}MB)
            </p>
            <label>
              <input
                type="file"
                className="sr-only"
                accept={accept}
                onChange={handleFileSelect}
              />
              <Button variant="outline" asChild>
                <span>Browse Files</span>
              </Button>
            </label>
          </>
        )}
      </div>
    </div>
  )
}
