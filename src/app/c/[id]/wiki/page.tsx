"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
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

export default function CommunityWikiPage() {
  const supabase = getSupabase()
  const params = useParams<{ id: string }>()
  const idOrSlug = params?.id
  const [pages, setPages] = useState<WikiPage[]>([])
  const [isEditor, setIsEditor] = useState(false)
  const [form, setForm] = useState({
    slug: "about",
    title: "O społeczności",
    content: "",
  })

  useEffect(() => {
    async function load() {
      if (!supabase || !idOrSlug) return
      // resolve community id
      let communityId: string | null = null
      const bySlug = await withTimeout(
        supabase
          .from("communities")
          .select("id")
          .eq("slug", idOrSlug)
          .maybeSingle(),
        15000,
      )
      if (bySlug.data) communityId = bySlug.data.id
      else {
        const byId = await withTimeout(
          supabase
            .from("communities")
            .select("id")
            .eq("id", idOrSlug)
            .maybeSingle(),
          15000,
        )
        if (byId.data) communityId = byId.data.id
      }
      if (!communityId) return
      const me = (await supabase.auth.getUser()).data.user
      if (me) {
        const { data: m } = await supabase
          .from("community_memberships")
          .select("role")
          .eq("community_id", communityId)
          .eq("user_id", me.id)
          .maybeSingle()
        setIsEditor(!!m && (m.role === "owner" || m.role === "moderator"))
      }
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
    load()
  }, [supabase, idOrSlug])

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
    // resolve community id again
    let communityId: string | null = null
    const bySlug = await withTimeout(
      supabase
        .from("communities")
        .select("id")
        .eq("slug", idOrSlug)
        .maybeSingle(),
      15000,
    )
    if (bySlug.data) communityId = bySlug.data.id
    else {
      const byId = await withTimeout(
        supabase
          .from("communities")
          .select("id")
          .eq("id", idOrSlug)
          .maybeSingle(),
        15000,
      )
      if (byId.data) communityId = byId.data.id
    }
    if (!communityId) return

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
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Wiki społeczności</h1>
      {isEditor && (
        <Card className="mb-6">
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
        {pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak stron wiki.</p>
        ) : (
          pages.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">/{p.slug}</div>
                <div className="text-lg font-semibold">{p.title}</div>
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
