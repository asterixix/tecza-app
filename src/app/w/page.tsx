"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Wifi,
  Plus,
  Search,
  Filter,
  SortAsc,
  TrendingUp,
  Bookmark,
  Share2,
  MoreHorizontal,
  Eye,
  Zap,
  Download,
  ExternalLink,
} from "lucide-react"

interface EventRow {
  id: string
  slug?: string | null
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location: string | null
  coordinates: unknown | null
  category: string
  is_online: boolean
  is_free: boolean
  cover_image_url: string | null
  organizer_id: string
  max_participants: number | null
  is_bookmarked?: boolean
  is_attending?: boolean
  is_interested?: boolean
  participants_count?: number
  engagement_score?: number
  recent_activity?: string
  community_id?: string | null
  community_name?: string | null
}

type EventSortOption =
  | "start_date"
  | "newest"
  | "oldest"
  | "popular"
  | "trending"
  | "alphabetical"
type EventFilterOption =
  | "all"
  | "online"
  | "offline"
  | "free"
  | "paid"
  | "attending"
  | "interested"
  | "bookmarked"
type EventCategory =
  | "pride"
  | "support"
  | "social"
  | "activism"
  | "education"
  | "other"

export default function EventsPage() {
  const supabase = getSupabase()
  const [items, setItems] = useState<EventRow[]>([])
  const [filteredItems, setFilteredItems] = useState<EventRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<EventSortOption>("start_date")
  const [filterOption, setFilterOption] = useState<EventFilterOption>("all")
  const [selectedCategory, setSelectedCategory] = useState<
    EventCategory | "all"
  >("all")
  const [showFilters, setShowFilters] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const [participations, setParticipations] = useState<Record<string, string>>(
    {},
  )
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set())
  const [savingRsvp, setSavingRsvp] = useState<string | null>(null)
  // Create event dialog state
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [timezone, setTimezone] = useState("Europe/Warsaw")
  // Deprecated: city/country replaced by OSM picker
  // OSM search state (replaces city/country)
  const [locQuery, setLocQuery] = useState("")
  const [locResults, setLocResults] = useState<
    Array<{
      display_name: string
      lat: string
      lon: string
      boundingbox?: [string, string, string, string]
    }>
  >([])
  const [locLoading, setLocLoading] = useState(false)
  const [selectedLocName, setSelectedLocName] = useState<string>("")
  const [selectedCoords, setSelectedCoords] = useState<
    | null
    | {
        lat: number
        lon: number
      }
    | [number, number, number, number]
    | { bbox: [number, number, number, number] }
  >(null)
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

      try {
        // Load events with enhanced data
        const { data, error, status, statusText } = await supabase
          .from("events")
          .select(
            `
            id,slug,title,description,start_date,end_date,location,coordinates,category,
            is_online,is_free,cover_image_url,organizer_id,max_participants,community_id,
            communities(name)
          `,
          )
          .gte("start_date", now)
          .order("start_date", { ascending: true })
          .limit(100)

        if (error) {
          const err = normalizeSupabaseError(
            error,
            "Nie udało się pobrać wydarzeń",
            { status, statusText },
          )
          setLoadError(err)
          toast.error(friendlyMessage(err))
          return
        }

        const events = data || []

        // Load current user and their data
        const { data: user } = await supabase.auth.getUser()
        setCurrentUser(user.user)

        if (user.user && events.length) {
          const eventIds = events.map((e) => e.id)

          // Load participations
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

          // Load bookmarks
          const { data: bookmarks } = await supabase
            .from("event_bookmarks")
            .select("event_id")
            .eq("user_id", user.user.id)
            .in("event_id", eventIds)

          const bookmarkSet = new Set(bookmarks?.map((b) => b.event_id) || [])
          setUserBookmarks(bookmarkSet)

          // Enhance events with user data
          const enhancedEvents = events.map((event) => ({
            ...event,
            is_bookmarked: bookmarkSet.has(event.id),
            is_attending: participationMap[event.id] === "attending",
            is_interested: participationMap[event.id] === "interested",
            participants_count: Math.floor(Math.random() * 100), // Placeholder
            engagement_score: Math.floor(Math.random() * 100), // Placeholder
            recent_activity: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            community_name: event.communities?.[0]?.name || null,
          }))

          setItems(enhancedEvents)
        } else {
          setItems(events)
        }
      } catch (err) {
        console.error("Unexpected error loading events:", err)
        toast.error("Wystąpił nieoczekiwany błąd")
      }
    }
    load()
  }, [supabase])

  // Filter and sort events
  const processedEvents = useMemo(() => {
    let filtered = items

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query) ||
          event.community_name?.toLowerCase().includes(query),
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Type filter
    if (filterOption !== "all") {
      if (filterOption === "online") {
        filtered = filtered.filter((event) => event.is_online)
      } else if (filterOption === "offline") {
        filtered = filtered.filter((event) => !event.is_online)
      } else if (filterOption === "free") {
        filtered = filtered.filter((event) => event.is_free)
      } else if (filterOption === "paid") {
        filtered = filtered.filter((event) => !event.is_free)
      } else if (filterOption === "attending") {
        filtered = filtered.filter((event) => event.is_attending)
      } else if (filterOption === "interested") {
        filtered = filtered.filter((event) => event.is_interested)
      } else if (filterOption === "bookmarked") {
        filtered = filtered.filter((event) => event.is_bookmarked)
      }
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "start_date":
          return (
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          )
        case "newest":
          return (
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          )
        case "oldest":
          return (
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          )
        case "popular":
          return (b.participants_count || 0) - (a.participants_count || 0)
        case "trending":
          return (b.engagement_score || 0) - (a.engagement_score || 0)
        case "alphabetical":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return sorted
  }, [items, searchQuery, selectedCategory, filterOption, sortOption])

  // Update filtered items when processed events change
  useEffect(() => {
    setFilteredItems(processedEvents)
  }, [processedEvents])

  // Event actions
  const handleBookmarkEvent = useCallback(
    async (eventId: string) => {
      if (!supabase || !currentUser) return

      try {
        const isBookmarked = userBookmarks.has(eventId)

        if (isBookmarked) {
          // Remove bookmark
          const { error } = await supabase
            .from("event_bookmarks")
            .delete()
            .eq("event_id", eventId)
            .eq("user_id", currentUser.id)

          if (error) {
            console.error("Error removing bookmark:", error)
            toast.error("Nie udało się usunąć zakładki")
            return
          }

          setUserBookmarks((prev) => {
            const newSet = new Set(prev)
            newSet.delete(eventId)
            return newSet
          })

          toast.success("Usunięto zakładkę")
        } else {
          // Add bookmark
          const { error } = await supabase.from("event_bookmarks").insert({
            event_id: eventId,
            user_id: currentUser.id,
          })

          if (error) {
            console.error("Error adding bookmark:", error)
            toast.error("Nie udało się dodać zakładki")
            return
          }

          setUserBookmarks((prev) => new Set([...prev, eventId]))
          toast.success("Dodano zakładkę")
        }

        // Update local state
        setItems((prev) =>
          prev.map((event) =>
            event.id === eventId
              ? { ...event, is_bookmarked: !isBookmarked }
              : event,
          ),
        )
      } catch (err) {
        console.error("Unexpected error bookmarking event:", err)
        toast.error("Wystąpił nieoczekiwany błąd")
      }
    },
    [supabase, currentUser, userBookmarks],
  )

  const handleShareEvent = useCallback(async (event: EventRow) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description || "",
          url: `${window.location.origin}/w/${event.slug || event.id}`,
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${window.location.origin}/w/${event.slug || event.id}`,
        )
        toast.success("Link skopiowany do schowka")
      }
    } catch (err) {
      console.error("Error sharing event:", err)
      toast.error("Nie udało się udostępnić wydarzenia")
    }
  }, [])

  // OSM search helpers (manual, throttled, cached per Nominatim policy)
  const lastSearchRef = useRef<number>(0)
  const cacheRef = useRef<
    Record<
      string,
      {
        t: number
        r: Array<{
          display_name: string
          lat: string
          lon: string
          boundingbox?: [string, string, string, string]
        }>
      }
    >
  >({})
  const [searchNote, setSearchNote] = useState<string>("")

  useEffect(() => {
    // load cache from localStorage on mount
    try {
      const raw = localStorage.getItem("osm_search_cache_v1")
      if (raw) cacheRef.current = JSON.parse(raw)
    } catch {
      // ignore
    }
  }, [])

  function saveCache() {
    try {
      localStorage.setItem(
        "osm_search_cache_v1",
        JSON.stringify(cacheRef.current),
      )
    } catch {
      // ignore
    }
  }

  async function performOsmSearch() {
    const q = locQuery.trim()
    setSearchNote("")
    if (q.length < 3) {
      setLocResults([])
      setSearchNote("Wpisz co najmniej 3 znaki.")
      return
    }
    // 24h cache
    const key = q.toLowerCase()
    const now = Date.now()
    const cached = cacheRef.current[key]
    if (cached && now - cached.t < 24 * 60 * 60 * 1000) {
      setLocResults(cached.r)
      return
    }
    // throttle 1 req/s
    const since = now - lastSearchRef.current
    if (since < 1000) {
      setSearchNote("Poczekaj chwilę przed kolejnym wyszukiwaniem…")
      await new Promise((res) => setTimeout(res, 1000 - since))
    }
    lastSearchRef.current = Date.now()
    const ctrl = new AbortController()
    try {
      setLocLoading(true)
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(q)}`
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Accept-Language": navigator.language || "pl",
        },
        signal: ctrl.signal,
      })
      if (res.status === 429) {
        const retry = res.headers.get("Retry-After")
        setSearchNote(
          retry
            ? `Przekroczono limit. Spróbuj ponownie za ${retry}s.`
            : "Przekroczono limit zapytań. Spróbuj ponownie później.",
        )
        setLocResults([])
        return
      }
      if (!res.ok) throw new Error("Search failed")
      const json = (await res.json()) as Array<{
        display_name: string
        lat: string
        lon: string
        boundingbox?: [string, string, string, string]
      }>
      setLocResults(json)
      cacheRef.current[key] = { t: Date.now(), r: json }
      saveCache()
    } catch {
      setLocResults([])
    } finally {
      setLocLoading(false)
    }
  }

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
    if (!isOnline && !selectedLocName) {
      return toast.error("Wybierz lokalizację (wyszukaj w OpenStreetMap)")
    }
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
            // location & coordinates
            location: isOnline ? "Online" : selectedLocName || null,
            coordinates: isOnline
              ? null
              : Array.isArray(selectedCoords)
                ? (selectedCoords as [number, number, number, number])
                : typeof selectedCoords === "object" &&
                    selectedCoords !== null &&
                    "lat" in (selectedCoords as Record<string, unknown>) &&
                    "lon" in (selectedCoords as Record<string, unknown>)
                  ? (selectedCoords as { lat: number; lon: number })
                  : null,
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
      setLocQuery("")
      setLocResults([])
      setSelectedLocName("")
      setSelectedCoords(null)
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
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      {/* Enhanced Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Wydarzenia</h1>
            <p className="text-muted-foreground">
              Odkrywaj, dołączaj i twórz wydarzenia w społeczności LGBTQ+.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Utwórz wydarzenie
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj wydarzeń..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtry
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <SortAsc className="h-4 w-4" />
                    {sortOption === "start_date" && "Data"}
                    {sortOption === "newest" && "Najnowsze"}
                    {sortOption === "oldest" && "Najstarsze"}
                    {sortOption === "popular" && "Popularne"}
                    {sortOption === "trending" && "Trending"}
                    {sortOption === "alphabetical" && "Alfabetycznie"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortOption("start_date")}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Data wydarzenia
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("newest")}>
                    <Clock className="h-4 w-4 mr-2" />
                    Najnowsze
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("popular")}>
                    <Users className="h-4 w-4 mr-2" />
                    Popularne
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("trending")}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortOption("alphabetical")}
                  >
                    <SortAsc className="h-4 w-4 mr-2" />
                    Alfabetycznie
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Typ:</span>
                  <div className="flex items-center gap-2">
                    {(
                      [
                        "all",
                        "online",
                        "offline",
                        "free",
                        "paid",
                        "attending",
                        "interested",
                        "bookmarked",
                      ] as EventFilterOption[]
                    ).map((option) => (
                      <Button
                        key={option}
                        variant={
                          filterOption === option ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setFilterOption(option)}
                        className="text-xs"
                      >
                        {option === "all" && "Wszystkie"}
                        {option === "online" && "Online"}
                        {option === "offline" && "Offline"}
                        {option === "free" && "Darmowe"}
                        {option === "paid" && "Płatne"}
                        {option === "attending" && "Biorę udział"}
                        {option === "interested" && "Interesuje mnie"}
                        {option === "bookmarked" && "Zakładki"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Kategoria:</span>
                <div className="flex items-center gap-2">
                  {(
                    [
                      "all",
                      "pride",
                      "support",
                      "social",
                      "activism",
                      "education",
                      "other",
                    ] as (EventCategory | "all")[]
                  ).map((option) => (
                    <Button
                      key={option}
                      variant={
                        selectedCategory === option ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(option)}
                      className="text-xs"
                    >
                      {option === "all" && "Wszystkie"}
                      {option === "pride" && "Pride"}
                      {option === "support" && "Wsparcie"}
                      {option === "social" && "Społeczne"}
                      {option === "activism" && "Aktywizm"}
                      {option === "education" && "Edukacja"}
                      {option === "other" && "Inne"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Znaleziono {filteredItems.length} z {items.length} wydarzeń
            </p>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Ładowanie...
              </div>
            )}
          </div>
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
        {filteredItems.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border bg-card p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-lg font-semibold mb-2">
              {items.length === 0 ? "Brak wydarzeń" : "Nie znaleziono wydarzeń"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {items.length === 0
                ? "Nie ma jeszcze żadnych wydarzeń. Bądź pierwszy i utwórz własne!"
                : "Spróbuj zmienić kryteria wyszukiwania lub filtrowania."}
            </p>
            <Button onClick={() => setOpen(true)}>Utwórz wydarzenie</Button>
          </div>
        ) : (
          filteredItems.map((e) => {
            const userStatus = participations[e.id]
            const isLoading = savingRsvp === e.id
            const startDate = new Date(e.start_date)
            const endDate = e.end_date ? new Date(e.end_date) : null
            const location = e.is_online
              ? "Online"
              : e.location || "Nieznana lokalizacja"

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
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        e.is_free
                          ? "bg-green-500 text-white"
                          : "bg-orange-500 text-white"
                      }`}
                    >
                      {e.is_free ? "Darmowe" : "Płatne"}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => handleBookmarkEvent(e.id)}
                        >
                          <Bookmark className="h-4 w-4 mr-2" />
                          {e.is_bookmarked ? "Usuń zakładkę" : "Dodaj zakładkę"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShareEvent(e)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Udostępnij
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <a
                            href={`/w/${e.slug || e.id}/ical`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Dodaj do kalendarza
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardContent className="space-y-3 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg leading-tight line-clamp-2 flex-1">
                        {e.title}
                      </h3>
                      {e.is_bookmarked && (
                        <Bookmark className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                      {e.is_attending && (
                        <Badge variant="secondary" className="text-xs">
                          Biorę udział
                        </Badge>
                      )}
                      {e.is_interested && (
                        <Badge variant="outline" className="text-xs">
                          Interesuje mnie
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {e.category === "pride" && "Pride"}
                        {e.category === "support" && "Wsparcie"}
                        {e.category === "social" && "Społeczne"}
                        {e.category === "activism" && "Aktywizm"}
                        {e.category === "education" && "Edukacja"}
                        {e.category === "other" && "Inne"}
                      </Badge>
                      {e.community_name && (
                        <Badge variant="secondary" className="text-xs">
                          {e.community_name}
                        </Badge>
                      )}
                      {e.engagement_score && e.engagement_score > 70 && (
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-yellow-600">
                            Popularne
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
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
                      </div>
                      <div className="flex items-center gap-1">
                        {e.is_online ? (
                          <Wifi className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        {location}
                      </div>
                      <div className="flex items-center gap-4">
                        {e.participants_count && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {e.participants_count} osób
                          </div>
                        )}
                        {e.max_participants && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Max {e.max_participants} osób
                          </div>
                        )}
                      </div>
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
                          className="flex-1 min-w-0 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Interesuje
                        </Button>
                        <Button
                          variant={
                            userStatus === "attending" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handleRsvp(e.id, "attending")}
                          disabled={isLoading}
                          className="flex-1 min-w-0 flex items-center gap-1"
                        >
                          <Users className="h-4 w-4" />
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

                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="px-3"
                    >
                      <Link
                        href={`/w/${e.slug || e.id}`}
                        title="Zobacz szczegóły"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Szczegóły
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
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
              <div className="md:col-span-2">
                <div className="text-sm font-medium mb-1">
                  Lokalizacja (OSM)
                </div>
                <div className="flex gap-2">
                  <Input
                    value={locQuery}
                    onChange={(e) => setLocQuery(e.target.value)}
                    placeholder="Szukaj miejsca…"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={performOsmSearch}
                  >
                    Szukaj
                  </Button>
                </div>
                {locLoading ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    Szukanie…
                  </div>
                ) : searchNote ? (
                  <div className="text-xs text-muted-foreground mt-1">
                    {searchNote}
                  </div>
                ) : null}
                {locResults.length > 0 && (
                  <div className="mt-1 max-h-40 overflow-auto rounded border bg-popover text-popover-foreground text-sm">
                    {locResults.map((r, idx) => (
                      <button
                        key={`${r.display_name}-${idx}`}
                        type="button"
                        className="w-full text-left px-2 py-1 hover:bg-muted"
                        onClick={() => {
                          setSelectedLocName(r.display_name)
                          if (r.boundingbox && r.boundingbox.length === 4) {
                            const bb = r.boundingbox.map((s) =>
                              parseFloat(s),
                            ) as [number, number, number, number]
                            // Nominatim bbox format: [south, north, west, east]
                            // Our embed expects [minLon, minLat, maxLon, maxLat]
                            const south = bb[0]
                            const north = bb[1]
                            const west = bb[2]
                            const east = bb[3]
                            setSelectedCoords([west, south, east, north])
                          } else {
                            setSelectedCoords({
                              lat: parseFloat(r.lat),
                              lon: parseFloat(r.lon),
                            })
                          }
                          setLocResults([])
                          setLocQuery(r.display_name)
                        }}
                      >
                        {r.display_name}
                      </button>
                    ))}
                  </div>
                )}
                {selectedLocName && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Wybrano: {selectedLocName}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-2">
                  Dane wyszukiwania: © OpenStreetMap & Nominatim
                </div>
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
