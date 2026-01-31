import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ensureUserProfileExistsAction } from "@/actions/users-actions"
import { DashboardHeader } from "./_components/dashboard-header"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect("/sign-in")
  }

  // Ensure user has a profile in our database
  // This creates a profile on first login, or retrieves existing one
  await ensureUserProfileExistsAction(user.id, {
    displayName: user.firstName || user.username || undefined,
    avatarUrl: user.imageUrl || undefined
  })

  const userName = user.firstName || user.emailAddresses[0]?.emailAddress

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
