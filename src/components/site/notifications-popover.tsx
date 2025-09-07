/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
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
    | "post_comment"
    | "event_reminder"
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
  const lastFetchRef = useRef<number>(0)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Helper: is tab active
  const isActiveTab = () => typeof document !== "undefined" && !document.hidden

  // Fetch notifications (throttled to once per minute)
  const fetchNotifications = useCallback(async () => {
    if (!supabase) return
    const now = Date.now()
    if (now - lastFetchRef.current < 60_000) return
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching notifications:", error)
        return
      }

      const rows = (data || []) as NotificationRow[]
      setItems(rows)

      // Fetch actor profiles for non-broadcast notifications
      const ids = Array.from(
        new Set(rows.map((r) => r.actor_id).filter(Boolean)),
      ) as string[]

      if (ids.length) {
        const { data: profs, error: profError } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .in("id", ids)

        if (!profError && profs) {
          const map: Record<string, Actor> = {}
          for (const p of profs as unknown as Actor[]) map[p.id] = p
          setActors(map)
        }
      }

      lastFetchRef.current = now
    } catch (error) {
      console.error("Error in fetchNotifications:", error)
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    const setup = async () => {
      try {
        // Initial fetch (throttled)
        await fetchNotifications()

        // Subscribe only if tab is active
        const me = (await supabase.auth.getUser()).data.user
        if (!me) return
        if (isActiveTab()) {
          channelRef.current = supabase
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
                  const { data: p } = await supabase
                    .from("profiles")
                    .select("id,username,display_name,avatar_url")
                    .eq("id", row.actor_id)
                    .maybeSingle()
                  if (p)
                    setActors((m) => ({
                      ...m,
                      [(p as Actor).id]: p as Actor,
                    }))
                }
              },
            )
            .subscribe()
        }

        // Poll every minute only when tab active
        const interval = setInterval(() => {
          if (isActiveTab()) fetchNotifications()
        }, 60_000)

        // Pause/resume realtime on visibility changes
        const onVisibility = async () => {
          if (!me) return
          if (document.hidden) {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current)
              channelRef.current = null
            }
          } else if (!channelRef.current) {
            channelRef.current = supabase
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
                    const { data: p } = await supabase
                      .from("profiles")
                      .select("id,username,display_name,avatar_url")
                      .eq("id", row.actor_id)
                      .maybeSingle()
                    if (p)
                      setActors((m) => ({
                        ...m,
                        [(p as Actor).id]: p as Actor,
                      }))
                  }
                },
              )
              .subscribe()
          }
        }
        document.addEventListener("visibilitychange", onVisibility)

        return () => {
          clearInterval(interval)
          document.removeEventListener("visibilitychange", onVisibility)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setup()
    return () => {
      cancelled = true
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [supabase, actors, fetchNotifications])

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

    // Clear all notifications for the current user
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", me.id)

    if (!error) {
      setItems([])
      // Also clear any cached notification data
      lastFetchRef.current = 0
    }
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
        return `📢 ${title as string}`
      }
      case "post_comment":
        return `${name} skomentował(a) Twój post`
      case "event_reminder": {
        const when = (n.payload?.window as string) || "soon"
        if (when === "24h")
          return `⏰ Przypomnienie: wydarzenie już w ciągu 24h`
        if (when === "week")
          return `⏰ Przypomnienie: wydarzenie w tym tygodniu`
        return "⏰ Przypomnienie o wydarzeniu"
      }
      case "friend_request":
        return `👥 ${name} wysłał(a) prośbę o połączenie`
      case "friend_request_accepted":
        return `✅ ${name} zaakceptował(a) Twoją prośbę`
      case "mention":
        return `💬 ${name} wspomniał(a) o Tobie w poście`
      case "community_post":
        return `🏘️ ${name} dodał(a) post w społeczności`
      case "new_post_following":
        return `📝 ${name} dodał(a) nowy post`
      default:
        return "🔔 Powiadomienie"
    }
  }

  function linkFor(n: NotificationRow) {
    if (n.type === "broadcast" && n.action_url) return n.action_url
    if (n.type === "event_reminder" && n.action_url) return n.action_url
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
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                lastFetchRef.current = 0
                fetchNotifications()
              }}
              aria-label="Odśwież powiadomienia"
              title="Odśwież"
            >
              <Loader2 className="h-4 w-4" />
            </Button>
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
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("text-sm leading-5")}>
                    <Link
                      href={linkFor(n)}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "hover:underline",
                        n.type === "broadcast" ? "font-medium" : "",
                      )}
                    >
                      {renderText(n)}
                    </Link>
                    {n.type === "post_comment" && n.payload?.snippet && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {n.payload.snippet as string}
                      </div>
                    )}
                    {n.type === "event_reminder" && n.payload?.title && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {n.payload.title as string}
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
