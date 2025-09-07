"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
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
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  Smile,
  Sparkles,
  Save,
  Clock,
  AlertCircle,
  CheckCircle,
  Bold,
  Italic,
  Link as LinkIcon,
  Code,
  Eye,
  EyeOff,
  Calendar,
  Send,
  FileText,
  Maximize2,
  Minimize2,
  Trash2,
  Hash,
  AtSign,
} from "lucide-react"
import { moderateContent } from "@/lib/moderation"
import { cn } from "@/lib/utils"
import data from "@emoji-mart/data"
import Image from "next/image"

// Define a type for EmojiPicker props to replace 'any' and ensure type safety
interface EmojiPickerProps {
  data: typeof data // Updated to use the correct type
  onEmojiSelect: (emoji: { native?: string; shortcodes?: string }) => void
  theme?: string
  navPosition?: string
  previewPosition?: string
}

// emoji-mart Picker only on client (v5)
// Use the defined type instead of 'any' for better code safety
const EmojiPicker = dynamic<EmojiPickerProps>(
  () => import("@emoji-mart/react").then((m) => m.default),
  { ssr: false },
)

const schema = z.object({
  content: z
    .string()
    .min(1, "Wpis nie może być pusty")
    .max(5000, "Wpis nie może być dłuższy niż 5000 znaków"),
  visibility: z.enum(["public", "friends", "private", "unlisted"]),
})

const MAX_CHARACTERS = 5000
const DRAFT_SAVE_INTERVAL = 2000 // 2 seconds

