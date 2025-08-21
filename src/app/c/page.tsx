"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import {
  friendlyMessage,
  normalizeSupabaseError,
  withTimeout,
} from "@/lib/errors"
import type {
  PostgrestError,
  PostgrestSingleResponse,
} from "@supabase/supabase-js"

type Community = {
  id: string
  slug?: string | null
  name: string
  description: string | null
  avatar_url: string | null
  members_count: number
  city: string | null
  country: string | null
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
            "id,slug,name,description,avatar_url,members_count,city,country",
          )
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
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold flex-1">Społeczności</h1>
        <div className="flex items-center gap-2">
          {/* Search removed per request */}
          <Button onClick={() => setOpen(true)}>Utwórz</Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <CardContent className="p-0">
              <Link
                href={`/c/${c.slug || c.id}`}
                className="flex gap-3 p-3 hover:bg-accent/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.avatar_url || "/icons/tecza-icons/1.svg"}
                  alt="Avatar"
                  className="h-12 w-12 rounded object-cover border"
                />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {c.description || ""}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {c.members_count} członków
                    {c.city || c.country
                      ? ` • ${[c.city, c.country].filter(Boolean).join(", ")}`
                      : ""}
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
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
              />
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
