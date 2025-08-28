"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Home, Users, CalendarDays, User as UserIcon } from "lucide-react"

export function MobileBottomNav() {
  const supabase = getSupabase()
  const [authed, setAuthed] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const u = data.user
      setAuthed(!!u)
      if (!u) return
      // try load username from profiles
      const { data: prof } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", u.id)
        .maybeSingle()
      setUsername((prof?.username as string | null) || null)
    })()
  }, [supabase])

  if (!authed) return null

  const isActive = (href: string) => {
    if (!pathname) return false
    // Exact match for main tabs and prefix match for profile
    if (href === "/d" || href === "/c" || href === "/w") {
      return pathname === href
    }
    if (href.startsWith("/u/")) {
      return pathname === href || pathname.startsWith("/u/")
    }
    return false
  }

  const activeClass = "text-primary font-medium bg-muted"
  const baseClass =
    "flex flex-col items-center gap-1 px-2 py-1 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <nav
      aria-label="Nawigacja dolna"
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
    >
      <ul className="mx-auto max-w-6xl px-4 py-2 grid grid-cols-4 gap-2 text-xs">
        <li className="flex justify-center">
          <Link
            href="/d"
            aria-current={isActive("/d") ? "page" : undefined}
            className={`${baseClass} ${isActive("/d") ? activeClass : ""}`}
          >
            <Home className="size-5" aria-hidden />
            Pulpit
          </Link>
        </li>
        <li className="flex justify-center">
          <Link
            href="/c"
            aria-current={isActive("/c") ? "page" : undefined}
            className={`${baseClass} ${isActive("/c") ? activeClass : ""}`}
          >
            <Users className="size-5" aria-hidden />
            Społ.
          </Link>
        </li>
        <li className="flex justify-center">
          <Link
            href="/w"
            aria-current={isActive("/w") ? "page" : undefined}
            className={`${baseClass} ${isActive("/w") ? activeClass : ""}`}
          >
            <CalendarDays className="size-5" aria-hidden />
            Wyd.
          </Link>
        </li>
        <li className="flex justify-center">
          <Link
            href={username ? `/u/${encodeURIComponent(username)}` : "/d"}
            aria-current={
              username && isActive(`/u/${encodeURIComponent(username)}`)
                ? "page"
                : undefined
            }
            className={`${baseClass} ${
              username && isActive(`/u/${encodeURIComponent(username)}`)
                ? activeClass
                : ""
            }`}
          >
            <UserIcon className="size-5" aria-hidden />
            Profil
          </Link>
        </li>
      </ul>
    </nav>
  )
}
