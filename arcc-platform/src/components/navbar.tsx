"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GraduationCap, Calendar, PenTool, LayoutDashboard, User, LogOut, BookOpen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"

const navItems = [
  {
    name: "Idea Forum",
    href: "/forum",
    icon: PenTool,
  },
  {
    name: "Event Hub",
    href: "/events",
    icon: Calendar,
  },
  {
    name: "Academic Wiki",
    href: "/wiki",
    icon: BookOpen,
  },
]

export function Navbar() {
  const pathname = usePathname()
  const { session, profile, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 flex h-16 items-center">
        <div className="mr-8 flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="hidden font-serif text-xl font-bold tracking-tight sm:inline-block text-primary" title="International School Academic Alliance">
              ISAA
            </span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center space-x-1">
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </div>
            </Link>
          ))}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/admin" ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center space-x-1">
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin</span>
              </div>
            </Link>
          )}
        </nav>
        <div className="flex items-center space-x-4">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border border-slate-200">
                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.display_name} />
                    <AvatarFallback className="bg-slate-100 text-primary font-serif">
                      {(profile?.display_name || session.user.email)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              } />
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal font-serif">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.display_name || session.user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex w-full items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === "admin" && (
                    <DropdownMenuItem>
                      <Link href="/admin" className="flex w-full items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Join Platform
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
