import { PasswordProtection } from "./_components/password-protection"

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <PasswordProtection>
      <div className="min-h-screen bg-background">{children}</div>
    </PasswordProtection>
  )
}

