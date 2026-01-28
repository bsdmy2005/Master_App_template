"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Lightbulb,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Building2,
  User,
  Mail,
  Calendar,
  ExternalLink,
  Copy
} from "lucide-react"
import { toast } from "sonner"
import {
  getIdeasAction,
  updateIdeaAction,
  deleteIdeaAction
} from "@/actions/db/ideas-actions"
import type { SelectIdea } from "@/db/schema"
import type { PlanningData, Client } from "@/types/planning-types"
import { formatDistanceToNow } from "date-fns"

interface IdeasManagementProps {
  data: PlanningData
  setData: React.Dispatch<React.SetStateAction<PlanningData | null>>
}

type IdeaStatus = "submitted" | "under-review" | "needs-clarification" | "accepted" | "rejected" | "promoted-to-usecase"
type IdeaPriority = "not-set" | "low" | "medium" | "high" | "critical"

const STATUS_CONFIG: Record<IdeaStatus, { label: string; color: string; icon: React.ElementType }> = {
  submitted: { label: "Submitted", color: "bg-blue-500/10 text-blue-500", icon: Clock },
  "under-review": { label: "Under Review", color: "bg-amber-500/10 text-amber-500", icon: Eye },
  "needs-clarification": { label: "Needs Clarification", color: "bg-orange-500/10 text-orange-500", icon: AlertCircle },
  accepted: { label: "Accepted", color: "bg-green-500/10 text-green-500", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500", icon: XCircle },
  "promoted-to-usecase": { label: "Promoted", color: "bg-purple-500/10 text-purple-500", icon: ArrowRight }
}

const PRIORITY_CONFIG: Record<IdeaPriority, { label: string; color: string }> = {
  "not-set": { label: "Not Set", color: "bg-gray-500/10 text-gray-500" },
  low: { label: "Low", color: "bg-green-500/10 text-green-500" },
  medium: { label: "Medium", color: "bg-amber-500/10 text-amber-500" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-500" },
  critical: { label: "Critical", color: "bg-red-500/10 text-red-500" }
}

export function IdeasManagement({ data, setData }: IdeasManagementProps) {
  const [ideas, setIdeas] = useState<SelectIdea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "all">("all")
  const [selectedIdea, setSelectedIdea] = useState<SelectIdea | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Load ideas from database
  useEffect(() => {
    async function loadIdeas() {
      const result = await getIdeasAction()
      if (result.isSuccess) {
        setIdeas(result.data)
      } else {
        toast.error("Failed to load ideas")
      }
      setIsLoading(false)
    }
    loadIdeas()
  }, [])

  // Get client name by ID
  const getClientName = (clientId: string | null, proposedClientName: string | null): string => {
    if (proposedClientName) return `${proposedClientName} (Proposed)`
    if (!clientId) return "Unknown"
    const client = data.clients.find((c) => c.id === clientId)
    return client?.name || "Unknown"
  }

  // Filter ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesSearch =
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${idea.submittedByFirstName} ${idea.submittedBySurname}`.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || idea.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [ideas, searchQuery, statusFilter])

  // Group ideas by status
  const groupedIdeas = useMemo(() => {
    const groups: Record<string, SelectIdea[]> = {
      submitted: [],
      "under-review": [],
      "needs-clarification": [],
      accepted: [],
      rejected: [],
      "promoted-to-usecase": []
    }
    filteredIdeas.forEach((idea) => {
      groups[idea.status]?.push(idea)
    })
    return groups
  }, [filteredIdeas])

  // Stats
  const stats = useMemo(() => ({
    total: ideas.length,
    pending: ideas.filter((i) => i.status === "submitted" || i.status === "under-review").length,
    accepted: ideas.filter((i) => i.status === "accepted").length,
    promoted: ideas.filter((i) => i.status === "promoted-to-usecase").length
  }), [ideas])

  // Update idea status
  const handleStatusChange = async (ideaId: string, newStatus: IdeaStatus) => {
    setIsUpdating(true)
    const result = await updateIdeaAction(ideaId, {
      status: newStatus,
      reviewedAt: new Date(),
      reviewedBy: "Black Glass Team" // TODO: Replace with actual user
    })

    if (result.isSuccess) {
      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, status: newStatus } : i))
      )
      toast.success(`Idea status updated to ${STATUS_CONFIG[newStatus].label}`)
    } else {
      toast.error("Failed to update status")
    }
    setIsUpdating(false)
  }

  // Update idea priority
  const handlePriorityChange = async (ideaId: string, newPriority: IdeaPriority) => {
    setIsUpdating(true)
    const result = await updateIdeaAction(ideaId, { priority: newPriority })

    if (result.isSuccess) {
      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, priority: newPriority } : i))
      )
      toast.success(`Priority updated to ${PRIORITY_CONFIG[newPriority].label}`)
    } else {
      toast.error("Failed to update priority")
    }
    setIsUpdating(false)
  }

  // Update internal notes
  const handleNotesUpdate = async (ideaId: string, notes: string) => {
    const result = await updateIdeaAction(ideaId, { internalNotes: notes })

    if (result.isSuccess) {
      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, internalNotes: notes } : i))
      )
      if (selectedIdea?.id === ideaId) {
        setSelectedIdea((prev) => prev ? { ...prev, internalNotes: notes } : null)
      }
      toast.success("Notes saved")
    } else {
      toast.error("Failed to save notes")
    }
  }

  // Delete idea
  const handleDelete = async (ideaId: string) => {
    if (!confirm("Are you sure you want to delete this idea?")) return

    const result = await deleteIdeaAction(ideaId)
    if (result.isSuccess) {
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId))
      setIsDetailOpen(false)
      toast.success("Idea deleted")
    } else {
      toast.error("Failed to delete idea")
    }
  }

  // Copy portal link
  const copyPortalLink = () => {
    const link = `${window.location.origin}/ideas`
    navigator.clipboard.writeText(link)
    toast.success("Ideas Portal link copied to clipboard")
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ideas Backlog</h1>
          <p className="text-muted-foreground">
            Review and manage feature requests from external users
          </p>
        </div>
        <Button variant="outline" onClick={copyPortalLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Portal Link
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Ideas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{stats.accepted}</div>
            <p className="text-sm text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-500">{stats.promoted}</div>
            <p className="text-sm text-muted-foreground">Promoted to Use Case</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as IdeaStatus | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ideas List */}
      {filteredIdeas.length === 0 ? (
        <Card className="p-12 text-center">
          <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No ideas found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Share the Ideas Portal link to start collecting ideas"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIdeas.map((idea) => {
            const statusConfig = STATUS_CONFIG[idea.status as IdeaStatus]
            const priorityConfig = PRIORITY_CONFIG[idea.priority as IdeaPriority]
            const StatusIcon = statusConfig.icon

            return (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={`mt-1 rounded-full p-2 ${statusConfig.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">{idea.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {idea.description}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedIdea(idea)
                                  setIsDetailOpen(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(idea.id, "under-review")}
                                disabled={idea.status === "under-review"}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Mark Under Review
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(idea.id, "accepted")}
                                disabled={idea.status === "accepted"}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Accept
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(idea.id, "rejected")}
                                disabled={idea.status === "rejected"}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(idea.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Meta info */}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {getClientName(idea.clientId, idea.proposedClientName)}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {idea.submittedByFirstName} {idea.submittedBySurname}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Badges */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge className={statusConfig.color} variant="secondary">
                            {statusConfig.label}
                          </Badge>
                          <Badge className={priorityConfig.color} variant="secondary">
                            {priorityConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedIdea && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedIdea.title}</DialogTitle>
                <DialogDescription>
                  Submitted by {selectedIdea.submittedByFirstName} {selectedIdea.submittedBySurname} •{" "}
                  {formatDistanceToNow(new Date(selectedIdea.createdAt), { addSuffix: true })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status & Priority */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedIdea.status}
                      onValueChange={(v) => {
                        handleStatusChange(selectedIdea.id, v as IdeaStatus)
                        setSelectedIdea((prev) => prev ? { ...prev, status: v as IdeaStatus } : null)
                      }}
                      disabled={isUpdating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={selectedIdea.priority}
                      onValueChange={(v) => {
                        handlePriorityChange(selectedIdea.id, v as IdeaPriority)
                        setSelectedIdea((prev) => prev ? { ...prev, priority: v as IdeaPriority } : null)
                      }}
                      disabled={isUpdating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                    {selectedIdea.description}
                  </div>
                </div>

                {/* Submitter Info */}
                <div className="space-y-2">
                  <Label>Submitter Information</Label>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {selectedIdea.submittedByFirstName} {selectedIdea.submittedBySurname}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedIdea.submittedByEmail}`} className="text-primary hover:underline">
                        {selectedIdea.submittedByEmail}
                      </a>
                    </div>
                    {selectedIdea.submittedByOrganization && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {selectedIdea.submittedByOrganization}
                      </div>
                    )}
                  </div>
                </div>

                {/* Client */}
                <div className="space-y-2">
                  <Label>Client</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {getClientName(selectedIdea.clientId, selectedIdea.proposedClientName)}
                  </div>
                </div>

                {/* Internal Notes */}
                <div className="space-y-2">
                  <Label>Internal Notes (Black Glass Team Only)</Label>
                  <Textarea
                    defaultValue={selectedIdea.internalNotes || ""}
                    placeholder="Add internal notes about this idea..."
                    onBlur={(e) => {
                      if (e.target.value !== selectedIdea.internalNotes) {
                        handleNotesUpdate(selectedIdea.id, e.target.value)
                      }
                    }}
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedIdea.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
