"use client"

import { useState } from "react"
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
import { toast } from "sonner"
import { slugify } from "@/lib/utils"

export default function NewEventPage() {
  const supabase = getSupabase()
  const router = useRouter()
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
      const { data, error } = await supabase
        .from("events")
        .insert({
          ...(newId ? { id: newId } : {}),
          title,
          description,
          start_date: new Date(start).toISOString(),
          end_date: end ? new Date(end).toISOString() : null,
          timezone,
          city: city || null,
          country: country || null,
          is_online: isOnline,
          is_free: isFree,
          category,
          organizer_id: me.id,
          slug: baseSlug,
        })
        .select("slug")
        .single()
      if (error) throw error
      toast.success("Wydarzenie utworzone")
      router.push(`/events/${data!.slug}`)
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się utworzyć wydarzenia"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Utwórz wydarzenie</h1>
      <Card>
        <CardContent className="p-4 grid gap-3">
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
            <div className="flex items-end gap-2">
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
          <div className="flex justify-end">
            <Button onClick={createEvent} disabled={loading}>
              {loading ? "Tworzenie…" : "Utwórz"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
