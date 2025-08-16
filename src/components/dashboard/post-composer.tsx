"use client"
import { useEffect, useMemo, useState, useRef } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Image as ImageIcon, Video as VideoIcon, X, Smile } from "lucide-react"
import { moderateContent } from "@/lib/moderation"

const schema = z.object({
  content: z.string().min(1, "Wpis nie może być pusty").max(5000),
  visibility: z.enum(["public", "friends", "private", "unlisted"]),
})

export function PostComposer({
  onPosted,
  open,
  onOpenChange,
}: {
  onPosted?: () => void
  open?: boolean
  onOpenChange?: (o: boolean) => void
}) {
  // Validate that a preview URL is a blob: URL to avoid DOM XSS via reinterpreted strings
  const safeBlobUrl = (val: string | null): string | null => {
    if (!val) return null
    try {
      const u = new URL(val)
      return u.protocol === "blob:" ? u.toString() : null
    } catch {
      return null
    }
  }
  const [loading, setLoading] = useState(false)
  const supabase = getSupabase()
  type FormValues = z.infer<typeof schema>
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: "", visibility: "public" },
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const imgInputRef = useRef<HTMLInputElement | null>(null)
  const vidInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [localOpen, setLocalOpen] = useState(false)
  const isOpen = open ?? localOpen
  const setOpen = onOpenChange ?? setLocalOpen
  // Popover control to avoid accidental close while interacting
  const [emojiOpen, setEmojiOpen] = useState(false)

  // Tenor GIF picker state
  // No Tenor GIF support (removed)

  // Emoji picker (lightweight list)
  const emojis = useMemo(
    () => [
      "😀",
      "😁",
      "😂",
      "🤣",
      "😊",
      "😍",
      "😎",
      "😉",
      "🥰",
      "😇",
      "🤔",
      "😴",
      "🤩",
      "😢",
      "😭",
      "😡",
      "🤗",
      "🙌",
      "👏",
      "👍",
      "🌈",
      "🏳️‍🌈",
      "🏳️‍⚧️",
      "💖",
      "✨",
      "⭐",
      "🔥",
      "🎉",
      "🥳",
      "🍀",
    ],
    []
  )
  const addEmoji = (e: string) => {
    const cur = form.getValues("content") || ""
    const ta = textareaRef.current
    if (ta && typeof ta.selectionStart === "number" && typeof ta.selectionEnd === "number") {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = cur.slice(0, start) + e + cur.slice(end)
      form.setValue("content", next, { shouldDirty: true })
      requestAnimationFrame(() => {
        const pos = start + e.length
        ta.setSelectionRange(pos, pos)
        ta.focus()
      })
    } else {
      form.setValue("content", cur + e, { shouldDirty: true })
    }
  }

  // Clipboard paste support: images, GIFs, and videos
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items || []
    const files = Array.from(items)
      .filter((i) => i.kind === "file")
      .map((i) => i.getAsFile())
      .filter((f): f is File => !!f)

    if (files.length) {
      // Prefer the first image and the first video if present
      const img = files.find((f) => f.type.startsWith("image/"))
      const vid = files.find((f) => f.type.startsWith("video/"))
      let attached = false
      if (img) {
        setImageFile(img)
        attached = true
        toast.info("Dodano obraz z schowka")
      }
      if (vid) {
        setVideoFile(vid)
        attached = true
        toast.info("Dodano wideo z schowka")
      }
      if (attached) {
        e.preventDefault()
      }
    }
  }

  // Previews for local files
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImagePreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setImagePreview(null)
  }, [imageFile])

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile)
      setVideoPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setVideoPreview(null)
  }, [videoFile])

  // Link embedding: detect first http(s) URL and allow attach with preview
  const [firstUrl, setFirstUrl] = useState("")
  useEffect(() => {
    const sub = form.watch((vals) => {
      const text = vals.content || ""
      const urls = Array.from(text.matchAll(/https?:\/\/[^\s)]+/gi)).map((m) => m[0])
      setFirstUrl(urls[0] || "")
    })
    return () => sub.unsubscribe?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [attachLink, setAttachLink] = useState(true)
  // Simple heuristic providers (YouTube) — can be extended later

  function extractTagsAndMentions(text: string) {
    const tagRe = /(^|\s)#([\p{L}0-9_]{2,30})/giu
    const mentionRe = /(^|\s)@([a-z0-9_]{3,30})/gi
    const tags = new Set<string>()
    const mentions = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = tagRe.exec(text))) tags.add(m[2].toLowerCase())
    while ((m = mentionRe.exec(text))) mentions.add(m[2].toLowerCase())
    return { hashtags: Array.from(tags), mentions: Array.from(mentions) }
  }

  async function uploadToStorage(bucket: string, path: string, file: File) {
    const { data, error } = await supabase!.storage
      .from(bucket)
      .upload(path, file, { upsert: true })
    if (error) throw error
    const pub = await supabase!.storage.from(bucket).getPublicUrl(data.path)
    return pub.data.publicUrl
  }

  async function onSubmit(values: FormValues) {
    if (!supabase) return toast.error("Brak konfiguracji Supabase")
    try {
      setLoading(true)
      // AI moderation pre-check for text content
      const moderation = await moderateContent({ type: "post", content: values.content })
      if (moderation?.decision === "block") {
        toast.error("Treść odrzucona przez moderację AI")
        // Try to create a moderation report for audit
        try {
          const u = (await supabase.auth.getUser()).data.user
          if (u) {
            await supabase.from("moderation_reports").insert({
              reporter_id: u.id,
              target_type: "post",
              target_id: null,
              reason: "inappropriate_content",
              description: (moderation.reasons || []).join(", ") || "AI block",
              status: "pending",
              target_meta: { preview: values.content.slice(0, 280) },
            })
          }
        } catch {}
        setLoading(false)
        return
      }
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error("Brak zalogowanego użytkownika")
      const mediaUrls: string[] = []
      // Image upload -> WEBP (skip for GIF to preserve animation). If transcode fails, upload original
      if (imageFile) {
        let fileToUpload = imageFile
        if (
          typeof window !== "undefined" &&
          imageFile.type.startsWith("image/") &&
          imageFile.type !== "image/gif"
        ) {
          try {
            const bmp = await createImageBitmap(imageFile)
            const canvas = document.createElement("canvas")
            canvas.width = bmp.width
            canvas.height = bmp.height
            const ctx = canvas.getContext("2d")!
            ctx.drawImage(bmp, 0, 0)
            const blob = await new Promise<Blob>((res) =>
              canvas.toBlob((b) => res(b!), "image/webp", 0.9)
            )
            fileToUpload = new File([blob], imageFile.name.replace(/\.[^.]+$/, ".webp"), {
              type: "image/webp",
            })
          } catch {}
        }
        const imgPath = `${user.id}/images/${Date.now()}-${fileToUpload.name}`
        const url = await uploadToStorage("posts", imgPath, fileToUpload)
        mediaUrls.push(url)
      }
      // Video upload -> keep original format/extension
      if (videoFile) {
        const vidPath = `${user.id}/videos/${Date.now()}-${videoFile.name}`
        const url = await uploadToStorage("posts", vidPath, videoFile)
        mediaUrls.push(url)
        // Try to transcode server-side via Edge Function (best-effort)
        try {
          const res = await fetch("/api/video-transcode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bucket: "posts", path: vidPath }),
          })
          if (res.ok) {
            const j = await res.json()
            if (j?.ok && typeof j.outputPath === "string") {
              const pub = await supabase.storage.from("posts").getPublicUrl(j.outputPath)
              if (pub.data?.publicUrl) mediaUrls.push(pub.data.publicUrl)
            }
          }
        } catch {}
      }

      // Attach detected link preview if enabled
      if (attachLink && firstUrl) {
        if (!mediaUrls.includes(firstUrl)) mediaUrls.push(firstUrl)
      }

      const { hashtags } = extractTagsAndMentions(values.content)

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: values.content,
        type: mediaUrls.length ? (videoFile ? "video" : imageFile ? "image" : "text") : "text",
        media_urls: mediaUrls.length ? mediaUrls : null,
        hashtags: hashtags.length ? hashtags : null,
        // Mentions: we store usernames; server can map to user IDs if needed later
        mentions: null,
        visibility: values.visibility,
      })
      if (error) throw error
      if (moderation?.decision === "review") {
        toast.message("Treść oznaczona do weryfikacji przez AI", {
          description: "Moderator sprawdzi wpis wkrótce.",
        })
        try {
          const u = (await supabase.auth.getUser()).data.user
          if (u) {
            await supabase.from("moderation_reports").insert({
              reporter_id: u.id,
              target_type: "post",
              target_id: null,
              reason: "inappropriate_content",
              description: (moderation.reasons || []).join(", ") || "AI review",
              status: "pending",
              target_meta: { preview: values.content.slice(0, 280) },
            })
          }
        } catch {}
      }
      toast.success("Opublikowano post")
      form.reset({ content: "", visibility: values.visibility })
      setImageFile(null)
      setVideoFile(null)
      setAttachLink(true)
      setOpen(false)
      onPosted?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się dodać posta"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nowy post</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Treść</FormLabel>
                  <FormControl>
                    {(() => {
                      const { ref: rhfRef, ...rest } = field
                      return (
                        <Textarea
                          rows={4}
                          placeholder="Podziel się czymś... (Markdown, #hashtagi, @wzmianki)"
                          {...rest}
                          onPaste={handlePaste}
                          ref={(el: HTMLTextAreaElement | null) => {
                            if (typeof rhfRef === "function") rhfRef(el)
                            else if (rhfRef)
                              (
                                rhfRef as React.MutableRefObject<HTMLTextAreaElement | null>
                              ).current = el
                            textareaRef.current = el
                          }}
                        />
                      )
                    })()}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Toolbar for attachments */}
            <div className="flex items-center gap-2">
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setImageFile(f || null)
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Dodaj obraz"
                onClick={() => imgInputRef.current?.click()}
              >
                <ImageIcon className="size-4" />
              </Button>

              <input
                ref={vidInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setVideoFile(f || null)
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Dodaj wideo"
                onClick={() => vidInputRef.current?.click()}
              >
                <VideoIcon className="size-4" />
              </Button>

              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" title="Wstaw emoji">
                    <Smile className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="rounded hover:bg-accent p-1 text-lg"
                        onClick={() => {
                          addEmoji(e)
                          setEmojiOpen(false)
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Selected attachments preview */}
              <div className="ml-auto flex items-center gap-3">
                {imageFile && imagePreview && safeBlobUrl(imagePreview) && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={safeBlobUrl(imagePreview) ?? undefined}
                      alt="Podgląd obrazu"
                      className="h-20 w-auto max-w-[160px] rounded object-cover border"
                    />
                    <button
                      type="button"
                      aria-label="Usuń obraz"
                      onClick={() => setImageFile(null)}
                      className="absolute -right-2 -top-2 inline-flex items-center justify-center rounded-full bg-background border p-1 shadow"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                )}
                {videoFile && videoPreview && safeBlobUrl(videoPreview) && (
                  <div className="relative">
                    <video
                      src={safeBlobUrl(videoPreview) ?? undefined}
                      className="h-20 w-auto max-w-[200px] rounded border"
                      controls
                      muted
                    />
                    <button
                      type="button"
                      aria-label="Usuń wideo"
                      onClick={() => setVideoFile(null)}
                      className="absolute -right-2 -top-2 inline-flex items-center justify-center rounded-full bg-background border p-1 shadow"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Link preview attach toggle */}
            {firstUrl && (
              <div className="rounded-md border p-3 text-sm flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">Podgląd linku</div>
                  <div className="text-muted-foreground truncate max-w-[32ch]">{firstUrl}</div>
                  <OGPreview url={firstUrl} />
                </div>
                <label className="ml-2 inline-flex items-center gap-2 text-xs select-none">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={attachLink}
                    onChange={(e) => setAttachLink(e.target.checked)}
                  />{" "}
                  Dołącz podgląd
                </label>
              </div>
            )}

            <div className="flex items-center gap-2 justify-between">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem className="w-40">
                    <FormLabel className="sr-only">Widoczność</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="Widoczność posta">
                        <SelectValue placeholder="Publiczny" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Publiczny</SelectItem>
                        <SelectItem value="friends">Tylko znajomi</SelectItem>
                        <SelectItem value="unlisted">Nielistowany (z linkiem)</SelectItem>
                        <SelectItem value="private">Prywatny</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Publikuję…" : "Opublikuj"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function OGPreview({ url }: { url: string }) {
  const [data, setData] = useState<{
    title?: string
    description?: string
    image?: string
    siteName?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const safeHttpUrl = (val?: string | null): string | null => {
    if (!val) return null
    try {
      const u = new URL(val)
      return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null
    } catch {
      return null
    }
  }
  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        if (!res.ok) return
        const j = await res.json()
        if (!cancelled) setData(j)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [url])
  if (loading && !data)
    return <div className="mt-2 text-xs text-muted-foreground">Ładowanie podglądu…</div>
  if (!data) return null
  return (
    <div className="mt-2 flex gap-3 rounded border bg-muted/30 p-2">
      {safeHttpUrl(data.image) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safeHttpUrl(data.image) ?? undefined}
          alt=""
          className="h-16 w-16 object-cover rounded"
        />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{data.title || new URL(url).hostname}</div>
        {data.siteName && (
          <div className="text-xs text-muted-foreground truncate">{data.siteName}</div>
        )}
        {data.description && (
          <div className="text-xs text-muted-foreground line-clamp-2">{data.description}</div>
        )}
      </div>
    </div>
  )
}
