"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type BBox = [number, number, number, number]
type CoordinatesShape =
  | { lat: number; lon: number }
  | { latitude: number; longitude: number }
  | { bbox: BBox }
  | BBox

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isBBox(value: unknown): value is BBox {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((n) => typeof n === "number")
  )
}

function hasBBoxProp(value: unknown): value is { bbox: BBox } {
  return isObject(value) && isBBox((value as Record<string, unknown>).bbox)
}

function hasLatLon(value: unknown): value is { lat: number; lon: number } {
  return (
    isObject(value) &&
    typeof (value as Record<string, unknown>).lat === "number" &&
    typeof (value as Record<string, unknown>).lon === "number"
  )
}

function hasLatitudeLongitude(
  value: unknown,
): value is { latitude: number; longitude: number } {
  return (
    isObject(value) &&
    typeof (value as Record<string, unknown>).latitude === "number" &&
    typeof (value as Record<string, unknown>).longitude === "number"
  )
}

interface EventFull {
  id: string
  slug?: string | null
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
  ticket_url?: string | null
  coordinates?: CoordinatesShape | null
}

type Participation = "interested" | "attending" | "not_attending"

export default function EventPage() {
  const supabase = getSupabase()
  const params = useParams<{ id: string }>()
  const idOrSlug = params?.id
  const [event, setEvent] = useState<EventFull | null>(null)
  const [status, setStatus] = useState<Participation | null>(null)
  const [isOrganizer, setIsOrganizer] = useState(false)

  useEffect(() => {
    async function load() {
      if (!supabase || !idOrSlug) return
      // Try by slug first, fallback to id
      let found: EventFull | null = null
      const bySlug = await supabase
        .from("events")
        .select("*")
        .eq("slug", idOrSlug)
        .maybeSingle()
      if (bySlug.data) {
        found = bySlug.data as EventFull
      } else {
        const byId = await supabase
          .from("events")
          .select("*")
          .eq("id", idOrSlug)
          .maybeSingle()
        if (byId.data) found = byId.data as EventFull
      }
      setEvent(found)
      const me = (await supabase.auth.getUser()).data.user
      if (me && found?.id) {
        const { data: p } = await supabase
          .from("event_participations")
          .select("status")
          .eq("event_id", found.id)
          .eq("user_id", me.id)
          .maybeSingle()
        setStatus((p?.status as Participation) || null)
        setIsOrganizer(me.id === found.organizer_id)
      }
    }
    load()
  }, [supabase, idOrSlug])

  async function rsvp(newStatus: Participation) {
    if (!supabase || !event) return
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return
    await supabase
      .from("event_participations")
      .upsert(
        { event_id: event.id, user_id: me.id, status: newStatus },
        { onConflict: "event_id,user_id" },
      )
    setStatus(newStatus)
  }

  async function removeEvent() {
    if (!supabase || !event) return
    const ok = window.confirm("Usunąć to wydarzenie?")
    if (!ok) return
    await supabase.from("events").delete().eq("id", event.id)
    window.location.href = "/w"
  }

  if (!event)
    return <div className="mx-auto max-w-4xl p-4 md:p-6">Wczytywanie…</div>

  function buildOsmEmbedUrl(
    coords: CoordinatesShape | null | undefined,
  ): string | null {
    if (!coords) return null
    // Accept bbox directly
    if (isBBox(coords)) {
      const [minLon, minLat, maxLon, maxLat] = coords
      const bbox = `${minLon},${minLat},${maxLon},${maxLat}`
      return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`
    }
    // Accept object with bbox
    if (hasBBoxProp(coords)) {
      const [minLon, minLat, maxLon, maxLat] = coords.bbox
      const bbox = `${minLon},${minLat},${maxLon},${maxLat}`
      return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`
    }
    // Accept lat/lon variants and create a tiny bbox around the point
    if (hasLatLon(coords)) {
      const { lat, lon } = coords
      const delta = 0.01 // ~1km window
      const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`
      return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&marker=${encodeURIComponent(
        `${lat},${lon}`,
      )}&layer=mapnik`
    }
    if (hasLatitudeLongitude(coords)) {
      const { latitude: lat, longitude: lon } = coords
      const delta = 0.01 // ~1km window
      const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`
      return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&marker=${encodeURIComponent(
        `${lat},${lon}`,
      )}&layer=mapnik`
    }
    return null
  }

  const osmUrl = buildOsmEmbedUrl(event.coordinates ?? null)

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="relative h-40 w-full overflow-hidden">
        <div className="h-full w-full bg-muted" />
      </div>
      <div className="mt-4">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <div className="text-sm text-muted-foreground">
          {new Date(event.start_date).toLocaleString()}{" "}
          {event.end_date
            ? `– ${new Date(event.end_date).toLocaleString()}`
            : ""}{" "}
          •{" "}
          {event.city || event.country
            ? [event.city, event.country].filter(Boolean).join(", ")
            : event.is_online
              ? "Online"
              : ""}
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant={status === "interested" ? "default" : "outline"}
            onClick={() => rsvp("interested")}
          >
            Obserwuj
          </Button>
          <Button
            variant={status === "attending" ? "default" : "outline"}
            onClick={() => rsvp("attending")}
          >
            Biorę udział
          </Button>
          <Button
            variant={status === "not_attending" ? "default" : "outline"}
            onClick={() => rsvp("not_attending")}
          >
            Nie biorę udziału
          </Button>
          <Button asChild variant="outline">
            <a
              href={`/w/${event.slug || event.id}/ical`}
              target="_blank"
              rel="noreferrer"
            >
              iCal
            </a>
          </Button>
          {event.cover_image_url ? (
            <Button asChild variant="outline">
              <a href={event.cover_image_url} target="_blank" rel="noreferrer">
                Plakat
              </a>
            </Button>
          ) : null}
          {event.ticket_url ? (
            <Button asChild>
              <a href={event.ticket_url} target="_blank" rel="noreferrer">
                Kup bilet
              </a>
            </Button>
          ) : null}
          {isOrganizer && (
            <Button variant="destructive" onClick={removeEvent}>
              Usuń wydarzenie
            </Button>
          )}
        </div>
        {osmUrl ? (
          <Card className="mt-4">
            <CardContent className="p-0">
              <iframe
                title="Mapa"
                className="w-full h-64 rounded"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={osmUrl}
              />
              <div className="p-2 text-xs text-muted-foreground">
                <a
                  href="https://www.openstreetmap.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Otwórz w OpenStreetMap
                </a>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <Card className="mt-6">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-1">Opis</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {event.description || "Brak opisu."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
