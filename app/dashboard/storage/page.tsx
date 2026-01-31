"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/storage/file-uploader"
import { FileList } from "@/components/storage/file-list"
import {
  getUserFilesAction,
  getAllFilesAction
} from "@/actions/storage-actions"
import {
  getUserProfileByClerkIdAction,
  upsertUserProfileAction
} from "@/actions/users-actions"
import type { FileRecord } from "@/db/schema"
import { toast } from "sonner"

export default function StorageDemoPage() {
  const { user, isLoaded } = useUser()
  const [userProfileId, setUserProfileId] = useState<string | null>(null)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isLoadingFiles, setIsLoadingFiles] = useState(true)

  // Get or create user profile
  useEffect(() => {
    async function loadUserProfile() {
      if (!isLoaded || !user) return

      setIsLoadingProfile(true)

      // Try to get existing profile
      const result = await getUserProfileByClerkIdAction(user.id)

      if (result.isSuccess && result.data) {
        setUserProfileId(result.data.id)
      } else {
        // Create profile if it doesn't exist
        const createResult = await upsertUserProfileAction(user.id, {
          displayName: user.fullName || user.username || "User"
        })

        if (createResult.isSuccess && createResult.data) {
          setUserProfileId(createResult.data.id)
        }
      }

      setIsLoadingProfile(false)
    }

    loadUserProfile()
  }, [user, isLoaded])

  // Load files when profile is ready
  useEffect(() => {
    async function loadFiles() {
      if (!userProfileId) return

      setIsLoadingFiles(true)
      const result = await getUserFilesAction(userProfileId)

      if (result.isSuccess && result.data) {
        setFiles(result.data)
      }

      setIsLoadingFiles(false)
    }

    loadFiles()
  }, [userProfileId])

  const handleUploadComplete = (file: FileRecord) => {
    setFiles((prev) => [file, ...prev])
    toast.success("File uploaded successfully!")
  }

  const handleFileDeleted = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
    toast.success("File deleted successfully!")
  }

  const handleError = (error: string) => {
    toast.error(error)
  }

  if (!isLoaded || isLoadingProfile) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">File Storage</h1>
        <p className="mt-2 text-muted-foreground">
          Upload and manage private files with Cloudflare R2 (access-controlled via presigned URLs)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Drag and drop or click to upload files to R2 storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userProfileId ? (
              <FileUploader
                uploaderId={userProfileId}
                folder="uploads"
                maxSizeMB={10}
                onUploadComplete={handleUploadComplete}
                onError={handleError}
              />
            ) : (
              <p className="text-center text-muted-foreground">
                User profile not available. Please try refreshing the page.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Guide</CardTitle>
            <CardDescription>
              Configure Cloudflare R2 for your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-3 text-sm text-muted-foreground">
              <li>
                Create a Cloudflare account at{" "}
                <a
                  href="https://dash.cloudflare.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  dash.cloudflare.com
                </a>
              </li>
              <li>Go to R2 and create a new bucket</li>
              <li>Create an R2 API token with read/write permissions</li>
              <li>
                Add to your{" "}
                <code className="rounded bg-muted px-1">.env.local</code>:
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  R2_ACCESS_KEY_ID=your-access-key{"\n"}
                  R2_SECRET_ACCESS_KEY=your-secret{"\n"}
                  R2_ENDPOINT=https://account.r2.cloudflarestorage.com{"\n"}
                  R2_BUCKET_NAME=your-bucket
                </pre>
              </li>
              <li>Files are private by default - accessed via time-limited presigned URLs</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* File List */}
      <div className="mt-6">
        {isLoadingFiles ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">Loading files...</p>
            </CardContent>
          </Card>
        ) : (
          <FileList files={files} onFileDeleted={handleFileDeleted} />
        )}
      </div>

      {/* Code Examples */}
      <Tabs defaultValue="upload" className="mt-6">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="presigned">Presigned URLs</TabsTrigger>
          <TabsTrigger value="actions">Server Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Direct Upload</CardTitle>
              <CardDescription>
                Upload files from server-side code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                <code>{`import { uploadFile, generateUniqueKey } from "@/lib/storage"

// Upload a file buffer
const key = generateUniqueKey("uploads", "document.pdf")
const result = await uploadFile({
  body: fileBuffer,
  key: key,
  contentType: "application/pdf",
  metadata: { uploadedBy: "user123" }
})

if (result.success) {
  console.log("File uploaded:", result.url)
} else {
  console.error("Upload failed:", result.error)
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presigned">
          <Card>
            <CardHeader>
              <CardTitle>Presigned URLs</CardTitle>
              <CardDescription>
                Generate temporary URLs for client-side uploads or downloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                <code>{`import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl
} from "@/lib/storage"

// Get URL for client-side upload (1 hour expiry)
const uploadResult = await getPresignedUploadUrl(
  "uploads/large-file.zip",
  "application/zip",
  3600 // expires in seconds
)

if (uploadResult.success) {
  // Client can PUT directly to this URL
  await fetch(uploadResult.url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": "application/zip" }
  })
}

// Get URL for private file download
const downloadResult = await getPresignedDownloadUrl(
  "private/document.pdf",
  3600
)

if (downloadResult.success) {
  window.open(downloadResult.url, "_blank")
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Server Actions</CardTitle>
              <CardDescription>
                Upload files using FormData with server actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                <code>{`// actions/storage-actions.ts
"use server"

import { uploadFile, generateUniqueKey } from "@/lib/storage"
import { db } from "@/db/db"
import { files } from "@/db/schema"
import type { ActionState } from "@/types/actions-types"

export async function uploadFileAction(
  formData: FormData
): Promise<ActionState<FileRecord>> {
  const file = formData.get("file") as File
  const uploaderId = formData.get("uploaderId") as string
  const folder = formData.get("folder") as string || "uploads"

  // Convert File to Buffer
  const buffer = Buffer.from(await file.arrayBuffer())
  const key = generateUniqueKey(folder, file.name)

  // Upload to R2
  const result = await uploadFile({
    body: buffer,
    key: key,
    contentType: file.type
  })

  if (!result.success) {
    return { isSuccess: false, message: result.error! }
  }

  // Save metadata to database
  const [newFile] = await db.insert(files).values({
    uploaderId,
    storageKey: key,
    publicUrl: result.url,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    folder
  }).returning()

  return {
    isSuccess: true,
    message: "File uploaded",
    data: newFile
  }
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
