"use client"

import Link from "next/link"
import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Users,
  MapPin,
  Globe,
  Lock,
  Shield,
  Calendar,
  MessageCircle,
  Search,
  Filter,
  SortAsc,
  TrendingUp,
  Bookmark,
  Plus,
  Settings,
  MoreHorizontal,
  Clock,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { slugify } from "@/lib/utils"
import {
  friendlyMessage,
  normalizeSupabaseError,
  withTimeout,
} from "@/lib/errors"
import type {
  PostgrestError,
  PostgrestSingleResponse,
} from "@supabase/supabase-js"
import Image from "next/image"

type Community = {
  id: string
  slug?: string | null
  name: string
  description: string | null
  avatar_url: string | null
  cover_image_url: string | null
  type: "public" | "private" | "restricted"
  category: string | null
  members_count: number
  city: string | null
  country: string | null
  has_chat: boolean
  has_events: boolean
  created_at: string
  is_member?: boolean
  is_bookmarked?: boolean
  engagement_score?: number
  recent_activity?: string
}

type CommunitySortOption =
  | "members"
  | "newest"
  | "oldest"
  | "trending"
  | "alphabetical"
type CommunityFilterOption =
  | "all"
  | "public"
  | "private"
  | "restricted"
  | "local"
  | "joined"
type CommunityCategory =
  | "support"
  | "social"
  | "activism"
  | "hobby"
  | "local"
  | "professional"
  | "other"

