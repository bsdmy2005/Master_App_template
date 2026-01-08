"use client"

import { Button } from "@/components/ui/button"
import { Grid3x3, Table as TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type DisplayFormat = "card" | "table"

interface ViewFormatToggleProps {
  displayFormat: DisplayFormat
  setDisplayFormat: (format: DisplayFormat) => void
}

export function ViewFormatToggle({
  displayFormat,
  setDisplayFormat
}: ViewFormatToggleProps) {
  return (
    <div className="flex gap-2 rounded-lg border bg-muted/30 p-1">
      <Button
        variant={displayFormat === "card" ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "flex-1 gap-2",
          displayFormat === "card" && "bg-background shadow-sm"
        )}
        onClick={() => setDisplayFormat("card")}
      >
        <Grid3x3 className="h-4 w-4" />
        <span className="hidden sm:inline">Card</span>
      </Button>
      <Button
        variant={displayFormat === "table" ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "flex-1 gap-2",
          displayFormat === "table" && "bg-background shadow-sm"
        )}
        onClick={() => setDisplayFormat("table")}
      >
        <TableIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Table</span>
      </Button>
    </div>
  )
}

