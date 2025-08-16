"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Users, Hash, Calendar, Layers } from "lucide-react"

type UserRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}
type CommunityRow = { id: string; name: string; slug: string | null; avatar_url: string | null }
type EventRow = {
  id: string
  title: string
  slug: string | null
  city: string | null
  start_date: string | null
}

export function GlobalSearch() {
  const router = useRouter()
  const supabase = getSupabase()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserRow[]>([])
  const [communities, setCommunities] = useState<CommunityRow[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Open with Cmd/Ctrl+K and '/'
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === "/" && !open) {
        // Quick focus search
        e.preventDefault()
        setOpen(true)
      } else if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!open) return
    if (!supabase) return
    const query = q.trim()
    if (query.length === 0) {
      setUsers([])
      setCommunities([])
      setEvents([])
      setTags([])
      setActiveIndex(-1)
      return
    }
    setLoading(true)
    const h = setTimeout(async () => {
      try {
        const like = `%${query}%`
        // Users
        const { data: u } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .or(`username.ilike.${like},display_name.ilike.${like}`)
          .order("username", { ascending: true })
          .limit(8)
        setUsers((u as unknown as UserRow[]) || [])

        // Communities
        const { data: c } = await supabase
          .from("communities")
          .select("id, name, slug, avatar_url")
          .or(`name.ilike.${like}`)
          .order("name", { ascending: true })
          .limit(6)
        setCommunities((c as unknown as CommunityRow[]) || [])

        // Events
        const { data: ev } = await supabase
          .from("events")
          .select("id, title, slug, city, start_date")
          .or(`title.ilike.${like},city.ilike.${like}`)
          .order("start_date", { ascending: true })
          .limit(6)
        setEvents((ev as unknown as EventRow[]) || [])

        // Tags: if query starts with '#', offer direct suggestion; otherwise leave as suggestion only
        if (query.startsWith("#")) {
          const tag = query.slice(1).toLowerCase()
          setTags(tag ? [tag] : [])
        } else {
          setTags([])
        }
        setActiveIndex(-1)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(h)
  }, [q, open, supabase])

  const total = users.length + communities.length + events.length + (tags.length > 0 ? 1 : 0)

  const items = useMemo(() => {
    const out: Array<{
      key: string
      href: string
      icon: React.ReactNode
      title: string
      subtitle?: string
    }> = []
    users.forEach((u) => {
      out.push({
        key: `u:${u.id}`,
        href: u.username ? `/u/${encodeURIComponent(u.username)}` : "/d",
        icon: <Users className="size-4" aria-hidden />,
        title: u.display_name || u.username || "Użytkownik",
        subtitle: u.username ? `@${u.username}` : undefined,
      })
    })
    communities.forEach((c) => {
      out.push({
        key: `c:${c.id}`,
        href: c.slug ? `/c/${encodeURIComponent(c.slug)}` : `/c/${c.id}`,
        icon: <Layers className="size-4" aria-hidden />,
        title: c.name,
        subtitle: "Społeczność",
      })
    })
    events.forEach((e) => {
      out.push({
        key: `e:${e.id}`,
        href: e.slug ? `/w/${encodeURIComponent(e.slug)}` : `/w/${e.id}`,
        icon: <Calendar className="size-4" aria-hidden />,
        title: e.title,
        subtitle: e.city || undefined,
      })
    })
    if (tags.length > 0) {
      const tag = tags[0]
      out.push({
        key: `t:${tag}`,
        href: `/d?tag=${encodeURIComponent(tag)}`,
        icon: <Hash className="size-4" aria-hidden />,
        title: `Szukaj tagu #${tag}`,
        subtitle: "Tag",
      })
    }
    return out
  }, [users, communities, events, tags])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!items.length) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => Math.min(items.length - 1, i + 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => Math.max(0, i - 1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const sel = items[activeIndex] || items[0]
        if (sel) {
          setOpen(false)
          router.push(sel.href)
        }
      }
    },
    [items, activeIndex, router]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 sm:max-w-2xl">
        <DialogHeader className="px-3 pt-3">
          <DialogTitle className="sr-only">Szukaj</DialogTitle>
        </DialogHeader>
        <div className="px-3 pb-3">
          <div className="relative">
            <Search
              className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden
            />
            <Input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Szukaj użytkowników, społeczności, wydarzeń i tagów…"
              aria-label="Szukaj"
              className="pl-8"
              role="combobox"
              aria-expanded
              aria-controls="global-search-list"
              autoFocus
            />
          </div>
        </div>
        <div className="border-t">
          <ScrollArea className="max-h-[60vh]">
            <ul
              id="global-search-list"
              role="listbox"
              aria-label="Wyniki wyszukiwania"
              className="p-2"
            >
              {loading && (
                <li className="px-2 py-2 text-sm text-muted-foreground">Wyszukiwanie…</li>
              )}
              {!loading && total === 0 && q.trim().length > 0 && (
                <li className="px-2 py-2 text-sm text-muted-foreground">Brak wyników dla „{q}”.</li>
              )}
              {items.map((it, idx) => (
                <li
                  key={it.key}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={
                    "rounded-md px-2 py-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                    (idx === activeIndex ? "bg-muted" : "hover:bg-muted")
                  }
                >
                  <Link
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3"
                  >
                    <span className="flex-none">{it.icon}</span>
                    <span className="min-w-0">
                      <span className="block truncate">{it.title}</span>
                      {it.subtitle ? (
                        <span className="block text-xs text-muted-foreground truncate">
                          {it.subtitle}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          Wskazówka: naciśnij Ctrl+K / Cmd+K aby otworzyć. Strzałki aby nawigować, Enter aby
          przejść.
        </div>
      </DialogContent>
    </Dialog>
  )
}
