"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Users,
  MapPin,
  Globe,
  Lock,
  Shield,
  Calendar,
  MessageCircle,
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
}

export default function CommunitiesPage() {
  const supabase = getSupabase()
  const router = useRouter()
  const [items, setItems] = useState<Community[]>([])
  // Create community dialog state
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"public" | "private" | "restricted">(
    "public",
  )
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const { data, error, status, statusText } = await withTimeout(
        supabase
          .from("communities")
          .select(
            "id,slug,name,description,avatar_url,cover_image_url,type,category,members_count,city,country,has_chat,has_events,created_at",
          )
          .eq("status", "active")
          .order("members_count", { ascending: false })
          .limit(50),
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
      } else {
        setItems(data || [])
      }
    }
    load()
  }, [supabase])

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
          error: memberErr,
          status: mStatus,
          statusText: mStatusText,
        } = await supabase
          .from("community_memberships")
          .insert({ community_id: created!.id, user_id: me.id, role: "owner" })
        if (memberErr) {
          const err = normalizeSupabaseError(
            memberErr,
            "Nie udało się dodać właściciela do społeczności",
            { status: mStatus, statusText: mStatusText },
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
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Społeczności</h1>
          <p className="text-sm text-muted-foreground">
            Dołącz do lokalnych i tematycznych grup. Odkrywaj, rozmawiaj, twórz
            wydarzenia.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search removed per request */}
          <Button onClick={() => setOpen(true)}>Utwórz</Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border bg-card p-8 text-center">
            <Image
              src="/icons/tecza-icons/1.svg"
              alt=""
              width={48}
              height={48}
              className="opacity-80"
            />
            <h2 className="mt-3 text-lg font-semibold">Brak społeczności</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Bądź pierwszą osobą, która stworzy nową społeczność.
            </p>
            <Button onClick={() => setOpen(true)}>Utwórz społeczność</Button>
          </div>
        ) : (
          items.map((c) => {
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
                    {/* Community Type Badge */}
                    <div className="absolute top-3 right-3">
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
                    </div>
                  </div>

                  <CardContent className="pt-12 pb-4">
                    <div className="space-y-3">
                      {/* Community Name and Category */}
                      <div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:underline decoration-2 decoration-primary/40">
                          {c.name}
                        </h3>
                        {c.category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {c.category}
                          </Badge>
                        )}
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
            <div className="grid md:grid-cols-3 gap-3">
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
              <Button
                onClick={createCommunity}
                disabled={loading}
                className="bg-gradient-to-r from-[#e40303] via-[#ff8c00] to-[#0078d7] text-white hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Tworzenie…" : "Utwórz"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
