"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import { useAuth } from "@/hooks/use-auth"

type ConversationListItem = {
  id: string
  type: "direct" | "group"
  last_message_at: string
  participants: string[]
  profiles?: Array<{
    id: string
    username: string
    display_name: string
    avatar_url?: string
  }>
}

export default function MessagesPage() {
  const supabase = getSupabase()
  const { user } = useAuth()
  const [items, setItems] = useState<ConversationListItem[]>([])
  const [filter, setFilter] = useState("")

  useEffect(() => {
    ;(async () => {
      if (!supabase || !user) return
      // Fetch conversations without an invalid join
      const { data, error } = await supabase
        .from("conversations")
        .select("id,type,last_message_at,participants")
        .contains("participants", [user.id])
        .order("last_message_at", { ascending: false })
      if (error) return
      const rows = (data as unknown as ConversationListItem[]) || []
      // For direct chats, prefetch other participant profiles
      const otherIds = Array.from(
        new Set(
          rows
            .filter((r) => r.type === "direct")
            .map((r) => r.participants.find((p) => p !== user.id))
            .filter(Boolean) as string[],
        ),
      )
      type ProfileLite = {
        id: string
        username: string
        display_name: string
        avatar_url?: string
      }
      const profMap: Record<string, ProfileLite> = {}
      if (otherIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .in("id", otherIds)
        ;(profs as ProfileLite[] | null)?.forEach((p) => {
          profMap[p.id] = p
        })
      }
      const withProfiles = rows.map((r) => {
        if (r.type === "direct") {
          const other = r.participants.find((p) => p !== user.id)
          return {
            ...r,
            profiles: other ? [profMap[other]].filter(Boolean) : [],
          }
        }
        return r
      })
      setItems(withProfiles)
    })()
  }, [supabase, user])

  const filtered = useMemo(() => {
    if (!filter.trim()) return items
    const q = filter.toLowerCase()
    return items.filter((c) =>
      (c.profiles || []).some(
        (p) =>
          p.username.toLowerCase().includes(q) ||
          (p.display_name || "").toLowerCase().includes(q),
      ),
    )
  }, [items, filter])

  return (
    <section className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Wiadomości</h1>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj użytkownika"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8"
              aria-label="Szukaj rozmów"
            />
          </div>
          <Button size="sm" className="shrink-0" asChild>
            <Link href="/m/new">
              <Plus className="mr-1 h-4 w-4" /> Nowa
            </Link>
          </Button>
        </div>
      </div>

      <ul className="divide-y rounded-md border" role="list">
        {filtered.map((c) => {
          // For direct chats, pick the other profile for title
          const other = (c.profiles || []).find((p) => p.id !== user?.id)
          return (
            <li key={c.id}>
              <Link
                href={`/m/${c.id}`}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={other?.avatar_url} />
                  <AvatarFallback>
                    {other?.display_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium">
                      {other?.display_name || other?.username || "Grupa"}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.last_message_at), {
                        addSuffix: true,
                        locale: pl,
                      })}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {c.type === "group"
                      ? "Czat grupowy"
                      : `@${other?.username}`}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
        {!filtered.length && (
          <li className="p-6 text-sm text-muted-foreground">Brak rozmów.</li>
        )}
      </ul>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Wiadomości</h1>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj użytkownika"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8"
              aria-label="Szukaj rozmów"
            />
          </div>
          <Button size="sm" className="shrink-0" asChild>
            <Link href="/m/new">
              <Plus className="mr-1 h-4 w-4" /> Nowa
            </Link>
          </Button>
        </div>
      </div>

      <ul className="divide-y rounded-md border" role="list">
        {filtered.map((c) => {
          // For direct chats, pick the other profile for title
          const other = (c.profiles || []).find((p) => p.id !== user?.id)
          return (
            <li key={c.id}>
              <Link
                href={`/m/${c.id}`}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={other?.avatar_url} />
                  <AvatarFallback>
                    {other?.display_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium">
                      {other?.display_name || other?.username || "Grupa"}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.last_message_at), {
                        addSuffix: true,
                        locale: pl,
                      })}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {c.type === "group"
                      ? "Czat grupowy"
                      : `@${other?.username}`}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
        {!filtered.length && (
          <li className="p-6 text-sm text-muted-foreground">Brak rozmów.</li>
        )}
      </ul>
    </section>
  )
}
