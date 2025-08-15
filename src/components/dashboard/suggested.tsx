"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabase } from "@/lib/supabase-browser"

export function SuggestedProfiles() {
  const supabase = getSupabase()
  type FollowEdge = { follower_id: string; following_id: string }
  type MiniProfile = { id: string; username: string | null; display_name: string | null; avatar_url: string | null }
  const [items, setItems] = useState<MiniProfile[]>([])

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const me = (await supabase.auth.getUser()).data.user
      if (!me) return
      // Fetch people the people I follow also follow (2-hop), excluding me and already-followed
      // 1) who I follow
      const { data: iFollow } = await supabase.from("follows").select("following_id").eq("follower_id", me.id).limit(200)
      const followingIds = new Set((iFollow || []).map((r: { following_id: string }) => r.following_id))
      if (followingIds.size === 0) { setItems([]); return }
      // 2) their followings
      const { data: suggestions } = await supabase
        .from("follows")
        .select("following_id,follower_id")
        .in("follower_id", Array.from(followingIds))
        .limit(1000)
      const counts = new Map<string, number>()
      ;(suggestions || []).forEach((r: FollowEdge) => {
        const id = r.following_id
        if (id === me.id) return
        if (followingIds.has(id)) return
        counts.set(id, (counts.get(id) || 0) + 1)
      })
      const top = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 6).map(([id])=>id)
      if (top.length === 0) { setItems([]); return }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url")
        .in("id", top)
      setItems((profiles as MiniProfile[]) || [])
    }
    load()
  }, [supabase])

  if (!supabase) return null

  return (
    <Card className="py-0">
      <CardContent className="p-4 space-y-3">
        <h2 className="font-semibold">Proponowani do obserwowania</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak sugestii na ten moment.</p>
        ) : (
          <ul className="grid gap-3">
            {items.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-muted border" aria-hidden>
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-medium truncate">{u.display_name || u.username || "Użytkownik"}</div>
                    {u.username && <div className="text-xs text-muted-foreground">@{u.username}</div>}
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/u/${u.username ?? u.id}`}>Zobacz profil</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
