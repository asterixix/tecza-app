"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { toast } from "sonner"
import { friendlyMessage, normalizeSupabaseError } from "@/lib/errors"
import { slugify } from "@/lib/utils"

type Category =
  | "pride"
  | "support"
  | "social"
  | "activism"
  | "education"
  | "other"

type ParticipationStatus = "interested" | "attending" | "not_attending"

type EventRow = {
  id: string
  slug: string | null
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  city: string | null
  country: string | null
  category: Category
  is_online: boolean
  is_free: boolean
  cover_image_url: string | null
  organizer_id: string
  max_participants: number | null
  community_id: string | null
}

export function CommunityEvents(props: {
  communityId: string
  currentUserId: string | null
  isMember: boolean
}) {
  const { communityId, currentUserId, isMember } = props
  const supabase = getSupabase()
  const [items, setItems] = useState<EventRow[]>([])
  const [participations, setParticipations] = useState<
    Record<string, ParticipationStatus>
  >({})
  const [savingRsvp, setSavingRsvp] = useState<string | null>(null)

  // Create dialog state
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [timezone, setTimezone] = useState("Europe/Warsaw")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [category, setCategory] = useState<Category>("other")
  const [isOnline, setIsOnline] = useState(false)
  const [isFree, setIsFree] = useState(true)
  const [loading, setLoading] = useState(false)

  const nowIso = useMemo(() => new Date().toISOString(), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !communityId) return
      const { data, error, status, statusText } = await supabase
        .from("events")
        .select(
          "id,slug,title,description,start_date,end_date,city,country,category,is_online,is_free,cover_image_url,organizer_id,max_participants,community_id",
        )
        .eq("community_id", communityId)
        .gte("start_date", nowIso)
        .order("start_date", { ascending: true })
        .limit(100)
      if (error) {
        const err = normalizeSupabaseError(
          error,
          "Nie udało się pobrać wydarzeń",
          {
            status,
            statusText,
          },
        )
        toast.error(friendlyMessage(err))
      }
      if (!cancelled) setItems(data || [])

      if (currentUserId && data?.length) {
        const ids = data.map((e) => e.id)
        const { data: parts } = await supabase
          .from("event_participations")
          .select("event_id,status")
          .eq("user_id", currentUserId)
          .in("event_id", ids)
        const map: Record<string, ParticipationStatus> = {}
        parts?.forEach((p) => {
          const s = p.status as ParticipationStatus
          if (
            s === "interested" ||
            s === "attending" ||
            s === "not_attending"
          ) {
            map[p.event_id] = s
          }
        })
        if (!cancelled) setParticipations(map)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [supabase, communityId, currentUserId, nowIso])

  async function handleRsvp(eventId: string, newStatus: ParticipationStatus) {
    if (!supabase || !currentUserId) return
    setSavingRsvp(eventId)
    try {
      const { error } = await supabase
        .from("event_participations")
        .upsert(
          { event_id: eventId, user_id: currentUserId, status: newStatus },
          { onConflict: "event_id,user_id" },
        )
      if (error) throw error
      setParticipations((prev) => ({ ...prev, [eventId]: newStatus }))
      toast.success("Zapisano status")
    } catch {
      toast.error("Nie udało się zapisać statusu")
    } finally {
      setSavingRsvp(null)
    }
  }

  async function createEvent() {
    if (!supabase) return
    if (!title.trim() || !start)
      return toast.error("Podaj tytuł i datę rozpoczęcia")
    setLoading(true)
    try {
      if (!currentUserId) throw new Error("Musisz być zalogowany")
      const baseSlug = slugify(title)
      const tryInsert = async (slugValue: string | null) =>
        await supabase
          .from("events")
          .insert({
            title,
            description,
            start_date: new Date(start).toISOString(),
            end_date: end ? new Date(end).toISOString() : null,
            timezone: timezone || "Europe/Warsaw",
            city: city || null,
            country: country || null,
            is_online: isOnline,
            is_free: isFree,
            category,
            organizer_id: currentUserId,
            community_id: communityId,
            ...(slugValue ? { slug: slugValue } : {}),
          })
          .select("id,slug")
          .single()

      let { data, error } = await tryInsert(baseSlug)
      if (error && String(error.code).includes("23505")) {
        const suffix = Math.random().toString(36).slice(2, 6)
        const r = await tryInsert(`${baseSlug}-${suffix}`)
        data = r.data
        error = r.error
      }
      if (error) throw error
      toast.success("Wydarzenie utworzone")
      setOpen(false)
      setTitle("")
      setDescription("")
      setStart("")
      setEnd("")
      setTimezone("Europe/Warsaw")
      setCity("")
      setCountry("")
      setCategory("other")
      setIsOnline(false)
      setIsFree(true)
      // Navigate to event
      window.location.href = `/w/${data!.slug || data!.id}`
    } catch (e) {
      const err = normalizeSupabaseError(e, "Nie udało się utworzyć wydarzenia")
      toast.error(friendlyMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {isMember && (
        <div className="flex justify-end">
          <Button onClick={() => setOpen(true)}>Utwórz wydarzenie</Button>
        </div>
      )}

      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((e) => {
          const userStatus = participations[e.id]
          const isLoading = savingRsvp === e.id
          const startDate = new Date(e.start_date)
          const endDate = e.end_date ? new Date(e.end_date) : null
          const location = e.is_online
            ? "Online"
            : [e.city, e.country].filter(Boolean).join(", ") ||
              "Nieznana lokalizacja"
          return (
            <Card key={e.id} className="overflow-hidden">
              <div className="relative h-40 overflow-hidden">
                {e.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.cover_image_url}
                    alt={e.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <div className="text-2xl mb-2">📅</div>
                      <div className="text-sm font-medium">{e.category}</div>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      e.is_free
                        ? "bg-green-500 text-white"
                        : "bg-orange-500 text-white"
                    }`}
                  >
                    {e.is_free ? "Darmowe" : "Płatne"}
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg leading-tight mb-1 line-clamp-2">
                    {e.title}
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      📅 {startDate.toLocaleDateString()}{" "}
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
                    </div>
                    <div>📍 {location}</div>
                    {e.max_participants && (
                      <div>👥 Max {e.max_participants} osób</div>
                    )}
                  </div>
                </div>

                {e.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {e.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentUserId ? (
                    <>
                      <Button
                        variant={
                          userStatus === "interested" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleRsvp(e.id, "interested")}
                        disabled={isLoading}
                        className="flex-1 min-w-0"
                      >
                        Obserwuj
                      </Button>
                      <Button
                        variant={
                          userStatus === "attending" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleRsvp(e.id, "attending")}
                        disabled={isLoading}
                        className="flex-1 min-w-0"
                      >
                        Biorę udział
                      </Button>
                    </>
                  ) : (
                    <Link href="/l" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Zaloguj się aby dołączyć
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" size="sm" asChild className="px-3">
                    <a
                      href={`/w/${e.slug || e.id}/ical`}
                      target="_blank"
                      rel="noreferrer"
                      title="Dodaj do kalendarza"
                    >
                      📅
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="px-3">
                    <Link
                      href={`/w/${e.slug || e.id}`}
                      title="Zobacz szczegóły"
                    >
                      📋
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {items.length === 0 && (
          <div className="text-center text-muted-foreground py-12 w-full">
            Brak nadchodzących wydarzeń.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Utwórz wydarzenie</DialogTitle>
            <DialogDescription>
              To wydarzenie będzie powiązane ze społecznością i podlega jej
              zasadom.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <div className="text-sm font-medium mb-1">Tytuł</div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Spotkanie społeczności"
              />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Opis</div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium mb-1">Start</div>
                <Input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">
                  Koniec (opcjonalnie)
                </div>
                <Input
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <div className="text-sm font-medium mb-1">Strefa czasowa</div>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Miasto</div>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Kraj</div>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <div className="text-sm font-medium mb-1">Kategoria</div>
                <Select
                  value={category}
                  onValueChange={(v: Category) => setCategory(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pride">Pride</SelectItem>
                    <SelectItem value="support">Wsparcie</SelectItem>
                    <SelectItem value="social">Spotkanie</SelectItem>
                    <SelectItem value="activism">Aktywizm</SelectItem>
                    <SelectItem value="education">Edukacja</SelectItem>
                    <SelectItem value="other">Inne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-4">
                <label className="text-sm">
                  <input
                    type="checkbox"
                    checked={isOnline}
                    onChange={(e) => setIsOnline(e.target.checked)}
                  />{" "}
                  Online
                </label>
                <label className="text-sm">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                  />{" "}
                  Darmowe
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={createEvent} disabled={loading || !isMember}>
                {loading ? "Tworzenie…" : "Utwórz"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
