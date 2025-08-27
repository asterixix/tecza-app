"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import type {
  PostgrestError,
  PostgrestSingleResponse,
} from "@supabase/supabase-js"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input as FileInput } from "@/components/ui/input"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { slugify } from "@/lib/utils"
import { friendlyMessage, normalizeSupabaseError } from "@/lib/errors"

interface EventRow {
  id: string
  slug?: string | null
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  city: string | null
  country: string | null
  category: string
  is_online: boolean
  is_free: boolean
  cover_image_url: string | null
  organizer_id: string
  max_participants: number | null
}

export default function EventsPage() {
  const supabase = getSupabase()
  const [items, setItems] = useState<EventRow[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [participations, setParticipations] = useState<Record<string, string>>(
    {},
  )
  const [savingRsvp, setSavingRsvp] = useState<string | null>(null)
  // Create event dialog state
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [timezone, setTimezone] = useState("Europe/Warsaw")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [category, setCategory] = useState<
    "pride" | "support" | "social" | "activism" | "education" | "other"
  >("other")
  const [isOnline, setIsOnline] = useState(false)
  const [isFree, setIsFree] = useState(true)
  const [loading, setLoading] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loadError, setLoadError] = useState<null | {
    message: string
    code?: string
    hint?: string | null
    details?: string | null
  }>(null)

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const now = new Date().toISOString()
      const { data, error, status, statusText } = await supabase
        .from("events")
        .select(
          "id,slug,title,description,start_date,end_date,city,country,category,is_online,is_free,cover_image_url,organizer_id,max_participants",
        )
        .gte("start_date", now)
        .order("start_date", { ascending: true })
        .limit(50)
      if (error) {
        const err = normalizeSupabaseError(
          error,
          "Nie udało się pobrać wydarzeń",
          { status, statusText },
        )
        setLoadError(err)
        toast.error(friendlyMessage(err))
      }
      setItems(data || [])

      // Load current user and their participations
      const { data: user } = await supabase.auth.getUser()
      setCurrentUser(user.user)

      if (user.user && data?.length) {
        const eventIds = data.map((e) => e.id)
        const { data: parts } = await supabase
          .from("event_participations")
          .select("event_id,status")
          .eq("user_id", user.user.id)
          .in("event_id", eventIds)

        const participationMap: Record<string, string> = {}
        parts?.forEach((p) => {
          participationMap[p.event_id] = p.status
        })
        setParticipations(participationMap)
      }
    }
    load()
  }, [supabase])

  async function handleRsvp(eventId: string, newStatus: string) {
    if (!supabase || !currentUser) return
    setSavingRsvp(eventId)
    try {
      const { error } = await supabase
        .from("event_participations")
        .upsert(
          { event_id: eventId, user_id: currentUser.id, status: newStatus },
          { onConflict: "event_id,user_id" },
        )

      if (error) throw error

      setParticipations((prev) => ({
        ...prev,
        [eventId]: newStatus,
      }))
      toast.success("Zapisano status")
    } catch (e) {
      console.error(e)
      toast.error("Nie udało się zapisać statusu")
    } finally {
      setSavingRsvp(null)
    }
  }

  async function createEvent() {
    if (!supabase) return toast.error("Brak konfiguracji Supabase")
    if (!title.trim() || !start)
      return toast.error("Podaj tytuł i datę rozpoczęcia")
    setLoading(true)
    try {
      const me = (await supabase.auth.getUser()).data.user
      if (!me) throw new Error("Musisz być zalogowany")
      const newId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : undefined
      const baseSlug = slugify(title)
      type InsertResult = { id: string; slug: string | null }

      // Optional: upload cover file first
      let coverUrl: string | null = null
      if (coverFile) {
        const sizeLimit = 5 * 1024 * 1024 // 5MB
        if (coverFile.size > sizeLimit) {
          throw new Error("Okładka przekracza 5MB")
        }
        const ext = coverFile.name.split(".").pop()
        const path = `${(newId || baseSlug || Date.now().toString()).toString()}/cover_${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from("event-images")
          .upload(path, coverFile)
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage
          .from("event-images")
          .getPublicUrl(path)
        coverUrl = urlData.publicUrl
      }

      // helper to perform insert with a given slug value
      const doInsert = async (
        slugValue: string | null,
      ): Promise<PostgrestSingleResponse<InsertResult>> =>
        await supabase
          .from("events")
          .insert({
            ...(newId ? { id: newId } : {}),
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
            organizer_id: me.id,
            cover_image_url: coverUrl,
            ...(slugValue ? { slug: slugValue } : {}),
          })
          .select("id,slug")
          .single()

      // First try with base slug; on conflict, retry with suffix once
      let data: InsertResult | null = null
      let error: PostgrestError | null = null
      let status: number | undefined
      let statusText: string | undefined
      ;({ data, error, status, statusText } = await doInsert(baseSlug))
      // If unique violation on slug, retry once with a random suffix
      const code = error?.code ?? error?.details ?? ""
      if (
        error &&
        (code === "23505" ||
          String(code).includes("duplicate") ||
          String(code).toLowerCase().includes("unique"))
      ) {
        const suffix = Math.random().toString(36).slice(2, 6)
        const retry = await doInsert(`${baseSlug}-${suffix}`)
        data = retry.data as InsertResult
        error = (retry.error as PostgrestError) || null
        status = retry.status
        statusText = retry.statusText
      }
      if (error) {
        const err = normalizeSupabaseError(
          error,
          "Nie udało się utworzyć wydarzenia",
          { status, statusText },
        )
        throw new Error(friendlyMessage(err))
      }
      toast.success("Wydarzenie utworzone")
      setOpen(false)
      // reset form
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
      // navigate
      window.location.href = `/w/${data!.slug || data!.id}`
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Nie udało się utworzyć wydarzenia"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold flex-1">Wydarzenia</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpen(true)}>Utwórz</Button>
        </div>
      </div>
      {loadError ? (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm">
          <div className="font-semibold">Nie udało się załadować wydarzeń</div>
          <div className="mt-1">{loadError.message}</div>
          {loadError.code ? (
            <div className="mt-1 opacity-80">Kod: {loadError.code}</div>
          ) : null}
          {loadError.hint ? (
            <div className="mt-1 opacity-80">Wskazówka: {loadError.hint}</div>
          ) : null}
          {loadError.details ? (
            <div className="mt-1 opacity-80">
              Szczegóły: {loadError.details}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <Card
              key={e.id}
              className="overflow-hidden hover:shadow-lg transition-shadow -py-6"
            >
              <div className="relative h-48 overflow-hidden">
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

              <CardContent className="space-y-3 pb-4">
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
                  {currentUser ? (
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
                        👀
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
                        ✋
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
      </div>

      {/* Create Event Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Utwórz wydarzenie</DialogTitle>
            <DialogDescription>
              Wypełnij pola, aby dodać wydarzenie. Wydarzenia są widoczne
              publicznie, chyba że wybierzesz inną widoczność w edycji.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <div className="text-sm font-medium mb-1">
                Okładka (opcjonalnie)
              </div>
              <FileInput
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
              <p className="mt-1 text-xs text-muted-foreground">Maks. 5MB</p>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Tytuł</div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Pride Warszawa"
              />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Opis</div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Szczegóły wydarzenia"
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
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="np. Warszawa"
                />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Kraj</div>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="np. Poland"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <div className="text-sm font-medium mb-1">Kategoria</div>
                <Select
                  value={category}
                  onValueChange={(
                    v:
                      | "pride"
                      | "support"
                      | "social"
                      | "activism"
                      | "education"
                      | "other",
                  ) => setCategory(v)}
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
              <Button onClick={createEvent} disabled={loading}>
                {loading ? "Tworzenie…" : "Utwórz"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
