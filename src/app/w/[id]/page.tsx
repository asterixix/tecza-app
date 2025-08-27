"use client"

import { useEffect, useRef, useState, useCallback } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Calendar,
  Upload,
  MapPin,
  Clock,
  Users,
  User,
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
  join_url?: string | null
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
  const [inviteMessage, setInviteMessage] = useState("")
  const [sendingInvite, setSendingInvite] = useState(false)
  const [friends, setFriends] = useState<
    Array<{
      id: string
      username: string | null
      display_name: string | null
      avatar_url: string | null
    }>
  >([])
  const [selectedFriends, setSelectedFriends] = useState<
    Record<string, boolean>
  >({})
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [counts, setCounts] = useState<{
    interested: number
    attending: number
  }>({ interested: 0, attending: 0 })
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<
    "hate_speech" | "harassment" | "spam" | "inappropriate_content" | "other"
  >("other")
  const [reportDesc, setReportDesc] = useState("")
  const [submittingReport, setSubmittingReport] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [pendingReports, setPendingReports] = useState<
    Array<{
      id: string
      reason: string
      description: string | null
      created_at: string
      reporter_id: string
    }>
  >([])
  type OrganizerProfile = {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
  const [organizer, setOrganizer] = useState<OrganizerProfile | null>(null)

  // Load counters for observers and attendees (moved above useEffect)
  const loadCounts = useCallback(
    async (eventId: string) => {
      if (!supabase) return
      try {
        const [{ count: interested }, { count: attending }] = await Promise.all(
          [
            supabase
              .from("event_participations")
              .select("id", { count: "exact", head: true })
              .eq("event_id", eventId)
              .eq("status", "interested"),
            supabase
              .from("event_participations")
              .select("id", { count: "exact", head: true })
              .eq("event_id", eventId)
              .eq("status", "attending"),
          ],
        )
        setCounts({ interested: interested ?? 0, attending: attending ?? 0 })
      } catch {
        // ignore count errors
      }
    },
    [supabase],
  )

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
      if (found?.id) {
        void loadCounts(found.id)
      }
      // Load organizer profile for display/linking
      if (found?.organizer_id) {
        try {
          const { data: org } = await withTimeout(
            supabase
              .from("profiles")
              .select("id,username,display_name,avatar_url")
              .eq("id", found.organizer_id)
              .maybeSingle(),
            15000,
          )
          if (org) {
            setOrganizer(org as OrganizerProfile)
          } else {
            setOrganizer(null)
          }
        } catch {
          setOrganizer(null)
        }
      } else {
        setOrganizer(null)
      }
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

        // Determine staff by checking roles from profiles
        const { data: profile } = await withTimeout(
          supabase
            .from("profiles")
            .select("roles")
            .eq("id", me.id)
            .maybeSingle(),
          15000,
        )
        const roles: string[] = (profile?.roles as string[]) || []
        const staff = roles.some((r) =>
          ["moderator", "administrator", "super-administrator"].includes(r),
        )
        setIsStaff(staff)

        if (staff && found?.id) {
          const { data: reports } = await withTimeout(
            supabase
              .from("moderation_reports")
              .select("id,reason,description,created_at,reporter_id")
              .eq("target_type", "event")
              .eq("target_id", found.id),
            15000,
          )
          setPendingReports(reports || [])
        }
      }
    }
    load()
  }, [supabase, idOrSlug, loadCounts])

  // Lazy-load friends when opening invite dialog
  useEffect(() => {
    async function loadFriends() {
      if (!supabase || !inviteOpen) return
      try {
        setLoadingFriends(true)
        const me = (await supabase.auth.getUser()).data.user
        if (!me) return
        const { data: friendships } = await withTimeout(
          supabase
            .from("friendships")
            .select("user1_id,user2_id,status")
            .or(`user1_id.eq.${me.id},user2_id.eq.${me.id}`)
            .eq("status", "active"),
          15000,
        )
        type FriendshipRow = {
          user1_id: string
          user2_id: string
          status: string
        }
        const friendIds = ((friendships || []) as FriendshipRow[]).map((f) =>
          f.user1_id === me.id ? f.user2_id : f.user1_id,
        )
        if (friendIds.length === 0) {
          setFriends([])
          return
        }
        const { data: profs } = await withTimeout(
          supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url")
            .in("id", friendIds),
          15000,
        )
        setFriends(profs || [])
      } finally {
        setLoadingFriends(false)
      }
    }
    void loadFriends()
  }, [inviteOpen, supabase])

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
      if (event?.id) void loadCounts(event.id)
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
    if (!supabase || !event) return
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return
    const selectedIds = Object.entries(selectedFriends)
      .filter(([, v]) => v)
      .map(([id]) => id)
    if (selectedIds.length === 0) return
    setSendingInvite(true)
    try {
      const eventUrl = `${window.location.origin}/w/${event.slug || event.id}`
      const rows = selectedIds.map((uid) => ({
        user_id: uid,
        type: "event_invite",
        title: "Zaproszenie na wydarzenie",
        body:
          inviteMessage?.trim() ||
          `Zaproszono Cię na wydarzenie: ${event.title}`,
        data: {
          event_id: event.id,
          slug: event.slug,
          title: event.title,
          url: eventUrl,
        },
      }))
      const { error } = await withTimeout(
        supabase.from("notifications").insert(rows),
        15000,
      )
      if (error) throw error
      toast.success("Zaproszenia wysłane")
      setInviteOpen(false)
      setInviteMessage("")
      setSelectedFriends({})
    } catch {
      toast.error("Nie udało się wysłać zaproszeń")
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

  async function uploadCover(file: File) {
    if (!supabase || !event || !isOrganizer) return
    try {
      const sizeLimit = 5 * 1024 * 1024
      if (file.size > sizeLimit) throw new Error("Okładka przekracza 5MB")
      const ext = file.name.split(".").pop() || "jpg"
      const path = `${event.id}/cover_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("event-images")
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage
        .from("event-images")
        .getPublicUrl(path)
      // Best-effort: remove previous cover file to avoid leaks
      if (event.cover_image_url) {
        try {
          const oldUrl = new URL(event.cover_image_url)
          // public URL format: /storage/v1/object/public/event-images/<objectPath>
          const parts = oldUrl.pathname.split("/object/public/event-images/")
          const oldPath = parts[1]
          if (oldPath) {
            await supabase.storage.from("event-images").remove([oldPath])
          }
        } catch {
          // ignore cleanup errors
        }
      }
      const { error } = await withTimeout(
        supabase
          .from("events")
          .update({ cover_image_url: urlData.publicUrl })
          .eq("id", event.id),
        15000,
      )
      if (error) throw error
      setEvent({ ...event, cover_image_url: urlData.publicUrl })
      toast.success("Okładka zaktualizowana")
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się zaktualizować okładki"
      toast.error(msg)
    }
  }

  async function removeCover() {
    if (!supabase || !event || !isOrganizer) return
    try {
      // Best-effort: remove previous cover file from storage
      if (event.cover_image_url) {
        try {
          const oldUrl = new URL(event.cover_image_url)
          const parts = oldUrl.pathname.split("/object/public/event-images/")
          const oldPath = parts[1]
          if (oldPath) {
            await supabase.storage.from("event-images").remove([oldPath])
          }
        } catch {
          // ignore cleanup errors
        }
      }
      const { error } = await withTimeout(
        supabase
          .from("events")
          .update({ cover_image_url: null })
          .eq("id", event.id),
        15000,
      )
      if (error) throw error
      setEvent({ ...event, cover_image_url: null })
      toast.success("Okładka usunięta")
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się usunąć okładki"
      toast.error(msg)
    }
  }

  async function submitReport() {
    if (!supabase || !event) return
    setSubmittingReport(true)
    try {
      const me = (await supabase.auth.getUser()).data.user
      if (!me) throw new Error("Musisz być zalogowany")
      const { error } = await withTimeout(
        supabase.from("moderation_reports").insert({
          reporter_id: me.id,
          target_type: "event",
          target_id: event.id,
          reason: reportReason,
          description: reportDesc || null,
        }),
        15000,
      )
      if (error) throw error
      toast.success("Zgłoszenie wysłane")
      setReportOpen(false)
      setReportDesc("")
      setReportReason("other")
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się wysłać zgłoszenia"
      toast.error(msg)
    } finally {
      setSubmittingReport(false)
    }
  }

  async function updateReportStatus(
    id: string,
    status: "reviewed" | "resolved" | "dismissed",
  ) {
    if (!supabase || !isStaff) return
    try {
      const { error } = await withTimeout(
        supabase.from("moderation_reports").update({ status }).eq("id", id),
        15000,
      )
      if (error) throw error
      setPendingReports((prev) => prev.filter((r) => r.id !== id))
      toast.success("Status zgłoszenia zaktualizowany")
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Aktualizacja nie powiodła się"
      toast.error(msg)
    }
  }

  if (!event)
    return <div className="mx-auto max-w-4xl p-4 md:p-6">Wczytywanie…</div>

  function EventCoverControls({
    onPick,
    onRemove,
    hasCover,
  }: {
    onPick: (file: File) => void
    onRemove: () => void
    hasCover: boolean
  }) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    return (
      <div className="absolute bottom-4 left-4 flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0]
            if (f) onPick(f)
            // Reset the input so selecting the same file again will retrigger onChange
            if (inputRef.current) inputRef.current.value = ""
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" /> Zmień okładkę
        </Button>
        {hasCover && (
          <Button
            type="button"
            variant="destructive"
            onClick={onRemove}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Usuń okładkę
          </Button>
        )}
      </div>
    )
  }

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

  function buildOsmViewUrl(
    coords: CoordinatesShape | null | undefined,
    fallbackQuery?: string,
  ): string | null {
    if (!coords && fallbackQuery) {
      return `https://www.openstreetmap.org/search?query=${encodeURIComponent(fallbackQuery)}`
    }
    if (!coords) return null
    if (isBBox(coords)) {
      const [minLon, minLat, maxLon, maxLat] = coords
      const lat = (minLat + maxLat) / 2
      const lon = (minLon + maxLon) / 2
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`
    }
    if (hasBBoxProp(coords)) {
      const [minLon, minLat, maxLon, maxLat] = coords.bbox
      const lat = (minLat + maxLat) / 2
      const lon = (minLon + maxLon) / 2
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`
    }
    if (hasLatLon(coords)) {
      const { lat, lon } = coords
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}`
    }
    if (hasLatitudeLongitude(coords)) {
      const { latitude: lat, longitude: lon } = coords
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}`
    }
    return fallbackQuery
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(fallbackQuery)}`
      : null
  }

  const osmViewUrl = !event.is_online
    ? buildOsmViewUrl(event.coordinates ?? null, location)
    : null

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
        {isOrganizer && (
          <EventCoverControls
            onPick={(f: File) => uploadCover(f)}
            onRemove={removeCover}
            hasCover={!!event.cover_image_url}
          />
        )}
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
            {event.is_online ? (
              event.join_url ? (
                <a
                  href={event.join_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Dołącz do spotkania <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span>Online</span>
              )
            ) : osmViewUrl ? (
              <a
                href={osmViewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                {location} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span>{location}</span>
            )}
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
          {/* Organizer */}
          {organizer && (
            <div className="flex items-center gap-2 mr-4 text-muted-foreground">
              <User className="h-4 w-4" />
              {organizer.username ? (
                <a
                  href={`/u/${organizer.username}`}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={organizer.avatar_url || "/icons/tecza-icons/1.svg"}
                    alt=""
                    className="h-4 w-4 rounded-full border object-cover"
                  />
                  <span>
                    {organizer.display_name || `@${organizer.username}`}
                  </span>
                </a>
              ) : (
                <span>{organizer.display_name || "Organizator"}</span>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant={status === "interested" ? "default" : "outline"}
              onClick={() => rsvp("interested")}
              disabled={savingRsvp !== null}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Obserwuj ({counts.interested})
            </Button>
            <Button
              variant={status === "attending" ? "default" : "outline"}
              onClick={() => rsvp("attending")}
              disabled={savingRsvp !== null}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Biorę udział ({counts.attending})
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

            {/* Report Event */}
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Zgłoś</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Zgłoś wydarzenie</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Powód</label>
                    <select
                      className="mt-1 w-full border rounded-md p-2 text-sm bg-background"
                      value={reportReason}
                      onChange={(e) =>
                        setReportReason(e.target.value as typeof reportReason)
                      }
                    >
                      <option value="hate_speech">Mowa nienawiści</option>
                      <option value="harassment">Nękanie</option>
                      <option value="spam">Spam</option>
                      <option value="inappropriate_content">
                        Niewłaściwe treści
                      </option>
                      <option value="other">Inne</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Opis (opcjonalnie)
                    </label>
                    <Textarea
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setReportOpen(false)}
                    >
                      Anuluj
                    </Button>
                    <Button onClick={submitReport} disabled={submittingReport}>
                      {submittingReport ? "Wysyłanie..." : "Wyślij zgłoszenie"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
                  <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                    {loadingFriends ? (
                      <div className="text-sm text-muted-foreground p-2">
                        Ładowanie znajomych…
                      </div>
                    ) : friends.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-2">
                        Brak znajomych do zaproszenia
                      </div>
                    ) : (
                      friends.map((f) => (
                        <label
                          key={f.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.avatar_url || "/icons/tecza-icons/1.svg"}
                            alt=""
                            className="h-6 w-6 rounded-full border object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {f.display_name || f.username || "Użytkownik"}
                            </div>
                            {f.username && (
                              <div className="text-xs text-muted-foreground truncate">
                                @{f.username}
                              </div>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!selectedFriends[f.id]}
                            onChange={(e) =>
                              setSelectedFriends((prev) => ({
                                ...prev,
                                [f.id]: e.target.checked,
                              }))
                            }
                          />
                        </label>
                      ))
                    )}
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
                      disabled={
                        sendingInvite ||
                        Object.values(selectedFriends).every((v) => !v)
                      }
                    >
                      {sendingInvite ? "Wysyłanie..." : "Wyślij zaproszenia"}
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

      {isStaff && pendingReports.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Zgłoszenia dla tego wydarzenia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingReports.map((r) => (
              <div key={r.id} className="border rounded-md p-3">
                <div className="text-sm font-medium">Powód: {r.reason}</div>
                {r.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {r.description}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Zgłoszono: {new Date(r.created_at).toLocaleString()}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateReportStatus(r.id, "reviewed")}
                  >
                    Oznacz jako sprawdzone
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateReportStatus(r.id, "resolved")}
                  >
                    Rozwiąż
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateReportStatus(r.id, "dismissed")}
                  >
                    Odrzuć
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