export default function CommunitiesPage() {
  const supabase = getSupabase()
  const router = useRouter()
  const [items, setItems] = useState<Community[]>([])
  const [filteredItems, setFilteredItems] = useState<Community[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<CommunitySortOption>("members")
  const [filterOption, setFilterOption] = useState<CommunityFilterOption>("all")
  const [selectedCategory, setSelectedCategory] = useState<
    CommunityCategory | "all"
  >("all")
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set())

  // Create community dialog state
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"public" | "private" | "restricted">(
    "public",
  )
  const [category, setCategory] = useState<CommunityCategory>("social")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")

  useEffect(() => {
    async function load() {
      if (!supabase) return
      setLoading(true)

      try {
        // Load communities
        const { data, error, status, statusText } = await withTimeout(
          supabase
            .from("communities")
            .select(
              "id,slug,name,description,avatar_url,cover_image_url,type,category,members_count,city,country,has_chat,has_events,created_at",
            )
            .eq("status", "active")
            .order("members_count", { ascending: false })
            .limit(100),
          15000,
        )

        if (error) {
          const err = normalizeSupabaseError(
            error,
            "Nie udało się pobrać listy społeczności",
            { status, statusText },
          )
          console.error("Communities load error", err)
          toast.error(friendlyMessage(err))
          return
        }

        const communities = data || []

        // Load user memberships and bookmarks
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          // Get user memberships
          const { data: memberships } = await supabase
            .from("community_memberships")
            .select("community_id")
            .eq("user_id", user.id)

          const membershipSet = new Set(
            memberships?.map((m) => m.community_id) || [],
          )

          // Get user bookmarks (if bookmarks table exists)
          const { data: bookmarks } = await supabase
            .from("community_bookmarks")
            .select("community_id")
            .eq("user_id", user.id)

          const bookmarkSet = new Set(
            bookmarks?.map((b) => b.community_id) || [],
          )
          setUserBookmarks(bookmarkSet)

          // Enhance communities with user data
          const enhancedCommunities = communities.map((community) => ({
            ...community,
            is_member: membershipSet.has(community.id),
            is_bookmarked: bookmarkSet.has(community.id),
            engagement_score: Math.floor(Math.random() * 100), // Placeholder for engagement score
            recent_activity: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }))

          setItems(enhancedCommunities)
        } else {
          setItems(communities)
        }
      } catch (err) {
        console.error("Unexpected error loading communities:", err)
        toast.error("Wystąpił nieoczekiwany błąd")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  // Filter and sort communities
  const processedCommunities = useMemo(() => {
    let filtered = items

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (community) =>
          community.name.toLowerCase().includes(query) ||
          community.description?.toLowerCase().includes(query) ||
          community.city?.toLowerCase().includes(query) ||
          community.country?.toLowerCase().includes(query),
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (community) => community.category === selectedCategory,
      )
    }

    // Type filter
    if (filterOption !== "all") {
      if (filterOption === "joined") {
        filtered = filtered.filter((community) => community.is_member)
      } else if (filterOption === "local") {
        filtered = filtered.filter(
          (community) => community.city || community.country,
        )
      } else {
        filtered = filtered.filter(
          (community) => community.type === filterOption,
        )
      }
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "members":
          return b.members_count - a.members_count
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        case "trending":
          return (b.engagement_score || 0) - (a.engagement_score || 0)
        case "alphabetical":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return sorted
  }, [items, searchQuery, selectedCategory, filterOption, sortOption])

  // Update filtered items when processed communities change
  useEffect(() => {
    setFilteredItems(processedCommunities)
  }, [processedCommunities])

  // Community actions
  const handleJoinCommunity = useCallback(
    async (communityId: string) => {
      if (!supabase) return

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          toast.error("Musisz być zalogowany, aby dołączyć do społeczności")
          return
        }

        const { error } = await supabase.from("community_memberships").insert({
          community_id: communityId,
          user_id: user.id,
          role: "member",
        })

        if (error) {
          console.error("Error joining community:", error)
          toast.error("Nie udało się dołączyć do społeczności")
          return
        }

        // Update local state
        setItems((prev) =>
          prev.map((community) =>
            community.id === communityId
              ? {
                  ...community,
                  is_member: true,
                  members_count: community.members_count + 1,
                }
              : community,
          ),
        )

        toast.success("Dołączono do społeczności!")
      } catch (err) {
        console.error("Unexpected error joining community:", err)
        toast.error("Wystąpił nieoczekiwany błąd")
      }
    },
    [supabase],
  )

  const handleBookmarkCommunity = useCallback(
    async (communityId: string) => {
      if (!supabase) return

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          toast.error("Musisz być zalogowany, aby zapisać społeczność")
          return
        }

        const isBookmarked = userBookmarks.has(communityId)

        if (isBookmarked) {
          // Remove bookmark
          const { error } = await supabase
            .from("community_bookmarks")
            .delete()
            .eq("community_id", communityId)
            .eq("user_id", user.id)

          if (error) {
            console.error("Error removing bookmark:", error)
            toast.error("Nie udało się usunąć zakładki")
            return
          }

          setUserBookmarks((prev) => {
            const newSet = new Set(prev)
            newSet.delete(communityId)
            return newSet
          })

          toast.success("Usunięto zakładkę")
        } else {
          // Add bookmark
          const { error } = await supabase.from("community_bookmarks").insert({
            community_id: communityId,
            user_id: user.id,
          })

          if (error) {
            console.error("Error adding bookmark:", error)
            toast.error("Nie udało się dodać zakładki")
            return
          }

          setUserBookmarks((prev) => new Set([...prev, communityId]))
          toast.success("Dodano zakładkę")
        }

        // Update local state
        setItems((prev) =>
          prev.map((community) =>
            community.id === communityId
              ? { ...community, is_bookmarked: !isBookmarked }
              : community,
          ),
        )
      } catch (err) {
        console.error("Unexpected error bookmarking community:", err)
        toast.error("Wystąpił nieoczekiwany błąd")
      }
    },
    [supabase, userBookmarks],
  )

  async function createCommunity() {
    if (!supabase) return toast.error("Brak konfiguracji Supabase")
    if (!name.trim()) return toast.error("Podaj nazwę społeczności")
    setLoading(true)
    try {
      const me = (await supabase.auth.getUser()).data.user
      if (!me) throw new Error("Musisz być zalogowany")
      // Insert minimal payload aligned with schema and RLS (owner_id must equal auth.uid())
      // Generate id client-side to avoid relying on DB default (gen_random_uuid) if extension is missing
      const newId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : undefined
      const baseSlug = slugify(name)
      type Created = { id: string; slug: string | null; status: string | null }
      const doInsert = async (
        slugValue: string | null,
      ): Promise<PostgrestSingleResponse<Created>> =>
        await withTimeout(
          supabase
            .from("communities")
            .insert({
              ...(newId ? { id: newId } : {}),
              name,
              description,
              type,
              category,
              city: city || null,
              country: country || null,
              is_local: !!(city || country),
              owner_id: me.id,
              ...(slugValue ? { slug: slugValue } : {}),
            })
            .select("id,slug,status")
            .single(),
          15000,
        )

      let created: Created | null = null
      let createErr: PostgrestError | null = null
      let status: number | undefined
      let statusText: string | undefined
      ;({
        data: created,
        error: createErr,
        status,
        statusText,
      } = await doInsert(baseSlug))

      const code = createErr?.code ?? createErr?.details ?? ""
      if (
        createErr &&
        (code === "23505" ||
          String(code).includes("duplicate") ||
          String(code).toLowerCase().includes("unique"))
      ) {
        const suffix = Math.random().toString(36).slice(2, 6)
        const retry = await doInsert(`${baseSlug}-${suffix}`)
        created = retry.data as Created
        createErr = (retry.error as PostgrestError) || null
        status = retry.status
        statusText = retry.statusText
      }

      if (createErr) {
        const err = normalizeSupabaseError(
          createErr,
          "Nie udało się utworzyć społeczności",
          { status, statusText },
        )
        console.error("Create community error", err)
        throw new Error(friendlyMessage(err))
      }

      // Auto-join only when community is active
      if (created?.status === "active") {
        const {
          error: memberUpsertErr,
          status: memberUpsertStatus,
          statusText: memberUpsertStatusText,
        } = await supabase
          .from("community_memberships")
          .upsert(
            { community_id: created!.id, user_id: me.id, role: "owner" },
            { onConflict: "community_id,user_id" },
          )
        if (memberUpsertErr) {
          const err = normalizeSupabaseError(
            memberUpsertErr,
            "Nie udało się dodać właściciela do społeczności",
            { status: memberUpsertStatus, statusText: memberUpsertStatusText },
          )
          throw new Error(friendlyMessage(err))
        }
        toast.success("Społeczność utworzona")
      } else {
        toast.info(
          "Wysłano do moderacji. Twoja społeczność zostanie sprawdzona przez moderatora.",
        )
      }
      setOpen(false)
      // Reset form
      setName("")
      setDescription("")
      setType("public")
      setCity("")
      setCountry("")
      // Navigate to created community
      router.push(`/c/${created!.slug || created!.id}`)
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się utworzyć społeczności"
      toast.error(msg)
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
            <h1 className="text-3xl font-bold">Społeczności</h1>
            <p className="text-muted-foreground">
              Dołącz do lokalnych i tematycznych grup. Odkrywaj, rozmawiaj,
              twórz wydarzenia.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Utwórz społeczność
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj społeczności..."
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
                    {sortOption === "members" && "Członkowie"}
                    {sortOption === "newest" && "Najnowsze"}
                    {sortOption === "oldest" && "Najstarsze"}
                    {sortOption === "trending" && "Popularne"}
                    {sortOption === "alphabetical" && "Alfabetycznie"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortOption("members")}>
                    <Users className="h-4 w-4 mr-2" />
                    Najwięcej członków
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("newest")}>
                    <Clock className="h-4 w-4 mr-2" />
                    Najnowsze
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOption("trending")}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Popularne
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
                        "public",
                        "private",
                        "restricted",
                        "local",
                        "joined",
                      ] as CommunityFilterOption[]
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
                        {option === "public" && "Publiczne"}
                        {option === "private" && "Prywatne"}
                        {option === "restricted" && "Ograniczone"}
                        {option === "local" && "Lokalne"}
                        {option === "joined" && "Dołączone"}
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
                      "support",
                      "social",
                      "activism",
                      "hobby",
                      "local",
                      "professional",
                      "other",
                    ] as (CommunityCategory | "all")[]
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
                      {option === "support" && "Wsparcie"}
                      {option === "social" && "Społeczne"}
                      {option === "activism" && "Aktywizm"}
                      {option === "hobby" && "Hobby"}
                      {option === "local" && "Lokalne"}
                      {option === "professional" && "Zawodowe"}
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
              Znaleziono {filteredItems.length} z {items.length} społeczności
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border bg-card p-8 text-center">
            <Image
              src="/icons/tecza-icons/1.svg"
              alt=""
              width={48}
              height={48}
              className="opacity-80"
            />
            <h2 className="mt-3 text-lg font-semibold">
              {items.length === 0
                ? "Brak społeczności"
                : "Nie znaleziono społeczności"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length === 0
                ? "Bądź pierwszą osobą, która stworzy nową społeczność."
                : "Spróbuj zmienić kryteria wyszukiwania lub filtrowania."}
            </p>
            <Button onClick={() => setOpen(true)}>Utwórz społeczność</Button>
          </div>
        ) : (
          filteredItems.map((c) => {
            const typeIcon = {
              public: Globe,
              private: Lock,
              restricted: Shield,
            }[c.type]
            const TypeIcon = typeIcon

            return (
              <Card
                key={c.id}
                className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-xl -py-6"
              >
                <Link
                  href={`/c/${c.slug || c.id}`}
                  className="block outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Przejdź do społeczności ${c.name}`}
                >
                  {/* Cover Image with overlay */}
                  <div className="relative h-36 sm:h-40 overflow-hidden">
                    {c.cover_image_url ? (
                      <Image
                        src={c.cover_image_url}
                        alt={`${c.name} cover`}
                        className="object-cover"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        priority={false}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/35" />
                    {/* Community Type Badge and Actions */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 bg-white/90 text-gray-900 dark:bg-white/80 hover:bg-white"
                      >
                        <TypeIcon className="w-3 h-3" />
                        {c.type === "public"
                          ? "Publiczna"
                          : c.type === "private"
                            ? "Prywatna"
                            : "Ograniczona"}
                      </Badge>

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
                            onClick={() => handleBookmarkCommunity(c.id)}
                          >
                            <Bookmark className="h-4 w-4 mr-2" />
                            {c.is_bookmarked
                              ? "Usuń zakładkę"
                              : "Dodaj zakładkę"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Ustawienia
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* Avatar positioned fully within cover for mobile visibility */}
                    <div className="absolute bottom-3 left-4 pointer-events-none">
                      <div className="rounded-full bg-white dark:bg-neutral-900 p-0.5 shadow-lg">
                        <Image
                          src={c.avatar_url || "/icons/tecza-icons/1.svg"}
                          alt={`${c.name} avatar`}
                          width={72}
                          height={72}
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover"
                          priority={false}
                        />
                      </div>
                    </div>
                  </div>

                  <CardContent className="pt-4 pb-4">
                    <div className="space-y-3">
                      {/* Community Name and Category */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:underline decoration-2 decoration-primary/40">
                            {c.name}
                          </h3>
                          {c.is_bookmarked && (
                            <Bookmark className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          {c.is_member && (
                            <Badge variant="secondary" className="text-xs">
                              Członek
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {c.category && (
                            <Badge variant="outline" className="text-xs">
                              {c.category === "support" && "Wsparcie"}
                              {c.category === "social" && "Społeczne"}
                              {c.category === "activism" && "Aktywizm"}
                              {c.category === "hobby" && "Hobby"}
                              {c.category === "local" && "Lokalne"}
                              {c.category === "professional" && "Zawodowe"}
                              {c.category === "other" && "Inne"}
                            </Badge>
                          )}
                          {c.engagement_score && c.engagement_score > 70 && (
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-yellow-600">
                                Aktywna
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {c.description || "Brak opisu społeczności"}
                      </p>

                      {/* Stats and Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" aria-hidden="true" />
                          <span className="font-medium">{c.members_count}</span>
                          <span className="sr-only">członków</span>
                          <span aria-hidden="true">członków</span>
                        </div>

                        {/* Join Button */}
                        {!c.is_member && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              handleJoinCommunity(c.id)
                            }}
                            className="w-full"
                          >
                            Dołącz
                          </Button>
                        )}

                        {(c.city || c.country) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" aria-hidden="true" />
                            <span>
                              {[c.city, c.country].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}

                        {/* Features */}
                        <div className="flex items-center gap-3 text-xs">
                          {c.has_chat && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MessageCircle
                                className="w-3 h-3"
                                aria-hidden="true"
                              />
                              <span>Chat</span>
                            </div>
                          )}
                          {c.has_events && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar
                                className="w-3 h-3"
                                aria-hidden="true"
                              />
                              <span>Wydarzenia</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Community Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Utwórz społeczność</DialogTitle>
            <DialogDescription>
              Wypełnij pola poniżej, aby dodać nową społeczność. Niektóre
              zgłoszenia mogą wymagać akceptacji moderatora.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <div className="text-sm font-medium mb-1">Nazwa</div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. LGBTQ Kraków"
                aria-label="Nazwa społeczności"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Link: /c/{slugify(name) || "twoja-nazwa"}
              </p>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Opis</div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Krótki opis społeczności"
                rows={4}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium mb-1">Typ</div>
                <Select
                  value={type}
                  onValueChange={(v) =>
                    setType(v as "public" | "private" | "restricted")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Publiczna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Publiczna</SelectItem>
                    <SelectItem value="restricted">Ograniczona</SelectItem>
                    <SelectItem value="private">Prywatna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Kategoria</div>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as CommunityCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">Wsparcie</SelectItem>
                    <SelectItem value="social">Społeczne</SelectItem>
                    <SelectItem value="activism">Aktywizm</SelectItem>
                    <SelectItem value="hobby">Hobby</SelectItem>
                    <SelectItem value="local">Lokalne</SelectItem>
                    <SelectItem value="professional">Zawodowe</SelectItem>
                    <SelectItem value="other">Inne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-sm font-medium mb-1">Miasto</div>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="np. Kraków"
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={createCommunity} disabled={loading}>
                {loading ? "Tworzenie…" : "Utwórz"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
