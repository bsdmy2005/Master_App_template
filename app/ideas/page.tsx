"use client"

import { IdeasPasswordProtection } from "./_components/ideas-password-protection"
import { IdeasPortal } from "./_components/ideas-portal"

export default function IdeasPage() {
  return (
    <IdeasPasswordProtection>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-500/5">
        <IdeasPortal />
      </div>
    </IdeasPasswordProtection>
  )
}
