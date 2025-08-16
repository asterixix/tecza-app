"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Menu, LogOut, User, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Logo } from "./logo"
import { MessagesPopover } from "@/components/messages/messages-popover"
import { ThemeToggle } from "./theme-toggle"
import { GlobalSearch } from "./global-search"
import { Button as UIButton } from "@/components/ui/button"
import { Search } from "lucide-react"

const nav = [
  { href: "/d", label: "Pulpit" },
  { href: "/c", label: "Społeczności" },
  { href: "/w", label: "Wydarzenia" },
  // Messages moved to header popover button
]

export function UserHeader() {
  const supabase = getSupabase()
  const [email, setEmail] = useState<string>("")
  const [avatar, setAvatar] = useState<string>("")
  const [username, setUsername] = useState<string>("")
  // Simple pagination for long navs on small screens
  const pageSize = 5
  const pages = useMemo(() => {
    const chunks: typeof nav[] = []
    for (let i = 0; i < nav.length; i += pageSize) {
      chunks.push(nav.slice(i, i + pageSize))
    }
    return chunks
  }, [])
  const [page, setPage] = useState(0)
  const hasMultiplePages = pages.length > 1
  const current = pages[page] ?? nav

  useEffect(() => {
    if (!supabase) return
    let isCancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const u = data.user
      if (!u) return

      setEmail(u.email ?? "")
      // Start with metadata as optimistic fallback
      const meta = (u.user_metadata as Record<string, unknown> | null) || {}
      const metaAvatar = meta.avatar_url as string | undefined
      const metaUsername = (meta.username as string | undefined)?.toString()
      const metaDisplay = (meta.display_name as string | undefined)?.toString()
  if (metaAvatar) setAvatar(metaAvatar)
  if (metaUsername) setUsername((v) => v || metaUsername)

      // Try finding profile by auth id first
      let prof = (await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,roles")
        .eq("id", u.id)
        .maybeSingle()).data as (null | { id: string; username: string | null; display_name: string | null; avatar_url: string | null })

      // Fallback: try by username from metadata
      if (!prof && metaUsername) {
        const { data: byName } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url,roles")
          .ilike("username", metaUsername)
          .maybeSingle()
        prof = byName as typeof prof
      }

      if (isCancelled) return

  if (prof) {
        if (prof.avatar_url) setAvatar(prof.avatar_url)
        if (prof.username) setUsername(prof.username)

        // Self-heal profile fields if missing or mismatched
        const next: Record<string, string> = {}
        if (!prof.username && metaUsername) next.username = metaUsername.toLowerCase()
        if ((!prof.display_name || prof.display_name === prof.username) && metaDisplay) next.display_name = metaDisplay
        if (Object.keys(next).length > 0) {
          await supabase.from("profiles").update({ ...next, updated_at: new Date().toISOString() }).eq("id", prof.id)
        }

        // Subscribe to updates for this exact row id
        channel = supabase
          .channel("user-header-profile")
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${prof.id}` }, (payload) => {
            const row = payload.new as { avatar_url?: string | null; username?: string | null }
            if (row.avatar_url !== undefined && row.avatar_url !== null) setAvatar(row.avatar_url)
            if (row.username) setUsername(row.username)
          })
          .subscribe()
      } else {
        // No profile row found; keep metadata fallbacks
        setUsername((v) => v || metaUsername || "")
      }
    }

    load()
    return () => {
      isCancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase])

  const initial = useMemo(() => email?.trim().charAt(0).toUpperCase() || "U", [email])

  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    (async () => {
  if (!supabase) return
  const { data } = await supabase.auth.getUser(); const u = data.user
      if (!u) return
  const { data: prof } = await supabase.from('profiles').select('roles').eq('id', u.id).maybeSingle()
      const roles = (prof?.roles as string[] | undefined) || []
      setIsAdmin(roles.some(r => ['moderator','administrator','super-administrator'].includes(r)))
    })()
  }, [supabase])

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
          {/* Search trigger (Cmd/Ctrl+K also opens) */}
          <GlobalSearch />
          <UIButton
            type="button"
            variant="outline"
            className="hidden md:inline-flex items-center gap-2"
            aria-label="Otwórz wyszukiwarkę (Ctrl+K / Cmd+K)"
            onClick={() => {
              // Dispatch cmd+k programmatically to open dialog from GlobalSearch
              const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
              window.dispatchEvent(ev)
            }}
          >
            <Search className="size-4" aria-hidden />
            <span className="text-sm">Szukaj</span>
            <kbd className="ml-2 hidden lg:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium">Ctrl+K</kbd>
          </UIButton>
          <UIButton
            type="button"
            size="icon"
            variant="outline"
            className="md:hidden"
            aria-label="Szukaj"
            onClick={() => {
              const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
              window.dispatchEvent(ev)
            }}
          >
            <Search className="size-5" aria-hidden />
          </UIButton>
          <ThemeToggle />
          <MessagesPopover />
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
              {/* Avatar preview */}
              <div className="px-3 pt-3 pb-2 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {avatar ? <AvatarImage src={avatar} alt="Avatar" /> : null}
                  <AvatarFallback className="text-base">{initial}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium truncate">{username ? `@${username}` : (email || "Twoje konto")}</div>
                  {email ? <div className="text-xs text-muted-foreground truncate">{email}</div> : null}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                {<Link href={username ? `/u/${encodeURIComponent(username)}` : "/d"} className="flex items-center gap-2">
                    <User className="size-4" /> Profil
                  </Link>}
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center gap-2"><Settings className="size-4" /> Panel</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/s" className="flex items-center gap-2"><Settings className="size-4" /> Ustawienia</Link>
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
              <SheetContent side="left" className="w-[88vw] sm:w-80">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="py-4 px-4">
                  <Logo />
                </div>
                <ScrollArea className="max-h-[65dvh]">
                  <nav className="grid gap-1 px-4 pb-2" aria-label="Menu mobilne">
                    {current.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-md px-2 py-2 text-base font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </ScrollArea>
                {hasMultiplePages && (
                  <div className="flex items-center justify-between gap-3 px-4 py-2">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Poprzednia strona menu"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="size-5" />
                    </Button>
                    <div className="flex items-center gap-1" aria-label={`Strona ${page + 1} z ${pages.length}`}>
                      {pages.map((_, i) => (
                        <span
                          key={i}
                          className={
                            "h-2 w-2 rounded-full border " + (i === page ? "bg-foreground" : "bg-muted")
                          }
                          aria-current={i === page ? "page" : undefined}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Następna strona menu"
                      onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
                      disabled={page === pages.length - 1}
                    >
                      <ChevronRight className="size-5" />
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