export function PostComposer({
  onPosted,
  open,
  onOpenChange,
  communityId,
  onMediaUpload,
}: {
  onPosted?: () => void
  open?: boolean
  onOpenChange?: (o: boolean) => void
  communityId?: string
  onMediaUpload?: (files: File[]) => void
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
  const [draftSaved, setDraftSaved] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showScheduling, setShowScheduling] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)
  const [characterCount, setCharacterCount] = useState(0)
  const supabase = getSupabase()
  type FormValues = z.infer<typeof schema>
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: "", visibility: "public" },
  })
  // Multiple attachments support
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const imgInputRef = useRef<HTMLInputElement | null>(null)
  const vidInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [videoPreviews, setVideoPreviews] = useState<string[]>([])
  const [localOpen, setLocalOpen] = useState(false)
  const isOpen = open ?? localOpen
  const setOpen = onOpenChange ?? setLocalOpen
  // Popover control to avoid accidental close while interacting
  const [emojiOpen, setEmojiOpen] = useState(false)

  // Auto-save draft functionality
  const draftKey = `post-draft-${communityId || "global"}`
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const extractHashtagsAndMentions = useCallback((text: string) => {
    const hashtags = text.match(/#\w+/g) || []
    const mentions = text.match(/@\w+/g) || []
    return { hashtags, mentions }
  }, [])

  const formatText = useCallback(
    (
      text: string,
      format: "bold" | "italic" | "underline" | "code" | "quote",
    ) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = text.substring(start, end)

      let formattedText = ""
      switch (format) {
        case "bold":
          formattedText = `**${selectedText}**`
          break
        case "italic":
          formattedText = `*${selectedText}*`
          break
        case "underline":
          formattedText = `__${selectedText}__`
          break
        case "code":
          formattedText = `\`${selectedText}\``
          break
        case "quote":
          formattedText = `> ${selectedText}`
          break
      }

      const newText =
        text.substring(0, start) + formattedText + text.substring(end)
      form.setValue("content", newText)

      // Set cursor position after formatting
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + formattedText.length,
          start + formattedText.length,
        )
      }, 0)
    },
    [form],
  )

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentText = form.getValues("content")
      const newText =
        currentText.substring(0, start) + text + currentText.substring(end)

      form.setValue("content", newText)

      // Set cursor position after insertion
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + text.length, start + text.length)
      }, 0)
    },
    [form],
  )

  const applyTemplate = useCallback(
    (template: string) => {
      const currentContent = form.getValues("content")
      const newContent = currentContent
        ? `${currentContent}\n\n${template}`
        : template
      form.setValue("content", newContent)
    },
    [form],
  )

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  const schedulePost = useCallback((date: Date) => {
    setScheduledDate(date)
    setShowScheduling(false)
    toast.success(`Post zaplanowany na ${date.toLocaleString()}`)
  }, [])

  const cancelSchedule = useCallback(() => {
    setScheduledDate(null)
    setShowScheduling(false)
    toast.success("Anulowano planowanie posta")
  }, [])

  // Community question (OpenRouter Gemini)
  const [question, setQuestion] = useState<string>("")
  const [questionLoading, setQuestionLoading] = useState(false)
  const [attachQuestion, setAttachQuestion] = useState(true)
  const [attachLink, setAttachLink] = useState(true)
  const [firstUrl, setFirstUrl] = useState("")

  const uploadToStorage = useCallback(
    async (bucket: string, path: string, file: File) => {
      const { data, error } = await supabase!.storage
        .from(bucket)
        .upload(path, file, { upsert: true })
      if (error) throw error
      const pub = await supabase!.storage.from(bucket).getPublicUrl(data.path)
      return pub.data.publicUrl
    },
    [supabase],
  )

  // Auto-save draft functionality
  const saveDraft = useCallback(() => {
    const content = form.getValues("content")
    const visibility = form.getValues("visibility")

    if (content.trim()) {
      const draft = {
        content,
        visibility,
        imageFiles: imageFiles.length,
        videoFiles: videoFiles.length,
        question,
        attachQuestion,
        attachLink,
        timestamp: Date.now(),
      }

      try {
        localStorage.setItem(draftKey, JSON.stringify(draft))
        setDraftSaved(true)
        setLastSaved(new Date())

        // Clear the saved indicator after 3 seconds
        setTimeout(() => setDraftSaved(false), 3000)
      } catch (error) {
        console.error("Failed to save draft:", error)
      }
    }
  }, [
    form,
    imageFiles.length,
    videoFiles.length,
    question,
    attachQuestion,
    attachLink,
    draftKey,
  ])

  const loadDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        form.setValue("content", draft.content || "")
        form.setValue("visibility", draft.visibility || "public")
        setQuestion(draft.question || "")
        setAttachQuestion(draft.attachQuestion !== false)
        setAttachLink(draft.attachLink !== false)

        // Show draft loaded notification
        toast.info("Wczytano szkic", {
          description: `Zapisany ${new Date(draft.timestamp).toLocaleString()}`,
        })
      }
    } catch (error) {
      console.error("Failed to load draft:", error)
    }
  }, [form, draftKey])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey)
      setDraftSaved(false)
      setLastSaved(null)
    } catch (error) {
      console.error("Failed to clear draft:", error)
    }
  }, [draftKey])

  // Auto-save on content change
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.content && values.content.trim()) {
        // Clear existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }

        // Set new timeout
        autoSaveTimeoutRef.current = setTimeout(() => {
          saveDraft()
        }, DRAFT_SAVE_INTERVAL)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [form, saveDraft])

  // Character count tracking
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.content) {
        setCharacterCount(values.content.length)
      }
    })

    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!supabase) return toast.error("Brak konfiguracji Supabase")
      try {
        setLoading(true)
        // AI moderation pre-check for text content
        const moderation = await moderateContent({
          type: "post",
          content: values.content,
        })
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
                description:
                  (moderation.reasons || []).join(", ") || "AI block",
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
        // Upload all images -> WEBP (keep GIF)
        for (const img of imageFiles) {
          let fileToUpload = img
          if (
            typeof window !== "undefined" &&
            img.type.startsWith("image/") &&
            img.type !== "image/gif"
          ) {
            try {
              const bmp = await createImageBitmap(img)
              const canvas = document.createElement("canvas")
              canvas.width = bmp.width
              canvas.height = bmp.height
              const ctx = canvas.getContext("2d")!
              ctx.drawImage(bmp, 0, 0)
              const blob = await new Promise<Blob>((res) =>
                canvas.toBlob((b) => res(b!), "image/webp", 0.9),
              )
              fileToUpload = new File(
                [blob],
                img.name.replace(/\.[^.]+$/, ".webp"),
                { type: "image/webp" },
              )
            } catch {}
          }
          const imgPath = `${user.id}/images/${Date.now()}-${fileToUpload.name}`
          const url = await uploadToStorage("posts", imgPath, fileToUpload)
          mediaUrls.push(url)
        }
        // Upload all videos -> keep original
        for (const vid of videoFiles) {
          const vidPath = `${user.id}/videos/${Date.now()}-${vid.name}`
          const url = await uploadToStorage("posts", vidPath, vid)
          mediaUrls.push(url)
          // Try server-side transcode (best-effort)
          try {
            const res = await fetch("/api/video-transcode", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bucket: "posts", path: vidPath }),
            })
            if (res.ok) {
              const j = await res.json()
              if (j?.ok && typeof j.outputPath === "string") {
                const pub = await supabase.storage
                  .from("posts")
                  .getPublicUrl(j.outputPath)
                if (pub.data?.publicUrl) mediaUrls.push(pub.data.publicUrl)
              }
            }
          } catch {}
        }

        // Attach detected link preview if enabled
        if (attachLink && firstUrl) {
          if (!mediaUrls.includes(firstUrl)) mediaUrls.push(firstUrl)
        }

        // Build final content with optional community question on top
        const composedContent =
          attachQuestion && question
            ? `${question}\n\n${values.content}`
            : values.content

        const { hashtags, mentions } = extractTagsAndMentions(composedContent)

        // Resolve mentions -> profile IDs
        let mentionIds: string[] | null = null
        if (mentions.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id,username")
            .in("username", mentions)
          const ids = (
            (profs || []) as Array<{ id: string; username: string }>
          ).map((p) => p.id)
          mentionIds = ids.length ? ids : null
        }

        const { error } = await supabase.from("posts").insert({
          user_id: user.id,
          content: composedContent,
          type: mediaUrls.length
            ? videoFiles.length
              ? "video"
              : imageFiles.length
                ? "image"
                : "text"
            : "text",
          media_urls: mediaUrls.length ? mediaUrls : null,
          hashtags: hashtags.length ? hashtags : null,
          mentions: mentionIds,
          visibility: values.visibility,
          community_id: communityId || null,
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
                description:
                  (moderation.reasons || []).join(", ") || "AI review",
                status: "pending",
                target_meta: { preview: values.content.slice(0, 280) },
              })
            }
          } catch {}
        }
        toast.success("Opublikowano post")
        form.reset({ content: "", visibility: values.visibility })
        setImageFiles([])
        setVideoFiles([])
        setAttachLink(true)
        setAttachQuestion(true)
        // Clear draft after successful post
        clearDraft()
        // keep the fetched question visible for next post attempt
        setOpen(false)
        onPosted?.()
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Nie udało się dodać posta"
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    },
    [
      supabase,
      imageFiles,
      videoFiles,
      attachLink,
      firstUrl,
      attachQuestion,
      question,
      communityId,
      onPosted,
      setOpen,
      clearDraft,
      form,
      uploadToStorage,
    ],
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "b":
            e.preventDefault()
            formatText(form.getValues("content"), "bold")
            break
          case "i":
            e.preventDefault()
            formatText(form.getValues("content"), "italic")
            break
          case "u":
            e.preventDefault()
            formatText(form.getValues("content"), "underline")
            break
          case "k":
            e.preventDefault()
            insertAtCursor("[link text](url)")
            break
          case "Enter":
            e.preventDefault()
            if (form.getValues("content").trim()) {
              form.handleSubmit(onSubmit)()
            }
            break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [form, formatText, insertAtCursor, onSubmit])

  // Drag and drop for media
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.dataTransfer!.dropEffect = "copy"
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer!.files)
      const mediaFiles = files.filter(
        (file) =>
          file.type.startsWith("image/") || file.type.startsWith("video/"),
      )

      // Use the correct media upload handler from context
      if (mediaFiles.length > 0 && typeof onMediaUpload === "function") {
        onMediaUpload(mediaFiles)
      }
    }

    const ta = textareaRef.current
    if (ta) {
      ta.addEventListener("dragover", handleDragOver)
      ta.addEventListener("drop", handleDrop)
    }

    return () => {
      const ta = textareaRef.current
      if (ta) {
        ta.removeEventListener("dragover", handleDragOver)
        ta.removeEventListener("drop", handleDrop)
      }
    }
  }, [onMediaUpload])

  // Load draft on component mount
  useEffect(() => {
    if (isOpen) {
      loadDraft()
    }
  }, [isOpen, loadDraft])

  // Emoji insertion helper
  const addEmoji = (e: string) => {
    const cur = form.getValues("content") || ""
    const ta = textareaRef.current
    if (
      ta &&
      typeof ta.selectionStart === "number" &&
      typeof ta.selectionEnd === "number"
    ) {
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
      const newImages = files.filter((f) => f.type.startsWith("image/"))
      const newVideos = files.filter((f) => f.type.startsWith("video/"))
      if (newImages.length) setImageFiles((prev) => [...prev, ...newImages])
      if (newVideos.length) setVideoFiles((prev) => [...prev, ...newVideos])
      if (newImages.length || newVideos.length) {
        toast.info(
          `Dodano ${newImages.length} obraz(ów) i ${newVideos.length} wideo z schowka`,
        )
        e.preventDefault()
      }
    }
  }

  // Previews for local files
  // Build previews for images list
  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f))
    setImagePreviews(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [imageFiles])

  // Build previews for videos list
  useEffect(() => {
    const urls = videoFiles.map((f) => URL.createObjectURL(f))
    setVideoPreviews(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [videoFiles])

  // Link embedding: detect first http(s) URL and allow attach with preview
  useEffect(() => {
    const sub = form.watch((vals) => {
      const text = vals.content || ""
      const urls = Array.from(text.matchAll(/https?:\/\/[^\s)]+/gi)).map(
        (m) => m[0],
      )
      setFirstUrl(urls[0] || "")
    })
    return () => sub.unsubscribe?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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

  async function fetchCommunityQuestion() {
    try {
      setQuestionLoading(true)
      const res = await fetch("/api/community-question", { method: "POST" })
      if (!res.ok) throw new Error("Nie udało się pobrać pytania")
      const j = (await res.json()) as { question?: string }
      setQuestion(j.question || "")
      if (!j.question) toast.error("Brak treści pytania z API")
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się pobrać pytania"
      toast.error(msg)
    } finally {
      setQuestionLoading(false)
    }
  }

  // OGPreview component for link previews
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
        return u.protocol === "http:" || u.protocol === "https:"
          ? u.toString()
          : null
      } catch {
        return null
      }
    }
    useEffect(() => {
      let cancelled = false
      async function run() {
        setLoading(true)
        try {
          const res = await fetch(
            `/api/link-preview?url=${encodeURIComponent(url)}`,
          )
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
      return (
        <div className="mt-2 text-xs text-muted-foreground">
          Ładowanie podglądu…
        </div>
      )
    if (!data) return null
    return (
      <div className="mt-2 flex gap-3 rounded border bg-muted/30 p-2">
        {safeHttpUrl(data.image) && (
          <Image
            src={safeHttpUrl(data.image) ?? ""}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 object-cover rounded"
          />
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">
            {data.title || new URL(url).hostname}
          </div>
          {data.siteName && (
            <div className="text-xs text-muted-foreground truncate">
              {data.siteName}
            </div>
          )}
          {data.description && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {data.description}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "sm:max-w-lg max-h-[90vh] overflow-y-auto",
          isFullscreen && "max-w-4xl h-[90vh]",
        )}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nowy post
              {scheduledDate && (
                <Badge variant="outline" className="ml-2">
                  <Calendar className="h-3 w-3 mr-1" />
                  Zaplanowany
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => {
                const content = field.value || ""
                const characterCount = content.length
                const isNearLimit = characterCount > MAX_CHARACTERS * 0.8
                const isOverLimit = characterCount > MAX_CHARACTERS

                return (
                  <FormItem>
                    <FormLabel className="sr-only">Treść</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          rows={4}
                          placeholder="Podziel się czymś... (Markdown, #hashtagi, @wzmianki)"
                          {...field}
                          onPaste={handlePaste}
                          maxLength={MAX_CHARACTERS}
                          className={cn(
                            "pr-16",
                            isOverLimit &&
                              "border-red-500 focus:border-red-500",
                          )}
                          ref={(el: HTMLTextAreaElement | null) => {
                            if (typeof field.ref === "function") field.ref(el)
                            else if (field.ref && el)
                              (
                                field.ref as React.RefObject<HTMLTextAreaElement>
                              ).current = el
                            textareaRef.current = el
                          }}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-1 rounded">
                          <span
                            className={cn(
                              isOverLimit && "text-red-500 font-medium",
                              isNearLimit && !isOverLimit && "text-orange-500",
                            )}
                          >
                            {characterCount}/{MAX_CHARACTERS}
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />

                    {/* Character count warning */}
                    {isNearLimit && !isOverLimit && (
                      <div className="flex items-center gap-1 text-xs text-orange-500">
                        <AlertCircle className="h-3 w-3" />
                        {Math.round((characterCount / MAX_CHARACTERS) * 100)}%
                        wykorzystane
                      </div>
                    )}

                    {isOverLimit && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        Przekroczono limit znaków
                      </div>
                    )}
                  </FormItem>
                )
              }}
            />

            {/* Streamlined Toolbar */}
            <div className="space-y-3">
              {/* Main Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {/* Media Upload */}
                  <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const fl = Array.from(e.target.files || [])
                      if (fl.length) setImageFiles((prev) => [...prev, ...fl])
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Dodaj obraz"
                    onClick={() => imgInputRef.current?.click()}
                    className="h-8 w-8 p-0"
                  >
                    <ImageIcon className="size-4" />
                  </Button>

                  <input
                    ref={vidInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const fl = Array.from(e.target.files || [])
                      if (fl.length) setVideoFiles((prev) => [...prev, ...fl])
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Dodaj wideo"
                    onClick={() => vidInputRef.current?.click()}
                    className="h-8 w-8 p-0"
                  >
                    <VideoIcon className="size-4" />
                  </Button>

                  {/* Formatting Tools */}
                  <div className="flex items-center gap-1 border-l pl-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Pogrubienie (Ctrl+B)"
                      onClick={() =>
                        formatText(form.getValues("content"), "bold")
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Bold className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Kursywa (Ctrl+I)"
                      onClick={() =>
                        formatText(form.getValues("content"), "italic")
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Italic className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Kod"
                      onClick={() =>
                        formatText(form.getValues("content"), "code")
                      }
                      className="h-8 w-8 p-0"
                    >
                      <Code className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Link (Ctrl+K)"
                      onClick={() => insertAtCursor("[link text](url)")}
                      className="h-8 w-8 p-0"
                    >
                      <LinkIcon className="size-4" />
                    </Button>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 border-l pl-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Dodaj hashtag"
                      onClick={() => insertAtCursor("#")}
                      className="h-8 w-8 p-0"
                    >
                      <Hash className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Dodaj wzmiankę"
                      onClick={() => insertAtCursor("@")}
                      className="h-8 w-8 p-0"
                    >
                      <AtSign className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Podgląd"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-8 w-8 p-0"
                  >
                    {showPreview ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Szablony"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="h-8 w-8 p-0"
                  >
                    <FileText className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Zaplanuj post"
                    onClick={() => setShowScheduling(!showScheduling)}
                    className="h-8 w-8 p-0"
                  >
                    <Calendar className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Content Stats */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-4">
                  {form.getValues("content") && (
                    <div className="flex items-center gap-2">
                      {extractHashtagsAndMentions(form.getValues("content"))
                        .hashtags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {
                            extractHashtagsAndMentions(
                              form.getValues("content"),
                            ).hashtags.length
                          }
                        </div>
                      )}
                      {extractHashtagsAndMentions(form.getValues("content"))
                        .mentions.length > 0 && (
                        <div className="flex items-center gap-1">
                          <AtSign className="h-3 w-3" />
                          {
                            extractHashtagsAndMentions(
                              form.getValues("content"),
                            ).mentions.length
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {draftSaved && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Szkic zapisany
                    </div>
                  )}
                  {lastSaved && (
                    <span>
                      Ostatnio zapisany: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Emoji and Community Question */}
            <div className="flex flex-wrap items-center gap-2">
              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Wstaw emoji"
                    className="flex items-center gap-1"
                  >
                    <Smile className="size-4" />
                    Emoji
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-60"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <EmojiPicker
                    data={data}
                    onEmojiSelect={(emoji: {
                      native?: string
                      shortcodes?: string
                    }) => {
                      const native = emoji.native || emoji.shortcodes || ""
                      if (native) addEmoji(native)
                      setEmojiOpen(false)
                    }}
                    theme="auto"
                    navPosition="bottom"
                    previewPosition="none"
                  />
                </PopoverContent>
              </Popover>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Wylosuj pytanie dla społeczności"
                onClick={fetchCommunityQuestion}
                disabled={questionLoading}
                className="flex items-center gap-1"
              >
                <Sparkles className="size-4" />
                {questionLoading ? "Losuję…" : "Pytanie"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Zapisz szkic"
                onClick={saveDraft}
                className="flex items-center gap-1"
              >
                <Save className="size-4" />
                Zapisz szkic
              </Button>
            </div>

            {/* Selected attachments preview */}
            {(imagePreviews.length > 0 || videoPreviews.length > 0) && (
              <div className="flex flex-wrap items-center gap-3">
                {imagePreviews.map((url, idx) => {
                  const safe = safeBlobUrl(url)
                  if (!safe) return null
                  return (
                    <div key={url} className="relative">
                      <Image
                        src={safe}
                        alt={`Podgląd obrazu ${idx + 1}`}
                        width={160}
                        height={80}
                        className="h-20 w-auto max-w-[160px] rounded object-cover border"
                      />
                      <button
                        type="button"
                        aria-label="Usuń obraz"
                        onClick={() =>
                          setImageFiles((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute -right-2 -top-2 inline-flex items-center justify-center rounded-full bg-background border p-1 shadow"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  )
                })}
                {videoPreviews.map((url, idx) => {
                  const safe = safeBlobUrl(url)
                  if (!safe) return null
                  return (
                    <div key={url} className="relative">
                      <video
                        src={safe}
                        className="h-20 w-auto max-w-[200px] rounded border"
                        controls
                        muted
                      />
                      <button
                        type="button"
                        aria-label="Usuń wideo"
                        onClick={() =>
                          setVideoFiles((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute -right-2 -top-2 inline-flex items-center justify-center rounded-full bg-background border p-1 shadow"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Community question preview & toggle */}
            {question && (
              <div className="rounded-md border p-3 bg-muted/30 text-sm">
                <div className="font-medium mb-1">Pytanie społeczności</div>
                <div className="text-muted-foreground">{question}</div>
                <label className="mt-2 inline-flex items-center gap-2 text-xs select-none">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={attachQuestion}
                    onChange={(e) => setAttachQuestion(e.target.checked)}
                  />
                  Dołącz pytanie nad treścią posta
                </label>
              </div>
            )}

            {/* Link preview attach toggle */}
            {firstUrl && (
              <div className="rounded-md border p-3 text-sm flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">Podgląd linku</div>
                  <div className="text-muted-foreground truncate max-w-[32ch]">
                    {firstUrl}
                  </div>
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

            {/* Live Preview */}
            {showPreview && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="h-4 w-4" />
                  Podgląd posta
                </div>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="space-y-2">
                    {form.getValues("content") && (
                      <div className="prose prose-sm max-w-none">
                        {form
                          .getValues("content")
                          .split("\n")
                          .map((line, index) => {
                            if (line.startsWith("**") && line.endsWith("**")) {
                              return (
                                <strong key={index}>{line.slice(2, -2)}</strong>
                              )
                            }
                            if (line.startsWith("*") && line.endsWith("*")) {
                              return <em key={index}>{line.slice(1, -1)}</em>
                            }
                            if (line.startsWith("__") && line.endsWith("__")) {
                              return <u key={index}>{line.slice(2, -2)}</u>
                            }
                            if (line.startsWith("`") && line.endsWith("`")) {
                              return (
                                <code
                                  key={index}
                                  className="bg-muted px-1 py-0.5 rounded text-sm"
                                >
                                  {line.slice(1, -1)}
                                </code>
                              )
                            }
                            if (line.startsWith("> ")) {
                              return (
                                <blockquote
                                  key={index}
                                  className="border-l-4 border-primary pl-4 italic"
                                >
                                  {line.slice(2)}
                                </blockquote>
                              )
                            }
                            if (line.match(/\[([^\]]+)\]\(([^)]+)\)/)) {
                              const match = line.match(
                                /\[([^\]]+)\]\(([^)]+)\)/,
                              )
                              if (match) {
                                return (
                                  <a
                                    key={index}
                                    href={match[2]}
                                    className="text-primary hover:underline"
                                  >
                                    {match[1]}
                                  </a>
                                )
                              }
                            }
                            if (line.includes("#")) {
                              return (
                                <span key={index}>
                                  {line.split(/(#\w+)/).map((part, i) =>
                                    part.match(/#\w+/) ? (
                                      <span
                                        key={i}
                                        className="text-primary font-medium"
                                      >
                                        #{part.slice(1)}
                                      </span>
                                    ) : (
                                      part
                                    ),
                                  )}
                                </span>
                              )
                            }
                            if (line.includes("@")) {
                              return (
                                <span key={index}>
                                  {line.split(/(@\w+)/).map((part, i) =>
                                    part.match(/@\w+/) ? (
                                      <span
                                        key={i}
                                        className="text-blue-500 font-medium"
                                      >
                                        {part}
                                      </span>
                                    ) : (
                                      part
                                    ),
                                  )}
                                </span>
                              )
                            }
                            return <span key={index}>{line}</span>
                          })}
                      </div>
                    )}
                    {imagePreviews.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {imagePreviews.map((url, idx) => {
                          const safe = safeBlobUrl(url)
                          if (!safe) return null
                          return (
                            <Image
                              key={url}
                              src={safe}
                              alt={`Podgląd ${idx + 1}`}
                              width={200}
                              height={96}
                              className="h-24 w-auto rounded object-cover"
                            />
                          )
                        })}
                      </div>
                    )}
                    {videoPreviews.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {videoPreviews.map((url) => {
                          const safe = safeBlobUrl(url)
                          if (!safe) return null
                          return (
                            <video
                              key={url}
                              src={safe}
                              className="h-24 w-auto rounded"
                              controls
                              muted
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Templates */}
            {showTemplates && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Szablony postów
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "🎉 **Świętuję dzisiaj!**\n\nDzięki za wszystkie życzenia!",
                    "💭 **Moje przemyślenia:**\n\nDziś chciałbym podzielić się...",
                    "📚 **Czytam właśnie:**\n\nPolecam wszystkim!",
                    "🎵 **Muzyka dnia:**\n\nTa piosenka idealnie oddaje mój nastrój.",
                    "🏳️‍🌈 **Pride Month:**\n\nDzięki za wsparcie społeczności LGBTQ+!",
                    "💪 **Motywacja na dziś:**\n\nPamiętajcie - każdy dzień to nowa szansa!",
                    "🌍 **Środowisko:**\n\nMałe kroki, wielkie zmiany.",
                    "🎨 **Kreatywność:**\n\nInspiracja jest wszędzie wokół nas.",
                  ].map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                      className="justify-start text-left h-auto p-3"
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-xs text-muted-foreground">
                          Szablon {index + 1}
                        </div>
                        <div className="text-sm line-clamp-2">
                          {template.split("\n")[0]}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduling */}
            {showScheduling && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Zaplanuj post
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        schedulePost(new Date(Date.now() + 30 * 60 * 1000))
                      } // 30 minutes
                    >
                      Za 30 min
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        schedulePost(new Date(Date.now() + 60 * 60 * 1000))
                      } // 1 hour
                    >
                      Za 1 godzinę
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        schedulePost(new Date(Date.now() + 24 * 60 * 60 * 1000))
                      } // 1 day
                    >
                      Za 1 dzień
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        schedulePost(
                          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        )
                      } // 1 week
                    >
                      Za 1 tydzień
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Wybierz datę i godzinę:
                    </label>
                    <input
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => {
                        if (e.target.value) {
                          schedulePost(new Date(e.target.value))
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>

                  {scheduledDate && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          Zaplanowany na: {scheduledDate.toLocaleString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelSchedule}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem className="w-full sm:w-40">
                      <FormLabel className="sr-only">Widoczność</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger aria-label="Widoczność posta">
                          <SelectValue placeholder="Publiczny" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Publiczny</SelectItem>
                          <SelectItem value="friends">Tylko znajomi</SelectItem>
                          <SelectItem value="unlisted">
                            Nielistowany (z linkiem)
                          </SelectItem>
                          <SelectItem value="private">Prywatny</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Draft status indicator */}
                {draftSaved && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Szkic zapisany
                  </div>
                )}

                {lastSaved && !draftSaved && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Ostatnio zapisany: {lastSaved.toLocaleTimeString()}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearDraft}
                  disabled={!form.getValues("content").trim()}
                  className="flex items-center gap-1"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Wyczyść
                </Button>

                {scheduledDate ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelSchedule}
                    className="flex items-center gap-1"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                    Anuluj planowanie
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowScheduling(true)}
                    className="flex items-center gap-1"
                    size="sm"
                  >
                    <Calendar className="h-4 w-4" />
                    Zaplanuj
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1"
                  size="sm"
                >
                  {showPreview ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showPreview ? "Ukryj podgląd" : "Podgląd"}
                </Button>

                <Button
                  type="submit"
                  disabled={loading || characterCount > MAX_CHARACTERS}
                  className="flex items-center gap-1 flex-1 sm:flex-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publikuję…
                    </>
                  ) : scheduledDate ? (
                    <>
                      <Calendar className="h-4 w-4" />
                      Zaplanuj
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Opublikuj
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
