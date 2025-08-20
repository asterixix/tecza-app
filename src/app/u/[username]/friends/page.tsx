"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function FriendsPage() {
  const supabase = getSupabase()
  const params = useParams<{ username: string }>()
  const username = params?.username
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [friends, setFriends] = useState<
    {
      id: string
      username: string | null
      display_name: string | null
      avatar_url: string | null
    }[]
  >([])
  const [q, setQ] = useState("")

  useEffect(() => {
    async function load() {
      if (!supabase || !username) return
      setLoading(true)
      const { data: prof } = await supabase
        .from("profiles")
        .select("id,username,show_friends")
        .ilike("username", String(username))
        .maybeSingle()
      if (!prof) {
        setNotFound(true)
        setLoading(false)
        return
      }
      if (prof.show_friends === false) {
        setFriends([])
        setLoading(false)
        return
      }
      const { data: edges } = await supabase
        .from("friendships")
        .select("user1_id,user2_id")
        .or(`user1_id.eq.${prof.id},user2_id.eq.${prof.id}`)
        .eq("status", "active")
      const friendIds = new Set<string>()
      edges?.forEach((e) => {
        if (e.user1_id === prof.id) friendIds.add(e.user2_id)
        if (e.user2_id === prof.id) friendIds.add(e.user1_id)
      })
      if (friendIds.size) {
        const { data: fr } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .in("id", Array.from(friendIds))
        setFriends((fr as typeof friends) || [])
      } else {
        setFriends([])
      }
      setLoading(false)
    }
    load()
  }, [supabase, username])

  const filtered = q
    ? friends.filter(
        (f) =>
          (f.display_name || "").toLowerCase().includes(q.toLowerCase()) ||
          (f.username || "").toLowerCase().includes(q.toLowerCase()),
      )
    : friends

  if (notFound) return <div className="p-4">Użytkownik nie istnieje.</div>

  return (
    <div className="max-w-2xl mx-auto px-3 py-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-semibold">Znajomi</h1>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Szukaj znajomych"
              className="max-w-[220px]"
            />
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Wczytywanie…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">Brak wyników.</div>
          ) : (
            <ul className="grid gap-3">
              {filtered.map((f) => (
                <li key={f.id} className="flex items-center gap-3">
                  <Link
                    href={f.username ? `/u/${f.username}` : "#"}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="h-10 w-10 rounded-full overflow-hidden bg-muted border"
                      aria-hidden
                    >
                      {f.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-medium truncate">
                        {f.display_name || f.username || "Użytkownik"}
                      </div>
                      {f.username && (
                        <div className="text-xs text-muted-foreground">
                          @{f.username}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
