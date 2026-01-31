"use client"

import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import {
  Home,
  FileText,
  Settings,
  Menu,
  PenSquare,
  Database,
  Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/utility/theme-toggle"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Editor Demo", href: "/dashboard/editor", icon: PenSquare },
  { name: "Data Example", href: "/dashboard/data", icon: Database },
  { name: "Email Demo", href: "/dashboard/email", icon: Mail },
  { name: "Settings", href: "/dashboard/settings", icon: Settings }
]

interface DashboardHeaderProps {
  userName?: string | null
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Mobile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {navigation.map((item) => (
              <DropdownMenuItem key={item.name} asChild>
                <Link href={item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <FileText className="h-5 w-5" />
          <span className="hidden md:inline">Master Template</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {userName && (
            <span className="hidden text-sm text-muted-foreground md:inline">
              {userName}
            </span>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  )
}
