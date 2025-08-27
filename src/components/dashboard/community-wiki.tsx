"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  normalizeSupabaseError,
  friendlyMessage,
  withTimeout,
} from "@/lib/errors"

interface WikiPage {
  id: string
  slug: string
  title: string
  content: string | null
}

export function CommunityWiki({
  communityId,
  isEditor,
  communitySlugOrId,
}: {
  communityId: string
  isEditor: boolean
  communitySlugOrId: string
}) {
  const supabase = getSupabase()
  const [pages, setPages] = useState<WikiPage[]>([])
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({
    slug: "about",
    title: "O społeczności",
    content: "",
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pages
    return pages.filter(
      (p) =>
        p.slug.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.content || "").toLowerCase().includes(q),
    )
  }, [pages, search])

  useEffect(() => {
    async function load() {
      if (!supabase || !communityId) return
      const { data } = await withTimeout(
        supabase
          .from("community_wiki_pages")
          .select("id,slug,title,content")
          .eq("community_id", communityId)
          .order("updated_at", { ascending: false }),
        15000,
      )
      setPages(data || [])
    }
    void load()
  }, [supabase, communityId])

  async function createPage() {
    if (!supabase) return
    const slug = form.slug.trim()
    const title = form.title.trim()
    const content = form.content.trim()
    if (!slug || !title) {
      toast.info("Slug i tytuł są wymagane")
      return
    }
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return

    const { error, data, status, statusText } = await withTimeout(
      supabase
        .from("community_wiki_pages")
        .insert({
          community_id: communityId,
          slug,
          title,
          content: content || null,
          created_by: me.id,
        })
        .select("id,slug,title,content")
        .single(),
      15000,
    )
    if (error) {
      const err = normalizeSupabaseError(error, "Nie udało się dodać strony", {
        status,
        statusText,
      })
      toast.error(friendlyMessage(err))
      return
    }
    toast.success("Dodano stronę wiki")
    setPages((prev) => [data!, ...prev])
    setForm({ slug: "", title: "", content: "" })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Szukaj w wiki…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Szukaj w stronach wiki"
        />
        <Button asChild variant="outline" size="sm">
          <Link href={`/c/${communitySlugOrId}/wiki`}>Otwórz pełne wiki</Link>
        </Button>
      </div>
      {isEditor && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-2">Nowa strona</h2>
            <div className="grid gap-2">
              <Input
                placeholder="Slug (np. about)"
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, slug: e.target.value }))
                }
              />
              <Input
                placeholder="Tytuł"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
              <Textarea
                placeholder="Treść (opcjonalnie)"
                value={form.content}
                onChange={(e) =>
                  setForm((p) => ({ ...p, content: e.target.value }))
                }
              />
              <div className="flex justify-end">
                <Button onClick={createPage}>Zapisz</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak stron wiki.</p>
        ) : (
          filtered.slice(0, 6).map((p) => (
            <Card key={p.id} className="hover:bg-muted/40">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  <Link
                    className="underline-offset-2 hover:underline"
                    href={`/c/${communitySlugOrId}/wiki/${p.slug}`}
                    aria-label={`Otwórz stronę ${p.title}`}
                  >
                    /{p.slug}
                  </Link>
                </div>
                <div className="text-lg font-semibold">
                  <Link
                    className="hover:underline underline-offset-2"
                    href={`/c/${communitySlugOrId}/wiki/${p.slug}`}
                  >
                    {p.title}
                  </Link>
                </div>
                {p.content ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                    {p.content}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
