"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { getSupabase } from "@/lib/supabase-browser"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2, MessageCircle, Flag } from "lucide-react"
import Textarea from "@/components/ui/textarea"
import { RainbowLikeButton } from "@/components/ui/rainbow-like-button"
import { CommentSection } from "@/components/ui/comment-section"

export type PostRecord = {
  id: string
  user_id: string
  content: string
  visibility: "public" | "friends" | "private" | "unlisted"
  created_at: string
  media_urls?: string[] | null
  hashtags?: string[] | null
}

function visibilityLabel(v: PostRecord["visibility"]) {
  switch (v) {
    case "public": return "Publiczny"
    case "friends": return "Tylko znajomi"
    case "private": return "Prywatny"
    case "unlisted": return "Nielistowany"
  }
}

export function PostItem({ post, canManage, onChange }: { post: PostRecord; canManage?: boolean; onChange?: (type: "updated" | "deleted", post: PostRecord) => void }) {
  const supabase = getSupabase()
  const router = useRouter()
  type ProfilePreview = { username: string; display_name: string | null; avatar_url: string | null; bio: string | null; pronouns: string | null; sexual_orientation: string[] | null; gender_identity: string[] | null }
  const [mentionProfiles, setMentionProfiles] = useState<Record<string, ProfilePreview>>({})
  type Author = { id: string; username: string; display_name: string | null; avatar_url: string | null; pronouns: string | null }
  const [author, setAuthor] = useState<Author | null>(null)
  const [owner, setOwner] = useState(false)
  const [editing, setEditing] = useState(false)
  const [contentDraft, setContentDraft] = useState(post.content)
  const [busy, setBusy] = useState(false)
  // Report dialog state
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<"hate_speech" | "harassment" | "spam" | "inappropriate_content" | "other">("inappropriate_content")
  const [reportDesc, setReportDesc] = useState("")
  const [reportBusy, setReportBusy] = useState(false)
  // Interactions state
  const [likesCount, setLikesCount] = useState<number>(0)
  const [commentsCount, setCommentsCount] = useState<number>(0)
  const [isLiked, setIsLiked] = useState(false)
  const [currentUserLike, setCurrentUserLike] = useState<{ rainbow_color: string } | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  type DashboardComment = {
    id: string
    content: string
    created_at: string
    user: { id: string; username: string; display_name: string; avatar_url?: string; pronouns?: string }
    likes_count: number
    replies_count: number
    is_liked: boolean
    parent_id?: string
    replies?: DashboardComment[]
  }
  const [comments, setComments] = useState<DashboardComment[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  // Parse mentions from content (usernames only)
  useEffect(() => {
    const m = Array.from(post.content.matchAll(/(^|\s)@([a-z0-9_]{3,30})/gi)).map(x=>x[2].toLowerCase())
    async function load() {
      if (!supabase || m.length === 0) return
      const { data } = await supabase.from("profiles").select("username,display_name,avatar_url,bio,pronouns,sexual_orientation,gender_identity").in("username", m)
      const map: Record<string, ProfilePreview> = {}
      ;(data as ProfilePreview[] | null || []).forEach((p) => { map[p.username.toLowerCase()] = p })
      setMentionProfiles(map)
    }
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id])
  // Load author details
  useEffect(() => {
    let cancelled = false
    async function loadAuthor() {
      if (!supabase) return
      const { data } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,pronouns")
        .eq("id", post.user_id)
        .single()
      if (!cancelled) setAuthor((data as Author) || null)
    }
    void loadAuthor()
    return () => { cancelled = true }
  }, [post.user_id, supabase])

  // Decide if current user can manage this post
  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!supabase) return
      const u = (await supabase.auth.getUser()).data.user
      if (!u) return
      if (!cancelled) setOwner(!!(canManage ?? (u.id === post.user_id)))
    }
    void check()
    return () => { cancelled = true }
  }, [supabase, post.user_id, canManage])

  // Load current user and initial interaction state/counts
  useEffect(() => {
    let cancelled = false
    async function init() {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      const uid = user?.id
      setCurrentUserId(uid)

      // counts
      const [likesRes, commentsRes] = await Promise.all([
        supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", post.id),
        supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("post_id", post.id),
      ])
      if (likesRes.count !== null) setLikesCount(likesRes.count)
      if (commentsRes.count !== null) setCommentsCount(commentsRes.count)

      // like state
      if (uid) {
        const { data: likeRow } = await supabase
          .from("post_likes")
          .select("rainbow_color")
          .eq("post_id", post.id)
          .eq("user_id", uid)
          .maybeSingle()
        if (likeRow) {
          setIsLiked(true)
          setCurrentUserLike({ rainbow_color: likeRow.rainbow_color as string })
        } else {
          setIsLiked(false)
          setCurrentUserLike(null)
        }
      }
    }
    void init()
    return () => { cancelled = true }
  }, [post.id, supabase])

  // Load comments (flat and then build simple threads) when shown
  async function loadComments() {
    if (!supabase) return
    setCommentsLoading(true)
    try {
      const { data } = await supabase
        .from("post_comments")
        .select("id,content,created_at,user_id,parent_id")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true })
      const rows = (data || []) as { id: string; content: string; created_at: string; user_id: string; parent_id: string | null }[]
      const userIds = Array.from(new Set(rows.map(r => r.user_id)))
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,pronouns")
        .in("id", userIds)
      type ProfileMini = { id: string; username: string; display_name: string | null; avatar_url: string | null; pronouns: string | null }
      const profMap = new Map<string, ProfileMini>((profs as ProfileMini[] || []).map(p => [p.id, p]))
      const enriched: DashboardComment[] = rows.map(r => ({
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        user: {
          id: r.user_id,
          username: profMap.get(r.user_id)?.username || "",
          display_name: profMap.get(r.user_id)?.display_name || profMap.get(r.user_id)?.username || "",
          avatar_url: profMap.get(r.user_id)?.avatar_url || undefined,
          pronouns: profMap.get(r.user_id)?.pronouns || undefined,
        },
        likes_count: 0,
        replies_count: 0,
        is_liked: false,
        parent_id: r.parent_id || undefined,
      }))
      // build simple thread
      const byId = new Map<string, DashboardComment>(enriched.map(e => [e.id, { ...e, replies: [] }]))
      const top: DashboardComment[] = []
      byId.forEach((c) => {
        if (c.parent_id && byId.get(c.parent_id)) {
          const parent = byId.get(c.parent_id)!
          parent.replies = parent.replies || []
          parent.replies.push(c)
          parent.replies_count = parent.replies.length
        } else {
          top.push(c)
        }
      })
      setComments(top)
    } finally {
      setCommentsLoading(false)
    }
  }

  // Interaction handlers
  const handleLike = async (color: string) => {
    if (!supabase || !currentUserId) return
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: post.id, user_id: currentUserId, rainbow_color: color })
    if (!error) {
      setIsLiked(true)
      setCurrentUserLike({ rainbow_color: color })
      setLikesCount(c => c + 1)
    }
  }
  const handleUnlike = async () => {
    if (!supabase || !currentUserId) return
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", post.id)
      .eq("user_id", currentUserId)
    if (!error) {
      setIsLiked(false)
      setCurrentUserLike(null)
      setLikesCount(c => Math.max(0, c - 1))
    }
  }
  const handleAddComment = async (content: string, parentId?: string) => {
    if (!supabase || !currentUserId) return
    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: post.id, user_id: currentUserId, content, parent_id: parentId || null })
    if (!error) {
      setCommentsCount(c => c + 1)
      // reload list if open
      if (showComments) await loadComments()
    }
  }
  // Comment like/unlike helpers – rely on a table `post_comment_likes` if present; update UI optimistically
  function updateCommentInTree(list: DashboardComment[], id: string, updater: (c: DashboardComment) => DashboardComment): DashboardComment[] {
    return list.map((c) => {
      if (c.id === id) return updater({ ...c })
      if (c.replies && c.replies.length) {
        const updatedReplies = updateCommentInTree(c.replies, id, updater)
        if (updatedReplies !== c.replies) {
          return { ...c, replies: updatedReplies, replies_count: updatedReplies.length }
        }
      }
      return c
    })
  }
  function removeCommentFromTree(list: DashboardComment[], id: string): DashboardComment[] {
    let changed = false
    const filtered = list.filter((c) => {
      if (c.id === id) { changed = true; return false }
      return true
    }).map((c) => {
      if (c.replies && c.replies.length) {
        const newReplies = removeCommentFromTree(c.replies, id)
        if (newReplies !== c.replies) {
          changed = true
          return { ...c, replies: newReplies, replies_count: newReplies.length }
        }
      }
      return c
    })
    return changed ? filtered : list
  }
  const handleLikeComment = async (commentId: string) => {
    if (!supabase || !currentUserId) return
    // Optimistic UI
    setComments((prev) => updateCommentInTree(prev, commentId, (c) => ({ ...c, is_liked: true, likes_count: c.likes_count + 1 })))
    try {
      await supabase.from('post_comment_likes').insert({ comment_id: commentId, user_id: currentUserId })
    } catch {}
  }
  const handleUnlikeComment = async (commentId: string) => {
    if (!supabase || !currentUserId) return
    setComments((prev) => updateCommentInTree(prev, commentId, (c) => ({ ...c, is_liked: false, likes_count: Math.max(0, c.likes_count - 1) })))
    try {
      await supabase.from('post_comment_likes').delete().eq('comment_id', commentId).eq('user_id', currentUserId)
    } catch {}
  }
  const handleDeleteComment = async (commentId: string) => {
    if (!supabase || !currentUserId) return
    // Optimistic
    setComments((prev) => removeCommentFromTree(prev, commentId))
    setCommentsCount((c) => Math.max(0, c - 1))
    try {
      await supabase.from('post_comments').delete().eq('id', commentId).eq('user_id', currentUserId)
    } catch {}
  }
  // Reshare functionality temporarily removed
  function renderContent(text: string) {
    // linkify hashtags and mentions
    const parts = text.split(/(#[\p{L}0-9_]{2,30}|@[a-z0-9_]{3,30})/giu)
    return parts.map((p, i) => {
          if (/^#[\p{L}0-9_]{2,30}$/iu.test(p)) {
            const tag = p.slice(1)
            return (
              <a
                key={i}
                href={`/dashboard?hashtag=${encodeURIComponent(tag.toLowerCase())}`}
                className="text-primary hover:underline font-medium"
                onClick={(e) => {
                  e.preventDefault()
                  // Use router push instead of window.location for smoother UX
                  router.push(`/dashboard?hashtag=${encodeURIComponent(tag.toLowerCase())}`)
                }}
              >
                {p}
              </a>
            )
      } else if (/^@[a-z0-9_]{3,30}$/i.test(p)) {
        const uname = p.slice(1).toLowerCase()
        const prof = mentionProfiles[uname]
        if (!prof) return <span key={i} className="text-primary">{p}</span>
        return (
          <HoverCard key={i}>
            <HoverCardTrigger asChild>
              <a href={`/u/${uname}`} className="text-primary hover:underline">{p}</a>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-muted border" aria-hidden>
                  {prof.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={prof.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{prof.display_name || prof.username}</div>
                  {prof.pronouns && <div className="text-xs"><Badge variant="outline">{prof.pronouns}</Badge></div>}
                  {prof.bio && <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{prof.bio}</p>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(prof.sexual_orientation || []).map((o: string, idx: number)=>(<Badge key={`o${idx}`} variant="secondary">{o}</Badge>))}
                    {(prof.gender_identity || []).map((g: string, idx: number)=>(<Badge key={`g${idx}`}>{g}</Badge>))}
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )
      }
      return <span key={i}>{p}</span>
    })
  }
  // Classify media: gallery (images/videos) vs external links (OG/Tenor)
  const media = (post.media_urls || [])
  const isImage = (u: string) => /\.(webp|png|jpe?g|gif|avif|bmp)$/i.test(u)
  const isVideo = (u: string) => /\.(webm|mp4|mov|avi|mkv|m4v)$/i.test(u)
  const galleryMedia = media.filter((u) => isImage(u) || isVideo(u))
  const linkMedia = media.filter((u) => !(isImage(u) || isVideo(u)))

  // Update helpers
  function extractHashtags(text: string) {
    return Array.from(text.matchAll(/#[\p{L}0-9_]{2,30}/giu)).map((m)=>m[0].slice(1).toLowerCase())
  }
  async function saveEdit() {
    if (!supabase) return
    try {
      setBusy(true)
      const hashtags = extractHashtags(contentDraft)
      await supabase
        .from("posts")
        .update({ content: contentDraft, hashtags: hashtags.length ? hashtags : null, updated_at: new Date().toISOString() })
        .eq("id", post.id)
      setEditing(false)
      if (onChange) onChange("updated", { ...post, content: contentDraft, hashtags })
    } finally {
      setBusy(false)
    }
  }
  async function removePost() {
    if (!supabase) return
    if (!confirm("Usunąć ten post?")) return
    try {
      setBusy(true)
      await supabase.from("posts").delete().eq("id", post.id)
      if (onChange) onChange("deleted", post)
    } finally {
      setBusy(false)
    }
  }

  async function submitReport() {
    if (!supabase) return
    try {
      setReportBusy(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('moderation_reports').insert({
        reporter_id: user.id,
        target_type: 'post',
        target_id: post.id,
        reason: reportReason,
        description: reportDesc || null,
        target_meta: { author_id: post.user_id, created_at: post.created_at }
      })
      setReportOpen(false)
      setReportDesc("")
    } finally {
      setReportBusy(false)
    }
  }

  return (
    <>
  <Card className="py-0">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={author?.username ? `/u/${author.username}` : "#"} className="flex items-center gap-3 min-w-0">
              <Avatar>
                <AvatarImage src={author?.avatar_url || undefined} alt={author?.username || ""} />
                <AvatarFallback>{(author?.display_name || author?.username || "U").slice(0,1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium truncate">{author?.display_name || author?.username || "Użytkownik"}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {author?.username && <span className="truncate">@{author.username}</span>}
                  {author?.pronouns && <Badge variant="outline">{author.pronouns}</Badge>}
                  <span className="whitespace-nowrap">{new Date(post.created_at).toLocaleString()}</span>
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{visibilityLabel(post.visibility)}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Akcje posta">
                  <MoreHorizontal className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {owner && (
                  <DropdownMenuItem onClick={() => { setContentDraft(post.content); setEditing(true) }}>
                    <Pencil className="size-4" /> Edytuj
                  </DropdownMenuItem>
                )}
                {owner && (
                  <DropdownMenuItem onClick={removePost} className="text-red-600 focus:text-red-700">
                    <Trash2 className="size-4" /> Usuń
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                  <Flag className="size-4" /> Zgłoś
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{renderContent(post.content)}</div>
        {(galleryMedia.length > 0) && (
          <div className="mt-2">
            <MediaGallery urls={galleryMedia} />
          </div>
        )}
        {(linkMedia.length > 0) && (
          <div className="mt-2 grid gap-2">
            {linkMedia.map((url, idx) => (
              <div key={idx} className="rounded-md overflow-hidden border bg-muted">
                {url.includes("tenor.com") ? (
                  <iframe src={url} className="w-full" style={{ aspectRatio: "16 / 9" }} title="Tenor GIF" />
                ) : (
                  <OGCard url={url} />
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Hashtags Display */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mt-3 pt-2 border-t">
            <div className="flex flex-wrap gap-1">
              {post.hashtags.map((hashtag, idx) => (
                <a
                  key={idx}
                  href={`/dashboard?hashtag=${encodeURIComponent(hashtag.toLowerCase())}`}
                  onClick={(e) => {
                    e.preventDefault()
                    router.push(`/dashboard?hashtag=${encodeURIComponent(hashtag.toLowerCase())}`)
                  }}
                  className="text-xs text-primary hover:text-primary/80 hover:underline font-medium"
                >
                  #{hashtag}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-1">
            <RainbowLikeButton
              isLiked={isLiked}
              likesCount={likesCount}
              currentUserLike={currentUserLike}
              onLike={handleLike}
              onUnlike={handleUnlike}
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => { setShowComments(v => !v); if (!showComments) await loadComments() }}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{commentsCount || ""}</span>
            </Button>

            {/* Reshare button removed for now */}
          </div>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="border-t pt-4">
            <CommentSection
              comments={comments}
              isLoading={commentsLoading}
              onAddComment={handleAddComment}
              onLikeComment={handleLikeComment}
              onUnlikeComment={handleUnlikeComment}
              onDeleteComment={handleDeleteComment}
              currentUserId={currentUserId}
            />
          </div>
        )}
        
  {/* Removed details link; author info shown in header */}
      </CardContent>
    </Card>

    {/* Edit dialog */}
    <Dialog open={editing} onOpenChange={setEditing}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edytuj post</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Textarea rows={6} value={contentDraft} onChange={(e)=>setContentDraft(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setEditing(false)}>Anuluj</Button>
            <Button onClick={saveEdit} disabled={busy}>{busy ? "Zapisywanie…" : "Zapisz"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Report dialog */}
    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Zgłoś post</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="text-sm font-medium">Powód</label>
          <select
            className="rounded-md border bg-background px-2 py-1 text-sm"
            value={reportReason}
            onChange={(e)=> setReportReason(e.target.value as typeof reportReason)}
          >
            <option value="inappropriate_content">Nieodpowiednia treść</option>
            <option value="hate_speech">Mowa nienawiści</option>
            <option value="harassment">Nękanie</option>
            <option value="spam">Spam</option>
            <option value="other">Inne</option>
          </select>
          <label className="text-sm font-medium">Opis (opcjonalnie)</label>
          <Textarea rows={4} value={reportDesc} onChange={(e)=> setReportDesc(e.target.value)} placeholder="Dodaj szczegóły dla moderatora" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=> setReportOpen(false)}>Anuluj</Button>
            <Button onClick={submitReport} disabled={reportBusy}>{reportBusy ? "Wysyłanie…" : "Wyślij zgłoszenie"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

function OGCard({ url }: { url: string }) {
  const [data, setData] = useState<{ title?: string; description?: string; image?: string; siteName?: string } | null>(null)
  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        if (!res.ok) return
        const j = await res.json()
        if (!cancelled) setData(j)
      } catch {}
    }
    void run()
    return () => { cancelled = true }
  }, [url])
  if (!data) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <div className="p-3 bg-background">
          <div className="text-sm font-medium truncate">{new URL(url).hostname}</div>
          <div className="text-xs text-muted-foreground truncate">{url}</div>
        </div>
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex gap-3 p-3 bg-background">
      {data.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.image} alt="" className="h-20 w-20 object-cover rounded" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{data.title || new URL(url).hostname}</div>
        {data.siteName && <div className="text-xs text-muted-foreground truncate">{data.siteName}</div>}
        {data.description && <div className="text-xs text-muted-foreground line-clamp-2">{data.description}</div>}
      </div>
    </a>
  )
}

function MediaGallery({ urls }: { urls: string[] }) {
  // Show up to 4 tiles; overlay +N on the last if more
  const maxTiles = 4
  const show = urls.slice(0, maxTiles)
  const extra = urls.length - show.length
  const isImg = (u: string) => /\.(webp|png|jpe?g|gif|avif|bmp)$/i.test(u)
  const isVid = (u: string) => /\.(webm|mp4|mov|avi|mkv|m4v)$/i.test(u)

  const gridCols = show.length === 1 ? "grid-cols-1" : "grid-cols-2"
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const openAt = (i: number) => { setIndex(i); setOpen(true) }
  const prev = (e?: React.MouseEvent) => { e?.stopPropagation?.(); setIndex((i)=> (i-1+urls.length)%urls.length) }
  const next = (e?: React.MouseEvent) => { e?.stopPropagation?.(); setIndex((i)=> (i+1)%urls.length) }

  return (
    <>
      <div className={`grid ${gridCols} gap-2`}>
        {show.map((url, idx) => {
          const isLast = idx === show.length - 1 && extra > 0
          return (
            <button
              key={idx}
              type="button"
              aria-label="Podgląd"
              className="relative overflow-hidden rounded-md border bg-background focus:outline-none"
              onClick={() => openAt(idx)}
            >
              {isImg(url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="media" className="h-40 w-full object-cover" />
              ) : isVid(url) ? (
                <video src={url} className="h-40 w-full object-cover" muted playsInline />
              ) : null}
              {isLast && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">+{extra}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-2 sm:max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Podgląd multimediów</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <div className="max-h-[80vh] flex items-center justify-center">
              {isImg(urls[index]) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[index]} alt="Podgląd" className="max-h-[80vh] w-auto max-w-full object-contain rounded" />
              ) : (
                <video src={urls[index]} controls className="max-h-[80vh] w-auto max-w-full object-contain rounded" />
              )}
            </div>
            {urls.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Poprzedni"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur border p-2 shadow"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Następny"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur border p-2 shadow"
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 backdrop-blur rounded px-2 py-0.5 border">
                  {index + 1} / {urls.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
