"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Lightbulb,
  Edit,
  Trash2,
  Save
} from "lucide-react"
import { toast } from "sonner"
import { getIdeasAction, updateIdeaAction, deleteIdeaAction } from "@/actions/db/ideas-actions"
import { getClientsAction } from "@/actions/db/clients-actions"
import { RichTextEditor } from "./rich-text-editor"
import type { SelectIdea, SelectClient } from "@/db/schema"
import { format } from "date-fns"

interface MyIdeasViewProps {
  currentUser: {
    firstName: string
    surname: string
    email: string
  }
}

type IdeaStatus = "submitted" | "under-review" | "needs-clarification" | "accepted" | "rejected" | "promoted-to-usecase"

const STATUS_CONFIG: Record<IdeaStatus, { label: string; color: string }> = {
  submitted: { label: "Submitted", color: "bg-blue-500/10 text-blue-500" },
  "under-review": { label: "Under Review", color: "bg-amber-500/10 text-amber-500" },
  "needs-clarification": { label: "Needs Info", color: "bg-orange-500/10 text-orange-500" },
  accepted: { label: "Accepted", color: "bg-green-500/10 text-green-500" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500" },
  "promoted-to-usecase": { label: "In Progress", color: "bg-purple-500/10 text-purple-500" }
}

export function MyIdeasView({ currentUser }: MyIdeasViewProps) {
  const [ideas, setIdeas] = useState<SelectIdea[]>([])
  const [clients, setClients] = useState<SelectClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingIdea, setEditingIdea] = useState<SelectIdea | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    clientId: "",
    proposedClientName: ""
  })
  const [isSaving, setIsSaving] = useState(false)

  // Load user's ideas
  useEffect(() => {
    async function loadData() {
      const [ideasResult, clientsResult] = await Promise.all([
        getIdeasAction(),
        getClientsAction()
      ])

      if (ideasResult.isSuccess) {
        const myIdeas = ideasResult.data.filter(
          (idea) => idea.submittedByEmail === currentUser.email
        )
        setIdeas(myIdeas)
      }

      if (clientsResult.isSuccess) {
        setClients(clientsResult.data)
      }

      setIsLoading(false)
    }
    loadData()
  }, [currentUser.email])

  // Get client name
  const getClientName = (clientId: string | null, proposedClientName: string | null): string => {
    if (proposedClientName === "All Clients") return "All Clients"
    if (proposedClientName) return `${proposedClientName} (Proposed)`
    if (!clientId) return "Unknown"
    const client = clients.find((c) => c.id === clientId)
    return client?.name || "Unknown"
  }

  // Strip HTML for plain text display
  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  }

  // Open edit dialog
  const handleEdit = (idea: SelectIdea) => {
    setEditingIdea(idea)
    setEditForm({
      title: idea.title,
      description: idea.description,
      clientId: idea.clientId || "",
      proposedClientName: idea.proposedClientName || ""
    })
  }

  // Save edits
  const handleSave = async () => {
    if (!editingIdea) return

    setIsSaving(true)
    const result = await updateIdeaAction(editingIdea.id, {
      title: editForm.title,
      description: editForm.description,
      clientId: editForm.clientId || null,
      proposedClientName: editForm.proposedClientName || null
    })

    if (result.isSuccess) {
      setIdeas((prev) =>
        prev.map((i) =>
          i.id === editingIdea.id
            ? { ...i, title: editForm.title, description: editForm.description, clientId: editForm.clientId || null, proposedClientName: editForm.proposedClientName || null }
            : i
        )
      )
      setEditingIdea(null)
      toast.success("Idea updated successfully")
    } else {
      toast.error("Failed to update idea")
    }
    setIsSaving(false)
  }

  // Delete idea
  const handleDelete = async (ideaId: string) => {
    const result = await deleteIdeaAction(ideaId)
    if (result.isSuccess) {
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId))
      toast.success("Idea deleted")
    } else {
      toast.error("Failed to delete idea")
    }
  }

  // Handle client selection in edit form
  const handleClientChange = (value: string) => {
    if (value === "__all__") {
      setEditForm((prev) => ({ ...prev, clientId: "", proposedClientName: "All Clients" }))
    } else if (value === "__new__") {
      setEditForm((prev) => ({ ...prev, clientId: "", proposedClientName: "" }))
    } else {
      setEditForm((prev) => ({ ...prev, clientId: value, proposedClientName: "" }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h3 className="mt-4 text-lg font-medium">No ideas yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You haven&apos;t submitted any ideas yet. Go to &quot;Submit New&quot; to create one.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Ideas</h2>
        <p className="text-sm text-muted-foreground">
          {ideas.length} idea{ideas.length !== 1 ? "s" : ""} submitted
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[180px]">Title</TableHead>
              <TableHead className="min-w-[300px]">Description</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ideas.map((idea) => {
              const statusConfig = STATUS_CONFIG[idea.status as IdeaStatus]
              const canEdit = idea.status !== "promoted-to-usecase"

              return (
                <TableRow key={idea.id}>
                  <TableCell className="font-medium">
                    {format(new Date(idea.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {idea.title}
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {stripHtml(idea.description).substring(0, 200)}
                      {stripHtml(idea.description).length > 200 ? "..." : ""}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig?.color || ""} variant="secondary">
                      {statusConfig?.label || idea.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(idea)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Idea?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{idea.title}&quot;. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(idea.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingIdea} onOpenChange={(open) => !open && setEditingIdea(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Idea</DialogTitle>
            <DialogDescription>
              Update your idea with more details or corrections
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of your idea"
              />
            </div>

            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={
                  editForm.proposedClientName === "All Clients"
                    ? "__all__"
                    : editForm.clientId || "__new__"
                }
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Propose New Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!editForm.clientId && editForm.proposedClientName !== "All Clients" && (
              <div className="space-y-2">
                <Label htmlFor="edit-proposed-client">Proposed Client Name</Label>
                <Input
                  id="edit-proposed-client"
                  value={editForm.proposedClientName}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, proposedClientName: e.target.value }))
                  }
                  placeholder="Enter client name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                content={editForm.description}
                onChange={(content) => setEditForm((prev) => ({ ...prev, description: content }))}
                placeholder="Describe your idea in detail..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingIdea(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !editForm.title || !editForm.description}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
