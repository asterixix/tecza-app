"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Share2,
  Eye,
  Check,
  X,
  ExternalLink,
  Ticket,
  Trash2,
} from "lucide-react"
import {
  friendlyMessage,
  normalizeSupabaseError,
  withTimeout,
} from "@/lib/errors"

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
  max_participants?: number | null
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
  const [savingRsvp, setSavingRsvp] = useState<Participation | null>(null)
  const [removing, setRemoving] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [sendingInvite, setSendingInvite] = useState(false)

  useEffect(() => {
    async function load() {
      if (!supabase || !idOrSlug) return
      // Try by slug first, fallback to id
      let found: EventFull | null = null
      const bySlug = await withTimeout(
        supabase.from("events").select("*").eq("slug", idOrSlug).maybeSingle(),
        15000,
      )
      if (bySlug.data) {
        found = bySlug.data as EventFull
      } else {
        const byId = await withTimeout(
          supabase.from("events").select("*").eq("id", idOrSlug).maybeSingle(),
          15000,
        )
        if (byId.data) found = byId.data as EventFull
      }
      setEvent(found)
      const me = (await supabase.auth.getUser()).data.user
      if (me && found?.id) {
        const { data: p } = await withTimeout(
          supabase
            .from("event_participations")
            .select("status")
            .eq("event_id", found.id)
            .eq("user_id", me.id)
            .maybeSingle(),
          15000,
        )
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
    setSavingRsvp(newStatus)
    try {
      const {
        error,
        status: s,
        statusText,
      } = await withTimeout(
        supabase
          .from("event_participations")
          .upsert(
            { event_id: event.id, user_id: me.id, status: newStatus },
            { onConflict: "event_id,user_id" },
          ),
        15000,
      )
      if (error) {
        const err = normalizeSupabaseError(
          error,
          "Nie udało się zapisać statusu",
          { status: s, statusText },
        )
        throw new Error(friendlyMessage(err))
      }
      setStatus(newStatus)
      toast.success("Zapisano status")
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się zapisać statusu"
      toast.error(msg)
    } finally {
      setSavingRsvp(null)
    }
  }

  async function removeEvent() {
    if (!supabase || !event) return
    const ok = window.confirm("Usunąć to wydarzenie?")
    if (!ok) return
    setRemoving(true)
    try {
      const { error, status, statusText } = await withTimeout(
        supabase.from("events").delete().eq("id", event.id),
        15000,
      )
      if (error) {
        const err = normalizeSupabaseError(
          error,
          "Nie udało się usunąć wydarzenia",
          { status, statusText },
        )
        throw new Error(friendlyMessage(err))
      }
      toast.success("Usunięto wydarzenie")
      window.location.href = "/w"
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się usunąć wydarzenia"
      toast.error(msg)
    } finally {
      setRemoving(false)
    }
  }

  async function sendInvite() {
    if (!supabase || !event || !inviteEmail.trim()) return
    setSendingInvite(true)
    try {
      // For now, just copy link to clipboard and show success
      // In a real app, you'd send an email via an API
      const eventUrl = `${window.location.origin}/w/${event.slug || event.id}`
      await navigator.clipboard.writeText(eventUrl)
      toast.success("Link do wydarzenia skopiowany do schowka")
      setInviteOpen(false)
      setInviteEmail("")
      setInviteMessage("")
    } catch {
      toast.error("Nie udało się skopiować linku")
    } finally {
      setSendingInvite(false)
    }
  }

  async function shareEvent() {
    if (!event) return
    const eventUrl = `${window.location.origin}/w/${event.slug || event.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text:
            event.description ||
            `${event.title} - ${new Date(event.start_date).toLocaleDateString()}`,
          url: eventUrl,
        })
      } catch {
        // User cancelled sharing
      }
    } else {
      try {
        await navigator.clipboard.writeText(eventUrl)
        toast.success("Link skopiowany do schowka")
      } catch {
        toast.error("Nie udało się skopiować linku")
      }
    }
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

  const startDate = new Date(event.start_date)
  const endDate = event.end_date ? new Date(event.end_date) : null
  const location = event.is_online
    ? "Online"
    : [event.city, event.country].filter(Boolean).join(", ") ||
      "Nieznana lokalizacja"

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg mb-6">
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <div className="text-xl font-medium">{event.category}</div>
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          {event.is_free && (
            <Badge className="bg-green-500 text-white">Darmowe</Badge>
          )}
          {event.is_online && (
            <Badge className="bg-blue-500 text-white">Online</Badge>
          )}
        </div>
      </div>

      {/* Event Info */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-3">{event.title}</h1>

        <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {startDate.toLocaleDateString()}{" "}
              {startDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {endDate && (
                <span>
                  {" "}
                  - {endDate.toLocaleDateString()}{" "}
                  {endDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>

          {event.max_participants && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Max {event.max_participants} osób</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2">
            <Button
              variant={status === "interested" ? "default" : "outline"}
              onClick={() => rsvp("interested")}
              disabled={savingRsvp !== null}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Obserwuj
            </Button>
            <Button
              variant={status === "attending" ? "default" : "outline"}
              onClick={() => rsvp("attending")}
              disabled={savingRsvp !== null}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Biorę udział
            </Button>
            <Button
              variant={status === "not_attending" ? "default" : "outline"}
              onClick={() => rsvp("not_attending")}
              disabled={savingRsvp !== null}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Nie biorę udziału
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" asChild>
              <a
                href={`/w/${event.slug || event.id}/ical`}
                target="_blank"
                rel="noreferrer"
              >
                <Calendar className="h-4 w-4" />
                Dodaj do kalendarza
              </a>
            </Button>

            <Button variant="outline" onClick={shareEvent} className="gap-2">
              <Share2 className="h-4 w-4" />
              Udostępnij
            </Button>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Zaproś
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Zaproś znajomych</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Wiadomość (opcjonalnie)
                    </label>
                    <Textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Dołącz do tego wydarzenia..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setInviteOpen(false)}
                    >
                      Anuluj
                    </Button>
                    <Button
                      onClick={sendInvite}
                      disabled={sendingInvite || !inviteEmail.trim()}
                    >
                      {sendingInvite ? "Wysyłanie..." : "Wyślij zaproszenie"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {event.ticket_url && (
            <Button className="gap-2" asChild>
              <a href={event.ticket_url} target="_blank" rel="noreferrer">
                <Ticket className="h-4 w-4" />
                Kup bilet
              </a>
            </Button>
          )}

          {isOrganizer && (
            <Button
              variant="destructive"
              onClick={removeEvent}
              disabled={removing}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Usuń wydarzenie
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Opis wydarzenia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-muted-foreground">
            {event.description || "Brak opisu wydarzenia."}
          </p>
        </CardContent>
      </Card>

      {/* Map */}
      {osmUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Lokalizacja</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              title="Mapa"
              className="w-full h-64 rounded-b-lg"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={osmUrl}
            />
            <div className="p-4 border-t">
              <a
                href="https://www.openstreetmap.org/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Otwórz w OpenStreetMap
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
