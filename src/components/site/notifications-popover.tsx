/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Check, Loader2, X, Trash2 } from "lucide-react"
import { getSupabase } from "@/lib/supabase-browser"
import { cn } from "@/lib/utils"

type NotificationRow = {
  id: string
  user_id: string
  actor_id: string | null
  type:
    | "friend_request"
    | "friend_request_accepted"
    | "mention"
    | "community_post"
    | "new_post_following"
    | "broadcast"
  post_id: string | null
  friend_request_id: string | null
  community_id: string | null
  action_url: string | null
  payload: any
  read_at: string | null
  created_at: string
}

type Actor = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export function NotificationsPopover() {
  const supabase = getSupabase()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<NotificationRow[]>([])
  const [actors, setActors] = useState<Record<string, Actor>>({})

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null
    async function load() {
      try {
        const me = (await supabase!.auth.getUser()).data.user
        if (!me) return
        const { data } = await supabase!
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)
        const rows = (data || []) as NotificationRow[]
        if (cancelled) return
        setItems(rows)
        const ids = Array.from(
          new Set(rows.map((r) => r.actor_id).filter(Boolean)),
        ) as string[]
        if (ids.length) {
          const { data: profs } = await supabase!
            .from("profiles")
            .select("id,username,display_name,avatar_url")
            .in("id", ids)
          const map: Record<string, Actor> = {}
          for (const p of (profs || []) as unknown as Actor[]) map[p.id] = p
          if (!cancelled) setActors(map)
        }
        channel = supabase!
          .channel("notifications-popover")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${me.id}`,
            },
            async (payload) => {
              const row = payload.new as NotificationRow
              setItems((prev) => [row, ...prev].slice(0, 50))
              if (row.actor_id && !actors[row.actor_id]) {
                const { data: p } = await supabase!
                  .from("profiles")
                  .select("id,username,display_name,avatar_url")
                  .eq("id", row.actor_id)
                  .maybeSingle()
                if (p)
                  setActors((m) => ({ ...m, [(p as Actor).id]: p as Actor }))
              }
            },
          )
          .subscribe()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
      if (channel) supabase!.removeChannel(channel)
    }
  }, [supabase, actors])

  const unreadCount = useMemo(
    () => items.filter((i) => !i.read_at).length,
    [items],
  )

  async function markRead(id: string) {
    if (!supabase) return
    const { error } = await supabase.rpc("mark_notification_read", {
      p_id: id,
    })
    if (!error)
      setItems((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, read_at: new Date().toISOString() } : x,
        ),
      )
  }

  async function markAllRead() {
    if (!supabase) return
    await supabase.rpc("mark_all_notifications_read")
    const now = new Date().toISOString()
    setItems((prev) =>
      prev.map((x) => (x.read_at ? x : { ...x, read_at: now })),
    )
  }

  async function clearAll() {
    if (!supabase) return
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", me.id)
    if (!error) setItems([])
  }

  async function handleFriendRequest(
    n: NotificationRow,
    action: "accept" | "reject",
  ) {
    if (!supabase || !n.friend_request_id) return
    if (action === "accept") {
      await supabase
        .from("friend_requests")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", n.friend_request_id)
    } else {
      await supabase
        .from("friend_requests")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("id", n.friend_request_id)
    }
    await markRead(n.id)
  }

  function renderText(n: NotificationRow) {
    const a = (n.actor_id && actors[n.actor_id]) || null
    const name = a?.display_name || (a?.username ? `@${a.username}` : "Ktoś")
    switch (n.type) {
      case "broadcast": {
        const title = n.payload?.title || "Powiadomienie globalne"
        return title as string
      }
      case "friend_request":
        return `${name} wysłał(a) prośbę o połączenie`
      case "friend_request_accepted":
        return `${name} zaakceptował(a) Twoją prośbę`
      case "mention":
        return `${name} wspomniał(a) o Tobie w poście`
      case "community_post":
        return `${name} dodał(a) post w społeczności`
      case "new_post_following":
        return `${name} dodał(a) nowy post`
      default:
        return "Powiadomienie"
    }
  }

  function linkFor(n: NotificationRow) {
    if (n.type === "broadcast" && n.action_url) return n.action_url
    if (n.type === "broadcast" && n.action_url) return n.action_url
    if (n.action_url) return n.action_url
    if (n.post_id) return `/p/${encodeURIComponent(n.post_id)}`
    const a = (n.actor_id && actors[n.actor_id]) || null
    if (a?.username) return `/u/${encodeURIComponent(a.username)}`
    return "/d"
  }

  return (
    <Popover>
      <PopoverTrigger asChild suppressHydrationWarning>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Powiadomienia"
          className="relative"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[11px] leading-[18px] text-center px-1",
              )}
              aria-label={`${unreadCount} nieprzeczytanych powiadomień`}
            >
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 p-0"
        aria-label="Powiadomienia"
      >
        <div className="p-3 flex items-center justify-between gap-2">
          <div className="font-medium">Powiadomienia</div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={clearAll}
                aria-label="Wyczyść wszystkie powiadomienia"
                title="Wyczyść wszystkie"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {items.some((i) => !i.read_at) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllRead}
                aria-label="Oznacz wszystkie jako przeczytane"
              >
                Oznacz wszystkie
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-96">
          <ul className="divide-y">
            {items.length === 0 && (
              <li className="p-3 text-sm text-muted-foreground">
                Brak powiadomień
              </li>
            )}
            {items.slice(0, 30).map((n) => (
              <li
                key={n.id}
                className={cn(
                  "p-3 grid gap-2",
                  !n.read_at ? "bg-accent/40" : "",
                  n.type === "broadcast"
                    ? "relative overflow-hidden rounded-md"
                    : "",
                  n.type === "broadcast"
                    ? "relative overflow-hidden rounded-md"
                    : "",
                )}
              >
                {n.type === "broadcast" && (
                  <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1"
                    style={{
                      background:
                        "linear-gradient(180deg,#e40303,#ff8c00,#ffed00,#008018,#0078d7,#732982)",
                    }}
                  />
                )}
                {n.type === "broadcast" && (
                  <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1"
                    style={{
                      background:
                        "linear-gradient(180deg,#e40303,#ff8c00,#ffed00,#008018,#0078d7,#732982)",
                    }}
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("text-sm leading-5")}>
                    <Link
                      href={linkFor(n)}
                      className={cn(
                        "hover:underline",
                        n.type === "broadcast" ? "font-medium" : "",
                      )}
                    >
                      {renderText(n)}
                    </Link>
                    {n.type === "broadcast" && n.payload?.body && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {n.payload.body as string}
                      </div>
                    )}
                    {n.type === "broadcast" && n.payload?.body && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {n.payload.body as string}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!n.read_at && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Oznacz jako przeczytane"
                      onClick={() => markRead(n.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {n.type === "friend_request" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleFriendRequest(n, "accept")}
                    >
                      Akceptuj
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFriendRequest(n, "reject")}
                    >
                      <X className="h-4 w-4 mr-1" /> Odrzuć
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
