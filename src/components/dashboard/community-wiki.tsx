"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  normalizeSupabaseError,
  friendlyMessage,
  withTimeout,
} from "@/lib/errors"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { Smile, Image as ImageIcon, Video as VideoIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [slug, setSlug] = useState("about")
  const [title, setTitle] = useState("O społeczności")
  const [content, setContent] = useState("")
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [vidFile, setVidFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const emojiList = ["😀", "😁", "😂", "🌈", "🏳️‍🌈", "🏳️‍⚧️", "🎉", "✨"]

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
    const s = slug.trim()
    const t = title.trim()
    const c = content.trim()
    if (!s || !t) {
      toast.info("Slug i tytuł są wymagane")
      return
    }
    setSubmitting(true)
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return

    // Optional uploads
    let contentFinal = c
    try {
      if (imgFile) {
        const path = `${communityId}/${Date.now()}-${imgFile.name}`
        const { error: upErr } = await supabase.storage
          .from("wiki")
          .upload(path, imgFile, { upsert: true })
        if (!upErr) {
          const pub = await supabase.storage.from("wiki").getPublicUrl(path)
          if (pub.data?.publicUrl)
            contentFinal += `\n\n![](${pub.data.publicUrl})\n`
        }
      }
      if (vidFile) {
        const path = `${communityId}/${Date.now()}-${vidFile.name}`
        const { error: upErr } = await supabase.storage
          .from("wiki")
          .upload(path, vidFile, { upsert: true })
        if (!upErr) {
          const pub = await supabase.storage.from("wiki").getPublicUrl(path)
          if (pub.data?.publicUrl)
            contentFinal += `\n\n<video src="${pub.data.publicUrl}" controls />\n`
        }
      }
    } catch {}

    const { error, data, status, statusText } = await withTimeout(
      supabase
        .from("community_wiki_pages")
        .insert({
          community_id: communityId,
          slug: s,
          title: t,
          content: contentFinal || null,
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
      setSubmitting(false)
      return
    }
    toast.success("Dodano stronę wiki")
    setPages((prev) => [data!, ...prev])
    setSlug("")
    setTitle("")
    setContent("")
    setImgFile(null)
    setVidFile(null)
    setDialogOpen(false)
    setSubmitting(false)
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
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Wiki</CardTitle>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Nowa strona
            </Button>
          </CardHeader>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nowa strona wiki</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                placeholder="Slug (np. about)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <Input
                placeholder="Tytuł"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <label className="text-sm">Dodaj:</label>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    document.getElementById("wiki-img-input")?.click()
                  }
                  title="Obraz"
                >
                  <ImageIcon className="size-4" />
                </Button>
                <input
                  id="wiki-img-input"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    document.getElementById("wiki-vid-input")?.click()
                  }
                  title="Wideo"
                >
                  <VideoIcon className="size-4" />
                </Button>
                <input
                  id="wiki-vid-input"
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={(e) => setVidFile(e.target.files?.[0] || null)}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" title="Emoji">
                      <Smile className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60">
                    <div className="grid grid-cols-8 gap-1">
                      {emojiList.map((e) => (
                        <button
                          key={e}
                          type="button"
                          className="rounded hover:bg-accent p-1 text-lg"
                          onClick={() => setContent((v) => v + e)}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Textarea
                placeholder="Treść (Markdown: GFM, LaTeX: $x^2$, $$\\int$$)"
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="rounded-md border p-3 overflow-auto">
              <div className="text-sm text-muted-foreground mb-2">Podgląd</div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={createPage} disabled={submitting}>
              {submitting ? "Zapisywanie…" : "Zapisz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
