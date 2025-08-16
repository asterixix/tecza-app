"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ProfilesModeration() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  type ProfileRow = {
    id: string
    username: string | null
    suspended_at: string | null
    suspended_reason: string | null
  }
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    ;(async () => {
      if (!supabase) {
        setAllowed(false)
        return
      }
      const u = (await supabase.auth.getUser()).data.user
      if (!u) {
        setAllowed(false)
        return
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", u.id)
        .maybeSingle()
      const roles = (prof?.roles as string[] | undefined) || []
      const ok = roles.some((r) =>
        ["moderator", "administrator", "super-administrator"].includes(r)
      )
      setAllowed(ok)
      if (!ok) window.location.href = "/d"
    })()
  }, [supabase])

  useEffect(() => {
    ;(async () => {
      if (!supabase) return
      if (!allowed) return
      setLoading(true)
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id,username,suspended_at,suspended_reason")
          .order("username")
        const rows =
          (data as Array<{
            id: string
            username: string | null
            suspended_at: string | null
            suspended_reason: string | null
          }>) || []
        setProfiles(rows)
      } finally {
        setLoading(false)
      }
    })()
  }, [allowed, supabase])

  async function banUser(id: string) {
    if (!supabase) return
    const reason = prompt("Powód blokady? (widoczny w logach)") || "moderation"
    const { error } = await supabase.rpc("admin_ban_user", { p_user_id: id, p_reason: reason })
    if (!error)
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, suspended_at: new Date().toISOString(), suspended_reason: reason }
            : p
        )
      )
  }

  async function unbanUser(id: string) {
    if (!supabase) return
    const { error } = await supabase.rpc("admin_unban_user", { p_user_id: id })
    if (!error)
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, suspended_at: null, suspended_reason: null } : p))
      )
  }

  const filtered = useMemo(
    () =>
      profiles.filter(
        (p) => !query || (p.username || "").toLowerCase().includes(query.toLowerCase())
      ),
    [profiles, query]
  )

  if (allowed === null || !allowed) return null

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Moderacja profili</h1>
      <div className="mb-4 flex items-center gap-2">
        <input
          className="w-full max-w-sm rounded-md border px-3 py-2"
          placeholder="Szukaj użytkownika"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Ładowanie…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak użytkowników.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="font-medium">
                    {p.username || p.id.slice(0, 8)}
                    {p.username ? "" : "…"}
                  </span>
                  {p.suspended_at ? (
                    <Badge variant="destructive">Zablokowany</Badge>
                  ) : (
                    <Badge variant="outline">Aktywny</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm flex items-center justify-between">
                <div className="text-muted-foreground">
                  {p.suspended_at
                    ? `Od: ${new Date(p.suspended_at).toLocaleString()} — ${
                        p.suspended_reason || ""
                      }`
                    : ""}
                </div>
                <div className="flex gap-2">
                  {p.suspended_at ? (
                    <Button size="sm" variant="outline" onClick={() => unbanUser(p.id)}>
                      Odblokuj
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => banUser(p.id)}>
                      Zablokuj
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
