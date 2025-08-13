"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Menu, LogOut, User, Settings } from "lucide-react"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "./logo"
import { ThemeToggle } from "./theme-toggle"

const nav = [
  { href: "/dashboard", label: "Pulpit" },
  { href: "/communities", label: "Społeczności" },
  { href: "/events", label: "Wydarzenia" },
  { href: "/messages", label: "Wiadomości" },
]

export function UserHeader() {
  const supabase = getSupabase()
  const [email, setEmail] = useState<string>("")
  const [avatar, setAvatar] = useState<string>("")
  const [username, setUsername] = useState<string>("")

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user
      if (u) {
        setEmail(u.email ?? "")
        const img = (u.user_metadata as Record<string, unknown> | null)?.avatar_url as string | undefined
        setAvatar(img || "")
        const { data: prof } = await supabase.from("profiles").select("username").eq("id", u.id).maybeSingle()
        if (prof?.username) setUsername(prof.username)
      }
    })
  }, [supabase])

  const initial = useMemo(() => email?.trim().charAt(0).toUpperCase() || "U", [email])

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto max-w-6xl px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <nav className="hidden md:flex items-center gap-6" aria-label="Nawigacja użytkownika">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0" aria-label="Menu użytkownika">
                <Avatar className="h-9 w-9">
                  {avatar ? <AvatarImage src={avatar} alt="Avatar" /> : null}
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{email || "Twoje konto"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={username ? `/u/${username}` : "/settings"} className="flex items-center gap-2"><User className="size-4" /> Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2"><Settings className="size-4" /> Ustawienia</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-700">
                <LogOut className="size-4" /> Wyloguj się
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Otwórz menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="py-4">
                  <Logo />
                </div>
                <nav className="grid gap-4" aria-label="Menu mobilne">
                  {nav.map((item) => (
                    <Link key={item.href} href={item.href} className="text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-1.5">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
