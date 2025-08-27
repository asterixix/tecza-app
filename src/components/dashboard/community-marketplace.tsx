"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Edit2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type UUID = string

type Listing = {
  id: UUID
  title: string
  description: string | null
  price_cents: number
  currency: string
  status: "active" | "sold" | "hidden"
  created_at: string
  seller_id: UUID
  images: string[] | null
}

type ProfileLite = {
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type ListingWithImages = Listing & {
  profiles?: ProfileLite | ProfileLite[] | null
}

export function CommunityMarketplace({ communityId }: { communityId: string }) {
  const supabase = getSupabase()
  const { toast } = useToast()

  const [listings, setListings] = useState<ListingWithImages[]>([])
  const [loading, setLoading] = useState(true)

  // form state (dialog)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("PLN")
  const [files, setFiles] = useState<FileList | null>(null)

  // filters state
  type FilterStatus = "active" | "sold" | "hidden" | "all"
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("active")
  const [searchQuery, setSearchQuery] = useState("")

  // favorites
  const [meId, setMeId] = useState<string | null>(null)

  const load = async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const [{ data: lst, error: lstErr }, me] = await Promise.all([
        supabase
          .from("community_marketplace_listings")
          .select(
            `
            id,
            title,
            description,
            price_cents,
            currency,
            status,
            created_at,
            seller_id,
            images,
            profiles!community_marketplace_listings_seller_id_fkey(username, display_name, avatar_url)
          `,
          )
          .eq("community_id", communityId)
          .order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ])
      if (lstErr) throw lstErr
      const rawListings = (lst ?? []) as ListingWithImages[]

      // Apply filters client-side (simple and safe with RLS)
      let filtered = rawListings
      if (filterStatus !== "all")
        filtered = filtered.filter((l) => l.status === filterStatus)
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
      const { data: me } = await supabase.auth.getUser()
      const uid = me.user?.id
      if (!uid) throw new Error("Brak użytkownika")
      // Replace NaN check with robust parse + finite validation
      const parsedPrice = Number(price.replace(",", "."))
      if (!Number.isFinite(parsedPrice)) throw new Error("Nieprawidłowa cena")
      const price_cents = Math.round(parsedPrice * 100)
      if (price_cents <= 0) throw new Error("Nieprawidłowa cena")
      const { data: created, error } = await supabase
        .from("community_marketplace_listings")
        .insert({
          community_id: communityId,
          seller_id: uid,
          title: title.trim(),
          description: description.trim() || null,
          price_cents,
          currency,
        })
        .select("id,images")
        .single()
      if (error) throw error

      // Upload images if selected
      const listingId = created?.id as string | undefined
      if (listingId && files && files.length) {
        const bucket = supabase.storage.from("marketplace-images")
        const uploads = Array.from(files).map(async (file) => {
          const path = `${communityId}/${listingId}/${Date.now()}-${file.name}`
          const { error: upErr } = await bucket.upload(path, file, {
            upsert: true,
            cacheControl: "3600",
          })
          if (upErr) throw upErr
          return path
        })
        try {
          const paths = await Promise.all(uploads)
          const nextImages = [...(created?.images ?? []), ...paths]
          const { error: updateErr } = await supabase
            .from("community_marketplace_listings")
            .update({ images: nextImages })
            .eq("id", listingId)
          if (updateErr) throw updateErr
        } catch {
          toast({
            title: "Uwaga",
            description:
              "Niektóre obrazy nie zostały przesłane. Upewnij się, że istnieje bucket 'marketplace-images' i odpowiednie polityki.",
            variant: "warning",
          })
        }
      }
      toast({ title: "Dodano ogłoszenie" })
      setTitle("")
      setDescription("")
      setPrice("")
      setCurrency("PLN")
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
        .from("community_marketplace_listings")
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
        .from("community_marketplace_listings")
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Giełda społeczności</h2>
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
          <Button
            variant="outline"
            onClick={() => load()}
            aria-label="Odśwież listę"
          >
            Odśwież
          </Button>
          <Button onClick={() => setOpen(true)}>Dodaj ogłoszenie</Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dodaj ogłoszenie</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <label className="block text-sm mb-1">Tytuł</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Np. Flaga tęczowa 90x150"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Opis</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
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
            </div>
            <div>
              <label className="block text-sm mb-1">Zdjęcia</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
            </div>
            {/* Preview */}
            <div className="rounded-md border p-3">
              <div className="text-sm text-muted-foreground mb-2">Podgląd</div>
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base">
                    {title || "(bez tytułu)"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {files && files.length ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {Array.from(files).map((f, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={URL.createObjectURL(f)}
                          alt="podgląd"
                          className="h-24 w-auto rounded border"
                          onLoad={(e) =>
                            URL.revokeObjectURL(
                              (e.target as HTMLImageElement).src,
                            )
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                  {description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {description}
                    </p>
                  )}
                  <p className="text-sm">
                    {price
                      ? new Intl.NumberFormat("pl-PL", {
                          style: "currency",
                          currency,
                        }).format(Number(price.replace(",", ".")) || 0)
                      : "Cena do uzg."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={async () => {
                await createListing()
                setOpen(false)
              }}
              disabled={!title.trim()}
            >
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Listings */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <Card key={l.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{l.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {meId === l.seller_id && (
                    <ListingEditDialog listing={l} onSaved={load} />
                  )}
                </div>
              </div>
              {/* Seller link */}
              {(() => {
                const prof = Array.isArray(l.profiles)
                  ? l.profiles[0]
                  : l.profiles || null
                const uname = prof?.username ?? null
                const display = prof?.display_name || prof?.username || null
                return display ? (
                  <div className="mt-1 text-sm text-muted-foreground">
                    Sprzedający:{" "}
                    {uname ? (
                      <a
                        href={`/u/${uname}`}
                        className="underline underline-offset-2 hover:no-underline"
                        aria-label={`Profil sprzedającego ${display}`}
                      >
                        {display}
                      </a>
                    ) : (
                      <span>{display}</span>
                    )}
                  </div>
                ) : null
              })()}
            </CardHeader>
            <CardContent className="space-y-2">
              {l.images && l.images.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {l.images.map((path, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={path + i}
                      src={getPublicUrl("marketplace-images", path)}
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

function getPublicUrl(bucket: string, path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${url?.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`
}

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
  const [price, setPrice] = useState((listing.price_cents / 100).toFixed(2))
  const [status, setStatus] = useState<Listing["status"]>(listing.status)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!supabase) return
    setSaving(true)
    try {
      const parsedPrice = Number(price.replace(",", "."))
      if (!Number.isFinite(parsedPrice)) throw new Error("Nieprawidłowa cena")
      const price_cents = Math.round(parsedPrice * 100)
      if (price_cents <= 0) throw new Error("Nieprawidłowa cena")

      const { error } = await supabase
        .from("community_marketplace_listings")
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
    <Button
      size="icon"
      variant="ghost"
      aria-label="Edytuj"
      onClick={() => setOpen((v) => !v)}
    >
      {open ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Edit2 className="h-4 w-4" />
      )}
      {/* Inline edit in a simple drop-in; keep lightweight for now */}
      {open && (
        <div className="absolute z-10 mt-8 right-0 bg-popover border rounded-md p-3 w-80 shadow-md">
          <div className="grid gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
              />
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Zapisz"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Button>
  )
}
