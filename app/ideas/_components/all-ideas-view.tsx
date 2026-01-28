"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import {
  Card
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
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
  Search,
  Building2,
  User
} from "lucide-react"
import { getIdeasAction } from "@/actions/db/ideas-actions"
import { getClientsAction } from "@/actions/db/clients-actions"
import type { SelectIdea, SelectClient } from "@/db/schema"
import { format } from "date-fns"

interface AllIdeasViewProps {
  currentUserEmail: string
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

export function AllIdeasView({ currentUserEmail }: AllIdeasViewProps) {
  const [ideas, setIdeas] = useState<SelectIdea[]>([])
  const [clients, setClients] = useState<SelectClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIdea, setSelectedIdea] = useState<SelectIdea | null>(null)

  // Load all ideas
  useEffect(() => {
    async function loadData() {
      const [ideasResult, clientsResult] = await Promise.all([
        getIdeasAction(),
        getClientsAction()
      ])

      if (ideasResult.isSuccess) {
        setIdeas(ideasResult.data)
      }

      if (clientsResult.isSuccess) {
        setClients(clientsResult.data)
      }

      setIsLoading(false)
    }
    loadData()
  }, [])

  // Filter ideas by search
  const filteredIdeas = useMemo(() => {
    if (!searchQuery) return ideas
    const query = searchQuery.toLowerCase()
    return ideas.filter(
      (idea) =>
        idea.title.toLowerCase().includes(query) ||
        idea.description.toLowerCase().includes(query) ||
        `${idea.submittedByFirstName} ${idea.submittedBySurname}`.toLowerCase().includes(query)
    )
  }, [ideas, searchQuery])

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
        <h3 className="mt-4 text-lg font-medium">No ideas submitted yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Be the first to submit an idea!
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">All Ideas</h2>
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? "s" : ""}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[180px]">Title</TableHead>
              <TableHead className="min-w-[300px]">Description</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIdeas.map((idea) => {
              const statusConfig = STATUS_CONFIG[idea.status as IdeaStatus]
              const isOwn = idea.submittedByEmail === currentUserEmail

              return (
                <TableRow
                  key={idea.id}
                  className={`cursor-pointer ${isOwn ? "bg-amber-500/5" : ""}`}
                  onClick={() => setSelectedIdea(idea)}
                >
                  <TableCell className="font-medium">
                    {format(new Date(idea.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{idea.title}</span>
                      {isOwn && (
                        <Badge variant="outline" className="text-xs">
                          Yours
                        </Badge>
                      )}
                    </div>
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
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedIdea} onOpenChange={(open) => !open && setSelectedIdea(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedIdea && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle>{selectedIdea.title}</DialogTitle>
                  {selectedIdea.submittedByEmail === currentUserEmail && (
                    <Badge variant="outline">Your Idea</Badge>
                  )}
                </div>
                <DialogDescription>
                  Submitted on {format(new Date(selectedIdea.createdAt), "dd MMMM yyyy")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status & Client */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={STATUS_CONFIG[selectedIdea.status as IdeaStatus]?.color || ""}>
                    {STATUS_CONFIG[selectedIdea.status as IdeaStatus]?.label || selectedIdea.status}
                  </Badge>
                  <Badge variant="outline">
                    <Building2 className="mr-1 h-3 w-3" />
                    {getClientName(selectedIdea.clientId, selectedIdea.proposedClientName)}
                  </Badge>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <div
                    className="rounded-lg border bg-muted/30 p-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedIdea.description }}
                  />
                </div>

                {/* Submitter */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {selectedIdea.submittedByFirstName} {selectedIdea.submittedBySurname} ({selectedIdea.submittedByEmail})
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
