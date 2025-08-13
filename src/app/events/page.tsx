"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EventRow {
  id: string
  title: string
  start_date: string
  city: string | null
  country: string | null
  category: string
  cover_image_url: string | null
}

export default function EventsPage() {
  const supabase = getSupabase()
  const [items, setItems] = useState<EventRow[]>([])
  const [q, setQ] = useState("")

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('events')
        .select('id,title,start_date,city,country,category,cover_image_url')
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .limit(50)
      setItems(data || [])
    }
    load()
  }, [supabase])

  const filtered = items.filter(e => e.title.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold flex-1">Wydarzenia</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Szukaj wydarzeń" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button asChild><Link href="/events/new">Utwórz</Link></Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((e) => (
          <Card key={e.id} className="overflow-hidden">
            <CardContent className="p-0">
              <Link href={`/events/${e.id}`} className="flex gap-3 p-3 hover:bg-accent/30">
                <div className="h-12 w-12 rounded bg-muted" />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{e.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{new Date(e.start_date).toLocaleString()} • {([e.city,e.country].filter(Boolean).join(', ') || 'Online')}</div>
                  <div className="text-xs text-muted-foreground mt-1">{e.category}</div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
