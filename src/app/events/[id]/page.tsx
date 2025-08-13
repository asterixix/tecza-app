"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface EventFull {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  timezone: string
  location: string | null
  city: string | null
  country: string | null
  is_online: boolean
  is_free: boolean
  category: string
  cover_image_url: string | null
  organizer_id: string
}

type Participation = 'interested' | 'attending' | 'not_attending'

export default function EventPage() {
  const supabase = getSupabase()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [event, setEvent] = useState<EventFull | null>(null)
  const [status, setStatus] = useState<Participation | null>(null)

  useEffect(() => {
    async function load() {
      if (!supabase || !id) return
      const { data: e } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
      setEvent(e as EventFull)
      const me = (await supabase.auth.getUser()).data.user
      if (me) {
        const { data: p } = await supabase.from('event_participations').select('status').eq('event_id', id).eq('user_id', me.id).maybeSingle()
        setStatus((p?.status as Participation) || null)
      }
    }
    load()
  }, [supabase, id])

  async function rsvp(newStatus: Participation) {
    if (!supabase || !event) return
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return
    await supabase.from('event_participations').upsert({ event_id: event.id, user_id: me.id, status: newStatus }, { onConflict: 'event_id,user_id' })
    setStatus(newStatus)
  }

  if (!event) return <div className="mx-auto max-w-4xl p-4 md:p-6">Wczytywanie…</div>

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="relative h-40 w-full overflow-hidden">
        <div className="h-full w-full bg-muted" />
      </div>
      <div className="mt-4">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <div className="text-sm text-muted-foreground">{new Date(event.start_date).toLocaleString()} {event.end_date ? `– ${new Date(event.end_date).toLocaleString()}` : ''} • {event.city || event.country ? [event.city, event.country].filter(Boolean).join(', ') : (event.is_online ? 'Online' : '')}</div>
        <div className="mt-3 flex gap-2">
          <Button variant={status === 'interested' ? 'default' : 'outline'} onClick={() => rsvp('interested')}>Obserwuj</Button>
          <Button variant={status === 'attending' ? 'default' : 'outline'} onClick={() => rsvp('attending')}>Biorę udział</Button>
          <Button variant={status === 'not_attending' ? 'default' : 'outline'} onClick={() => rsvp('not_attending')}>Nie biorę udziału</Button>
          <Button asChild variant="outline"><a href={`/events/${event.id}/ical`} target="_blank" rel="noreferrer">iCal</a></Button>
        </div>
        <Card className="mt-6">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-1">Opis</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description || 'Brak opisu.'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
