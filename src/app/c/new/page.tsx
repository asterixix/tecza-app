"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { slugify } from "@/lib/utils"

export default function NewCommunityPage() {
  const supabase = getSupabase()
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<'public'|'private'|'restricted'>('public')
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [loading, setLoading] = useState(false)

  async function createCommunity() {
    if (!supabase) return toast.error("Brak konfiguracji Supabase")
    if (!name.trim()) return toast.error("Podaj nazwę społeczności")
    setLoading(true)
    try {
      const me = (await supabase.auth.getUser()).data.user
      if (!me) throw new Error("Musisz być zalogowany")
      const newId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : undefined
      const baseSlug = slugify(name)
      const { data, error } = await supabase.from('communities').insert({
        ...(newId ? { id: newId } : {}),
        name,
        description,
        type,
        city: city || null,
        country: country || null,
        owner_id: me.id,
        is_local: !!(city || country),
        slug: baseSlug,
      }).select('id').single()
      if (error) throw error
      // Auto-join owner
      const { error: memberErr } = await supabase
        .from('community_memberships')
        .insert({ community_id: data!.id, user_id: me.id, role: 'owner' })
      if (memberErr) throw memberErr
      toast.success("Społeczność utworzona")
  router.push(`/communities/${baseSlug}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Nie udało się utworzyć społeczności'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Utwórz społeczność</h1>
      <Card>
        <CardContent className="p-4 grid gap-3">
          <div>
            <div className="text-sm font-medium mb-1">Nazwa</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="np. LGBTQ Kraków" />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Opis</div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Krótki opis społeczności" rows={4} />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <div className="text-sm font-medium mb-1">Typ</div>
              <Select value={type} onValueChange={(v: 'public'|'private'|'restricted') => setType(v)}>
                <SelectTrigger><SelectValue placeholder="Publiczna" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Publiczna</SelectItem>
                  <SelectItem value="restricted">Ograniczona</SelectItem>
                  <SelectItem value="private">Prywatna</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Miasto</div>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="np. Kraków" />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Kraj</div>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="np. Poland" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={createCommunity} disabled={loading}>{loading? 'Tworzenie…' : 'Utwórz'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
