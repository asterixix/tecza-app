"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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

export default function CommunityWikiDetailPage() {
  const supabase = getSupabase()
  const router = useRouter()
  const params = useParams<{ id: string; slug: string }>()
  const idOrSlug = params?.id
  const pageSlug = params?.slug

  const [communityId, setCommunityId] = useState<string | null>(null)
  const [page, setPage] = useState<WikiPage | null>(null)
  const [isEditor, setIsEditor] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: "", content: "" })
  const canSubmit = useMemo(() => form.title.trim().length > 0, [form.title])

  useEffect(() => {
    async function resolveCommunity() {
      if (!supabase || !idOrSlug) return
      let cid: string | null = null
      const bySlug = await withTimeout(
        supabase
          .from("communities")
          .select("id")
          .eq("slug", idOrSlug)
          .maybeSingle(),
        15000,
      )
      if (bySlug.data) cid = bySlug.data.id
      else {
        const byId = await withTimeout(
          supabase
            .from("communities")
            .select("id")
            .eq("id", idOrSlug)
            .maybeSingle(),
          15000,
        )
        if (byId.data) cid = byId.data.id
      }
      setCommunityId(cid)
      return cid
    }
    resolveCommunity()
  }, [supabase, idOrSlug])

  useEffect(() => {
    async function load() {
      if (!supabase || !communityId || !pageSlug) return
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
          .eq("slug", pageSlug)
          .maybeSingle(),
        15000,
      )
      if (!data) {
        toast.error("Nie znaleziono strony wiki")
        router.replace(`/c/${idOrSlug}/wiki`)
        return
      }
      setPage(data)
      setForm({ title: data.title ?? "", content: data.content ?? "" })
    }
    load()
  }, [supabase, communityId, pageSlug, router, idOrSlug])

  async function onSave() {
    if (!supabase || !page || !communityId) return
    const title = form.title.trim()
    const content = form.content.trim()
    if (!title) return
    const { error, status, statusText, data } = await withTimeout(
      supabase
        .from("community_wiki_pages")
        .update({ title, content: content || null })
        .eq("id", page.id)
        .select("id,slug,title,content")
        .single(),
      15000,
    )
    if (error) {
      const err = normalizeSupabaseError(error, "Błąd zapisu strony", {
        status,
        statusText,
      })
      toast.error(friendlyMessage(err))
      return
    }
    setPage(data)
    setEditing(false)
    toast.success("Zapisano zmiany")
  }

  async function onDelete() {
    if (!supabase || !page) return
    const { error, status, statusText } = await withTimeout(
      supabase.from("community_wiki_pages").delete().eq("id", page.id),
      15000,
    )
    if (error) {
      const err = normalizeSupabaseError(error, "Nie udało się usunąć", {
        status,
        statusText,
      })
      toast.error(friendlyMessage(err))
      return
    }
    toast.success("Usunięto stronę")
    router.replace(`/c/${idOrSlug}/wiki`)
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h1 className="text-xl font-semibold">Wiki</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push(`/c/${idOrSlug}/wiki`)}
            aria-label="Wróć do listy"
          >
            Wróć
          </Button>
          {isEditor && page && (
            <>
              <Button
                onClick={() => setEditing((v) => !v)}
                aria-pressed={editing}
                aria-label={editing ? "Anuluj edycję" : "Edytuj stronę"}
              >
                {editing ? "Anuluj" : "Edytuj"}
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                aria-label="Usuń stronę"
              >
                Usuń
              </Button>
            </>
          )}
        </div>
      </div>

      {!page ? (
        <Card>
          <CardContent className="p-4">Ładowanie…</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            {editing ? (
              <div className="grid gap-3">
                <label className="text-sm font-medium" htmlFor="title">
                  Tytuł
                </label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Tytuł strony"
                />
                <label className="text-sm font-medium" htmlFor="content">
                  Treść
                </label>
                <Textarea
                  id="content"
                  rows={12}
                  value={form.content}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, content: e.target.value }))
                  }
                  placeholder="Treść strony (Markdown wkrótce)"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setEditing(false)}>
                    Anuluj
                  </Button>
                  <Button onClick={onSave} disabled={!canSubmit}>
                    Zapisz
                  </Button>
                </div>
              </div>
            ) : (
              <article aria-labelledby="page-title" className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  /{page.slug}
                </div>
                <h2 id="page-title" className="text-2xl font-semibold">
                  {page.title}
                </h2>
                <Separator />
                {page.content ? (
                  <p className="whitespace-pre-wrap leading-7 text-sm text-muted-foreground">
                    {page.content}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Brak treści dla tej strony.
                  </p>
                )}
              </article>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
