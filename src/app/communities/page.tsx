"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Community = {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  members_count: number
  city: string | null
  country: string | null
}

export default function CommunitiesPage() {
  const supabase = getSupabase()
  const [items, setItems] = useState<Community[]>([])
  const [q, setQ] = useState("")

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const { data } = await supabase
        .from("communities")
        .select("id,name,description,avatar_url,members_count,city,country")
        .order("members_count", { ascending: false })
        .limit(50)
      setItems(data || [])
    }
    load()
  }, [supabase])

  const filtered = items.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold flex-1">Społeczności</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Szukaj społeczności" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button asChild><Link href="/communities/new">Utwórz</Link></Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <CardContent className="p-0">
              <Link href={`/communities/${c.id}`} className="flex gap-3 p-3 hover:bg-accent/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.avatar_url || "/icons/tecza-icons/1.svg"} alt="Avatar" className="h-12 w-12 rounded object-cover border" />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{c.description || ""}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.members_count} członków{(c.city||c.country)?` • ${[c.city,c.country].filter(Boolean).join(', ')}`:''}</div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
