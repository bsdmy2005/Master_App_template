import { currentUser } from "@clerk/nextjs/server"
import { DashboardHeader } from "./_components/dashboard-header"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
