"use client"
import { useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Heart, Loader2, Search, Edit2 } from "lucide-react"

type UUID = string

type Category = {
  id: UUID
  name: string
  slug: string
}

type Listing = {
  id: UUID
  title: string
  description: string | null
  price_cents: number | null
  currency: string
  status: "active" | "sold" | "hidden"
  condition: "new" | "like_new" | "good" | "used" | "poor" | null
  created_at: string
  owner_id: UUID
  category_id: UUID | null
}

type ListingWithImages = Listing & {
  images?: { storage_path: string; position: number }[]
}

const conditions: Array<{
  value: NonNullable<Listing["condition"]>
  label: string
}> = [
  { value: "new", label: "Nowe" },
  { value: "like_new", label: "Jak nowe" },
  { value: "good", label: "Dobre" },
  { value: "used", label: "Używane" },
  { value: "poor", label: "Słaby stan" },
]

export default function CommunityMarketplacePage() {
  const supabase = getSupabase()
  const params = useParams<{ id: string }>()
  const communityId = params?.id as UUID
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [listings, setListings] = useState<ListingWithImages[]>([])
  const [loading, setLoading] = useState(true)

  // form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("PLN")
  const [condition, setCondition] = useState<Listing["condition"]>("used")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [files, setFiles] = useState<FileList | null>(null)

  // filters state
  type FilterStatus = "active" | "sold" | "hidden" | "all"
  type FilterCondition = "all" | "new" | "like_new" | "good" | "used" | "poor"
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>(
    undefined,
  )
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("active")
  const [filterCondition, setFilterCondition] = useState<FilterCondition>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // favorites
  const [favoriteSet, setFavoriteSet] = useState<Set<string>>(new Set())
  const [meId, setMeId] = useState<string | null>(null)

  const load = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const [{ data: cats, error: catsErr }, { data: lst, error: lstErr }, me] =
        await Promise.all([
          supabase
            .from("marketplace_categories")
            .select("id,name,slug")
            .eq("community_id", communityId)
            .order("position"),
          supabase
            .from("marketplace_listings")
            .select(
              "id,title,description,price_cents,currency,status,condition,created_at,owner_id,category_id, images:marketplace_listing_images(storage_path,position)",
            )
            .eq("community_id", communityId)
            .order("created_at", { ascending: false }),
          supabase.auth.getUser(),
        ])
      if (catsErr) throw catsErr
      if (lstErr) throw lstErr
      setCategories(cats ?? [])
      const rawListings = (lst ?? []) as unknown as ListingWithImages[]

      // Apply filters client-side (simple and safe with RLS)
      let filtered = rawListings
      if (filterCategoryId)
        filtered = filtered.filter((l) => l.category_id === filterCategoryId)
      if (filterStatus !== "all")
        filtered = filtered.filter((l) => l.status === filterStatus)
      if (filterCondition !== "all")
        filtered = filtered.filter((l) => l.condition === filterCondition)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        filtered = filtered.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            (l.description ?? "").toLowerCase().includes(q),
        )
      }

      setListings(filtered)

      const uid = me.data?.user?.id ?? null
      setMeId(uid)
      if (uid && filtered.length) {
        const ids = filtered.map((l) => l.id)
        const { data: favs } = await supabase
          .from("marketplace_favorites")
          .select("listing_id")
          .eq("user_id", uid)
          .in("listing_id", ids)
        setFavoriteSet(new Set((favs ?? []).map((f) => f.listing_id as string)))
      } else {
        setFavoriteSet(new Set())
      }
    } catch {
      toast({
        title: "Błąd",
        description: "Nie udało się załadować ogłoszeń.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (communityId) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId])

  const createListing = async () => {
    if (!supabase) return
    try {
      const price_cents = price
        ? Math.round(parseFloat(price.replace(",", ".")) * 100)
        : null
      const { data: created, error } = await supabase
        .from("marketplace_listings")
        .insert({
          community_id: communityId,
          title: title.trim(),
          description: description.trim() || null,
          price_cents,
          currency,
          condition: condition ?? null,
          category_id: categoryId,
        })
        .select("id")
        .single()
      if (error) throw error

      // Upload images if selected
      const listingId = created?.id as string | undefined
      if (listingId && files && files.length) {
        const bucket = supabase.storage.from("marketplace-images")
        const uploads = Array.from(files).map(async (file, idx) => {
          const path = `${communityId}/${listingId}/${file.name}`
          const { error: upErr } = await bucket.upload(path, file, {
            upsert: true,
            cacheControl: "3600",
          })
          if (upErr) throw upErr
          const { error: imgErr } = await supabase
            .from("marketplace_listing_images")
            .insert({
              listing_id: listingId,
              storage_path: path,
              position: idx * 10,
            })
          if (imgErr) throw imgErr
        })
        try {
          await Promise.all(uploads)
        } catch {
          toast({
            title: "Uwaga",
            description:
              "Niektóre obrazy nie zostały przesłane. Upewnij się, że istnieje bucket 'marketplace-images' i RLS.",
            variant: "warning",
          })
        }
      }
      toast({ title: "Dodano ogłoszenie" })
      setTitle("")
      setDescription("")
      setPrice("")
      setCurrency("PLN")
      setCondition("used")
      setCategoryId(null)
      setFiles(null)
      await load()
    } catch {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać ogłoszenia.",
        variant: "destructive",
      })
    }
  }

  const markSold = async (id: UUID) => {
    if (!supabase) return
    try {
      const { error } = await supabase
        .from("marketplace_listings")
        .update({ status: "sold" })
        .eq("id", id)
      if (error) throw error
      await load()
    } catch {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować ogłoszenia.",
        variant: "destructive",
      })
    }
  }

  const deleteListing = async (id: UUID) => {
    if (!supabase) return
    try {
      const { error } = await supabase
        .from("marketplace_listings")
        .delete()
        .eq("id", id)
      if (error) throw error
      await load()
    } catch {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć ogłoszenia.",
        variant: "destructive",
      })
    }
  }

  const priceFmt = useMemo(
    () => new Intl.NumberFormat("pl-PL", { style: "currency", currency }),
    [currency],
  )

  const toggleFavorite = async (id: UUID) => {
    if (!supabase || !meId) return
    const liked = favoriteSet.has(id)
    try {
      if (liked) {
        await supabase
          .from("marketplace_favorites")
          .delete()
          .eq("listing_id", id)
          .eq("user_id", meId)
      } else {
        await supabase
          .from("marketplace_favorites")
          .insert({ listing_id: id, user_id: meId })
      }
      const next = new Set(favoriteSet)
      if (liked) next.delete(id)
      else next.add(id)
      setFavoriteSet(next)
      await load()
    } catch {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować ulubionych.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">Giełda społeczności</h1>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Input
              placeholder="Szukaj…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-48"
            />
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Select
            value={filterCategoryId ?? "all"}
            onValueChange={(v: string) =>
              setFilterCategoryId(v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterStatus}
            onValueChange={(v: FilterStatus) => setFilterStatus(v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="active">Aktywne</SelectItem>
              <SelectItem value="sold">Sprzedane</SelectItem>
              <SelectItem value="hidden">Ukryte</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterCondition}
            onValueChange={(v: FilterCondition) => setFilterCondition(v)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Stan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              {conditions.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => load()}
            aria-label="Odśwież listę"
          >
            Odśwież
          </Button>
        </div>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>Dodaj ogłoszenie</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Tytuł</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Np. Flaga tęczowa 90x150"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Opis</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Cena</label>
            <Input
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Waluta</label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="PLN"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Stan</label>
            <Select
              value={condition ?? undefined}
              onValueChange={(v) => setCondition(v as Listing["condition"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz stan" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm mb-1">Kategoria</label>
            <Select
              value={categoryId ?? undefined}
              onValueChange={(v) => setCategoryId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Zdjęcia</label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={createListing} disabled={!title.trim()}>
              Dodaj
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <Card key={l.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{l.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Ulubione"
                    onClick={() => toggleFavorite(l.id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${favoriteSet.has(l.id) ? "text-red-500" : "text-muted-foreground"}`}
                    />
                  </Button>
                  {meId === l.owner_id && (
                    <ListingEditDialog listing={l} onSaved={load} />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Thumb gallery */}
              {l.images && l.images.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {l.images
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={img.storage_path + i}
                        src={getPublicUrl(
                          "marketplace-images",
                          img.storage_path,
                        )}
                        alt="zdjęcie"
                        className="h-24 w-auto rounded border"
                      />
                    ))}
                </div>
              ) : null}
              {l.description ? (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {l.description}
                </p>
              ) : null}
              <p className="text-sm">
                {typeof l.price_cents === "number"
                  ? priceFmt.format(l.price_cents / 100)
                  : "Cena do uzg."}
              </p>
              <div className="flex gap-2">
                {l.status !== "sold" && (
                  <Button size="sm" onClick={() => markSold(l.id)}>
                    Oznacz jako sprzedane
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteListing(l.id)}
                >
                  Usuń
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {loading && <p>Ładowanie…</p>}
      {!loading && listings.length === 0 && <p>Brak ogłoszeń.</p>}
    </div>
  )
}

// Helper to build public URLs (bucket must allow RLS read via policies)
function getPublicUrl(bucket: string, path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${url?.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`
}

// Listing edit dialog component
function ListingEditDialog({
  listing,
  onSaved,
}: {
  listing: ListingWithImages
  onSaved: () => Promise<void> | void
}) {
  const supabase = getSupabase()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(listing.title)
  const [description, setDescription] = useState(listing.description ?? "")
  const [price, setPrice] = useState(
    typeof listing.price_cents === "number"
      ? (listing.price_cents / 100).toFixed(2)
      : "",
  )
  const [status, setStatus] = useState<Listing["status"]>(listing.status)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!supabase) return
    setSaving(true)
    try {
      const price_cents = price
        ? Math.round(parseFloat(price.replace(",", ".")) * 100)
        : null
      const { error } = await supabase
        .from("marketplace_listings")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          price_cents,
          status,
        })
        .eq("id", listing.id)
      if (error) throw error
      toast({ title: "Zapisano" })
      setOpen(false)
      await onSaved()
    } catch {
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Edytuj">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj ogłoszenie</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <label className="text-sm">Tytuł</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Opis</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm">Cena</label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="text-sm">Status</label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Listing["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktywne</SelectItem>
                  <SelectItem value="sold">Sprzedane</SelectItem>
                  <SelectItem value="hidden">Ukryte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Zapisz"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
