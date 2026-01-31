"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import {
  FileIcon,
  ImageIcon,
  FileTextIcon,
  Trash2,
  Download,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import {
  deleteFileAction,
  getPresignedDownloadUrlAction
} from "@/actions/storage-actions"
import type { FileRecord } from "@/db/schema"

interface FileListProps {
  files: FileRecord[]
  onFileDeleted?: (fileId: string) => void
  className?: string
}

export function FileList({ files, onFileDeleted, className }: FileListProps) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-6 w-6" />
    }
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text")
    ) {
      return <FileTextIcon className="h-6 w-6" />
    }
    return <FileIcon className="h-6 w-6" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(date))
  }

  const handleDelete = (fileId: string) => {
    setDeletingId(fileId)
    startTransition(async () => {
      const result = await deleteFileAction(fileId)
      if (result.isSuccess) {
        onFileDeleted?.(fileId)
      }
      setDeletingId(null)
    })
  }

  const handleDownload = async (file: FileRecord) => {
    setDownloadingId(file.id)
    try {
      // Always use presigned URLs for access-controlled downloads
      const result = await getPresignedDownloadUrlAction(file.storageKey)
      if (result.isSuccess && result.data) {
        window.open(result.data.url, "_blank")
      }
    } finally {
      setDownloadingId(null)
    }
  }

  if (files.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            No files uploaded yet
          </p>
          <p className="text-sm text-muted-foreground">
            Upload your first file to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Uploaded Files</CardTitle>
        <CardDescription>
          {files.length} file{files.length !== 1 ? "s" : ""} uploaded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                (deletingId === file.id || downloadingId === file.id) &&
                  "opacity-50"
              )}
            >
              {/* File Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                {getFileIcon(file.mimeType)}
              </div>

              {/* File Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{file.filename}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{formatDate(file.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                {/* Download */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingId === file.id}
                  title="Download file (generates temporary access link)"
                >
                  {downloadingId === file.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>

                {/* Delete */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingId === file.id || isPending}
                    >
                      {deletingId === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete file?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;{file.filename}&quot;
                        from storage. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(file.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
