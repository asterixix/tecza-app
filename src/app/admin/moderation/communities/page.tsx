"use client"

import { useCallback, useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Community = {
  id: string
  name: string
  slug: string | null
  description: string | null
  avatar_url: string | null
  cover_image_url: string | null
  status: "pending" | "active" | "rejected"
  owner_id: string
  city: string | null
  country: string | null
  type: "public" | "private" | "restricted"
}

export default function CommunitiesModeration() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState(false)
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<Community[]>([])

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from("communities")
      .select(
        "id,name,slug,description,avatar_url,cover_image_url,status,owner_id,city,country,type",
      )
      .order("created_at", { ascending: false })
      .limit(100)
    setItems((data as Community[]) || [])
  }, [supabase])

  useEffect(() => {
    ;(async () => {
      if (!supabase) return
      const me = (await supabase.auth.getUser()).data.user
      if (!me) return
      const { data: prof } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", me.id)
        .maybeSingle()
      const roles = (prof?.roles as string[] | null) || []
      const ok = roles.some((r) =>
        ["moderator", "administrator", "super-administrator"].includes(r),
      )
      setAllowed(ok)
      if (ok) await refresh()
    })()
  }, [supabase, refresh])

  async function setStatus(id: string, status: Community["status"]) {
    if (!supabase) return
    await supabase.from("communities").update({ status }).eq("id", id)
    await refresh()
  }

  async function saveEdits(id: string, patch: Partial<Community>) {
    if (!supabase) return
    await supabase
      .from("communities")
      .update({ ...patch })
      .eq("id", id)
    await refresh()
  }

  async function removeMedia(id: string, which: "avatar" | "cover") {
    if (!supabase) return
    const patch =
      which === "avatar" ? { avatar_url: null } : { cover_image_url: null }
    await supabase.from("communities").update(patch).eq("id", id)
    await refresh()
  }

  async function removeCommunity(id: string) {
    if (!supabase) return
    if (!confirm("Na pewno usunąć społeczność? Tej operacji nie można cofnąć."))
      return
    await supabase.from("communities").delete().eq("id", id)
    await refresh()
  }

  if (!allowed) return null

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Moderacja społeczności</h1>
      <div className="mb-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po nazwie lub slugu"
          className="max-w-sm"
        />
      </div>
      <div className="grid gap-4">
        {items
          .filter((c) => {
            if (!query.trim()) return true
            const q = query.toLowerCase()
            return (
              (c.name || "").toLowerCase().includes(q) ||
              (c.slug || "").toLowerCase().includes(q)
            )
          })
          .map((c) => (
            <div key={c.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm rounded bg-muted px-2 py-0.5">
                  {c.status}
                </span>
                <strong>{c.name}</strong>
                <span className="text-muted-foreground">/{c.slug}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {c.type}
                </span>
              </div>
              <div className="mt-2 grid gap-2">
                <Textarea
                  defaultValue={c.description || ""}
                  onBlur={(e) =>
                    saveEdits(c.id, { description: e.currentTarget.value })
                  }
                />
                <div className="grid sm:grid-cols-2 gap-2">
                  <Input
                    defaultValue={c.city || ""}
                    placeholder="Miasto"
                    onBlur={(e) =>
                      saveEdits(c.id, { city: e.currentTarget.value || null })
                    }
                  />
                  <Input
                    defaultValue={c.country || ""}
                    placeholder="Kraj"
                    onBlur={(e) =>
                      saveEdits(c.id, {
                        country: e.currentTarget.value || null,
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.status !== "active" && (
                  <Button size="sm" onClick={() => setStatus(c.id, "active")}>
                    Zatwierdź
                  </Button>
                )}
                {c.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus(c.id, "rejected")}
                  >
                    Odrzuć
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeMedia(c.id, "avatar")}
                >
                  Usuń avatar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeMedia(c.id, "cover")}
                >
                  Usuń tło
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeCommunity(c.id)}
                >
                  Usuń
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
