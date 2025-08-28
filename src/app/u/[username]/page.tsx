"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Textarea from "@/components/ui/textarea"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  MapPin,
  Link as LinkIcon,
  Globe,
  AtSign,
  Loader2,
  Camera,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import {
  PostItem,
  PostRecord as FeedPost,
} from "@/components/dashboard/post-item"
import type { ProfileVisibility } from "@/types/profile"

// Lightweight crop view components (drag to pan, wheel/slider to zoom)
type CropCommonProps = {
  src: string | null
  natSize: { w: number; h: number } | null
  frameW: number
  frameH: number
  scale: number
  minScale: number
  offset: { x: number; y: number }
  dragging: boolean
  onPointerStart: (x: number, y: number) => void
  onPointerMove: (x: number, y: number) => void
  onPointerEnd: () => void
  onZoom: (nextScale: number) => void
}

function CropRect(props: CropCommonProps) {
  const {
    src,
    natSize,
    frameW,
    frameH,
    scale,
    offset,
    onPointerStart,
    onPointerMove,
    onPointerEnd,
    onZoom,
  } = props

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    ;(e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId)
    onPointerStart(e.clientX, e.clientY)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return
    onPointerMove(e.clientX, e.clientY)
  }
  const handlePointerUp = () => onPointerEnd()
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const next = scale * (1 - e.deltaY * 0.001)
    onZoom(next)
  }

  const dw = natSize ? natSize.w * scale : frameW
  const dh = natSize ? natSize.h * scale : frameH
  const left = frameW / 2 - dw / 2 + offset.x
  const top = frameH / 2 - dh / 2 + offset.y

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    // No-op here; parent manages recenter logic on zoom/drag
  }

  // Sanitize image src to allowed schemes and basic patterns
  function safeImageSrc(raw: string | null): string | undefined {
    if (!raw) return undefined
    // Allow in-app relative paths
    if (raw.startsWith("/")) return raw
    try {
      const u = new URL(
        raw,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost",
      )
      const proto = u.protocol
      if (proto === "http:" || proto === "https:" || proto === "blob:")
        return u.toString()
      if (proto === "data:") {
        // Only allow data:image/*
        return /^data:image\/(png|jpeg|jpg|webp|gif|avif|bmp);/i.test(raw)
          ? raw
          : undefined
      }
      return undefined
    } catch {
      return undefined
    }
  }

  const safeSrc = safeImageSrc(src)

  return (
    <div
      className="relative select-none touch-none"
      style={{ width: `${frameW}px`, height: `${frameH}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      role="img"
      aria-label="Obszar kadrowania tła"
    >
      <div className="absolute inset-0 overflow-hidden rounded-md border border-white/30 bg-black/5">
        {safeSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={safeSrc}
            alt=""
            draggable={false}
            className="absolute will-change-transform"
            style={{
              width: `${dw}px`,
              height: `${dh}px`,
              transform: `translate(${left}px, ${top}px)`,
            }}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            Wybierz obraz
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-white/50" />
      </div>
    </div>
  )
}

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  cover_image_url: string | null
  sexual_orientation: string[] | null
  gender_identity: string[] | null
  pronouns: string | null
  website: string | null
  email: string | null
  social_links: Record<string, string> | null
  city: string | null
  country: string | null
  profile_visibility: ProfileVisibility
  show_location: boolean
  show_orientation: boolean
  show_friends?: boolean | null
  // New contact/social usernames and privacy flags
  contact_whatsapp?: string | null
  contact_telegram?: string | null
  contact_signal?: string | null
  instagram_username?: string | null
  twitter_username?: string | null
  tiktok_username?: string | null
  show_contacts?: boolean | null
  show_socials?: boolean | null
  roles?:
    | (
        | "user"
        | "company"
        | "user-supporter"
        | "company-supporter"
        | "early-tester"
        | "tester"
        | "moderator"
        | "administrator"
        | "super-administrator"
      )[]
    | null
  badges?: string[] | null
}

type PostRecord = FeedPost

type EditValues = {
  display_name: string
  bio: string
  pronouns: string
  sexual_orientation: string
  gender_identity: string
  website: string
  email: string
  instagram: string
  twitter: string
  tiktok: string
  contact_whatsapp: string
  contact_telegram: string
  contact_signal: string
  instagram_username: string
  twitter_username: string
  tiktok_username: string
  city: string
  country: string
  profile_visibility: ProfileVisibility
  show_location: boolean
  show_orientation: boolean
  show_friends: boolean
  show_contacts: boolean
  show_socials: boolean
}

export default function PublicUserPage() {
  const supabase = getSupabase()
  const params = useParams<{ username: string }>()
  const username = params?.username
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isFriend, setIsFriend] = useState<boolean>(false)
  const [connecting, setConnecting] = useState(false)
  const [requestStatus, setRequestStatus] = useState<
    "none" | "pending" | "incoming" | "accepted"
  >("none")
  const [requestId, setRequestId] = useState<string | null>(null)
  const [friends, setFriends] = useState<
    {
      id: string
      username: string | null
      display_name: string | null
      avatar_url: string | null
    }[]
  >([])
  const [isOwner, setIsOwner] = useState(false)
  const [following, setFollowing] = useState<boolean>(false)
  const [followersCount, setFollowersCount] = useState<number>(0)
  const [followingCount, setFollowingCount] = useState<number>(0)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<EditValues>({
    display_name: "",
    bio: "",
    pronouns: "",
    sexual_orientation: "",
    gender_identity: "",
    website: "",
    email: "",
    instagram: "",
    twitter: "",
    tiktok: "",
    contact_whatsapp: "",
    contact_telegram: "",
    contact_signal: "",
    instagram_username: "",
    twitter_username: "",
    tiktok_username: "",
    city: "",
    country: "",
    profile_visibility: "public",
    show_location: true,
    show_orientation: true,
    show_friends: true,
    show_contacts: true,
    show_socials: true,
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Hidden file inputs for avatar/banner selection
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const bannerInputRef = useRef<HTMLInputElement | null>(null)
  // removed interactive avatar crop overlay state (auto-save on pick)
  const [bannerSrc, setBannerSrc] = useState<string | null>(null)
  // Advanced cropper state (drag + zoom)
  // keep only container ref for avatar auto-crop sizing
  const avatarContainerRef = useRef<HTMLDivElement | null>(null)

  const [bannerNatSize, setBannerNatSize] = useState<{
    w: number
    h: number
  } | null>(null)
  const [bannerScale, setBannerScale] = useState(1)
  const [bannerMinScale, setBannerMinScale] = useState(1)
  const [bannerOffset, setBannerOffset] = useState({ x: 0, y: 0 })
  const [bannerDragging, setBannerDragging] = useState(false)
  const [bannerLastPt, setBannerLastPt] = useState<{
    x: number
    y: number
  } | null>(null)
  const [bannerFrameW, setBannerFrameW] = useState(600)
  const [bannerFrameH, setBannerFrameH] = useState(200)
  const bannerAreaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function load() {
      if (!supabase || !username) return
      setLoading(true)
      const { data: prof } = await supabase
        .from("profiles")
        .select(
          "id,username,display_name,bio,avatar_url,cover_image_url,sexual_orientation,gender_identity,pronouns,website,social_links,email,city,country,profile_visibility,show_location,show_orientation,show_friends,contact_whatsapp,contact_telegram,contact_signal,instagram_username,twitter_username,tiktok_username,show_contacts,show_socials,roles,badges",
        )
        .ilike("username", String(username))
        .maybeSingle()
      if (!prof) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const profRow = prof as unknown as Profile
      setProfile(profRow)

      // check friendship and ownership
      const me = (await supabase.auth.getUser()).data.user
      if (me) {
        // Determine ownership by multiple signals (id or username matches)
        const urlUsername = String(username).toLowerCase()
        const metaUsername = (
          me.user_metadata as Record<string, unknown> | null
        )?.username as string | undefined
        let amOwner = me.id === profRow.id
        if (!amOwner && metaUsername) {
          amOwner = urlUsername === metaUsername.toLowerCase()
        }
        if (!amOwner) {
          const { data: myProf } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", me.id)
            .maybeSingle()
          if (myProf?.username) {
            amOwner = urlUsername === String(myProf.username).toLowerCase()
          }
        }
        setIsOwner(amOwner)
        const { data: edges } = await supabase
          .from("friendships")
          .select("id")
          .or(
            `and(user1_id.eq.${me.id},user2_id.eq.${profRow.id}),and(user1_id.eq.${profRow.id},user2_id.eq.${me.id})`,
          )
          .eq("status", "active")
        setIsFriend(!!edges && edges.length > 0)

        // check friend request state
        if (!isFriend) {
          const { data: reqOut } = await supabase
            .from("friend_requests")
            .select("id,status")
            .eq("sender_id", me.id)
            .eq("receiver_id", profRow.id)
            .order("created_at", { ascending: false })
            .limit(1)
          if (reqOut && reqOut.length) {
            setRequestId(reqOut[0].id)
            setRequestStatus(
              reqOut[0].status === "pending" ? "pending" : "accepted",
            )
          } else {
            const { data: reqIn } = await supabase
              .from("friend_requests")
              .select("id,status")
              .eq("sender_id", profRow.id)
              .eq("receiver_id", me.id)
              .order("created_at", { ascending: false })
              .limit(1)
            if (reqIn && reqIn.length) {
              setRequestId(reqIn[0].id)
              setRequestStatus(
                reqIn[0].status === "pending" ? "incoming" : "accepted",
              )
            } else {
              setRequestStatus("none")
              setRequestId(null)
            }
          }
        }

        // follow status and counts
        try {
          const { data: f } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", me.id)
            .eq("following_id", profRow.id)
            .limit(1)
          setFollowing(!!f && f.length > 0)
        } catch {}
        try {
          const followers = await supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("following_id", profRow.id)
          setFollowersCount(followers.count ?? 0)
        } catch {
          setFollowersCount(0)
        }
        try {
          const followingRes = await supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("follower_id", profRow.id)
          setFollowingCount(followingRes.count ?? 0)
        } catch {
          setFollowingCount(0)
        }
      }

      const { data: userPosts } = await supabase
        .from("posts")
        .select(
          "id,user_id,content,visibility,created_at,media_urls,hashtags,community_id",
        )
        .eq("user_id", profRow.id)
        .is("community_id", null)
        .is("hidden_at", null)
        .order("created_at", { ascending: false })
        .limit(20)
      setPosts((userPosts as unknown as PostRecord[]) || [])

      // friends list (respect show_friends)
      if (profRow.show_friends !== false) {
        const { data: edges } = await supabase
          .from("friendships")
          .select("user1_id,user2_id")
          .or(`user1_id.eq.${profRow.id},user2_id.eq.${profRow.id}`)
          .eq("status", "active")
          .limit(50)
        const friendIds = new Set<string>()
        edges?.forEach((e) => {
          if (e.user1_id === profRow.id) friendIds.add(e.user2_id)
          if (e.user2_id === profRow.id) friendIds.add(e.user1_id)
        })
        if (friendIds.size) {
          const { data: fr } = await supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url")
            .in("id", Array.from(friendIds))
            .limit(50)
          setFriends(
            (fr as unknown as {
              id: string
              username: string | null
              display_name: string | null
              avatar_url: string | null
            }[]) || [],
          )
        }
      }
      setLoading(false)
    }
    load()
  }, [supabase, username, isFriend])

  const name = profile?.display_name || profile?.username || username
  const showLocation =
    profile?.show_location && (profile.city || profile.country)
  const orients =
    (profile?.show_orientation ? profile?.sexual_orientation : null) || []
  const genders =
    (profile?.show_orientation ? profile?.gender_identity : null) || []
  const canSeeContacts =
    (profile?.show_contacts ?? true) &&
    (profile?.profile_visibility === "public" || isOwner || isFriend)
  const canSeeSocials =
    (profile?.show_socials ?? true) &&
    (profile?.profile_visibility === "public" || isOwner || isFriend)
  const contactLinks = (() => {
    if (!profile || !canSeeContacts)
      return [] as { label: string; href: string }[]
    const out: { label: string; href: string }[] = []
    const em = (profile.email || "").trim()
    if (em) {
      out.push({ label: em, href: `mailto:${em}` })
    }
    const wa = (profile.contact_whatsapp || "").trim()
    if (wa) {
      // Accept +48 600 ... or digits; strip non-digits except leading +
      const digits = wa.replace(/[^+\d]/g, "")
      const phone = digits.startsWith("+") ? digits.substring(1) : digits
      out.push({ label: "WhatsApp", href: `https://wa.me/${phone}` })
    }
    const tg = (profile.contact_telegram || "").trim()
    if (tg) {
      const handle = tg.replace(/^@/, "")
      out.push({ label: "Telegram", href: `https://t.me/${handle}` })
    }
    const sg = (profile.contact_signal || "").trim()
    if (sg) {
      const digits = sg.replace(/[^+\d]/g, "")
      const phone = digits.startsWith("+") ? digits.substring(1) : digits
      out.push({ label: "Signal", href: `https://signal.me/#p/${phone}` })
    }
    return out
  })()
  const socialLinks = (() => {
    if (!profile || !canSeeSocials)
      return [] as { label: string; href: string }[]
    const out: { label: string; href: string }[] = []
    const ig = (profile.instagram_username || "").trim()
    if (ig)
      out.push({
        label: "Instagram",
        href: `https://instagram.com/${ig.replace(/^@/, "")}`,
      })
    const tw = (profile.twitter_username || "").trim()
    if (tw)
      out.push({
        label: "X (Twitter)",
        href: `https://x.com/${tw.replace(/^@/, "")}`,
      })
    const tk = (profile.tiktok_username || "").trim()
    if (tk)
      out.push({
        label: "TikTok",
        href: `https://tiktok.com/@${tk.replace(/^@/, "")}`,
      })
    return out
  })()

  // Badge color+icon definitions for popovers

  const badgeMeta: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    "user-supporter": {
      label: "Ta osoba wspiera rozwój Tęcza.app!",
      color: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
      icon: "/icons/tecza-badge/user-supporter.svg",
    },
    "company-supporter": {
      label: "Ta osobowość prawna wspiera rozwój Tęcza.app!",
      color: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
      icon: "/icons/tecza-badge/company-supporter.svg",
    },
    "early-tester": {
      label: "Ta osoba testowała Tęcza.app jeszcze jak aplikacja nie działała!",
      color: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
      icon: "/icons/tecza-badge/early-tester.svg",
    },
    tester: {
      label: "Ta osoba testowała Tęcza.app!",
      color: "bg-teal-500/15 text-teal-300 ring-teal-500/30",
      icon: "/icons/tecza-badge/tester.svg",
    },
    moderator: {
      label: "Moderator Tęcza.app",
      color: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
      icon: "/icons/tecza-badge/mod-admin.svg",
    },
    administrator: {
      label: "Administrator Tęcza.app",
      color: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
      icon: "/icons/tecza-badge/mod-admin.svg",
    },
    ambassador: {
      label: "Osoba ambasadorska Tęcza.app",
      color: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30",
      icon: "/icons/tecza-badge/ambassador.svg",
    },
    company: {
      label: "Osobowość prawna",
      color: "bg-purple-500/15 text-purple-300 ring-purple-500/30",
      icon: "/icons/tecza-badge/company.svg",
    },
    banned: {
      label: "Osoba zbanowana",
      color: "bg-gray-700/20 text-gray-300 ring-gray-700/40",
      icon: "/icons/tecza-badge/banned.svg",
    },
    "tecza-team": {
      label: "Tęcza.app Team",
      color: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-500/30",
      icon: "/icons/tecza-badge/tecza-team.svg",
    },
    pride2026: {
      label: "Świętujemy równość w 2026 roku!",
      color: "bg-pink-500/15 text-pink-300 ring-pink-500/30",
      icon: "/icons/tecza-badge/pride2026.svg",
    },
    "hiv-positive-campaigh": {
      label: "Osoba HIV pozytywna - pozytywnie i otwarcie mówi o HIV",
      color: "bg-rose-600/15 text-rose-300 ring-rose-600/30",
      icon: "/icons/tecza-badge/hiv-positive-campaigh.svg",
    },
    "1-anniversary": {
      label: "Jestem już na tęczy od 1 roku",
      color: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
      icon: "/icons/tecza-badge/1-anniversary.svg",
    },
    "3-anniversary": {
      label: "Jestem już na tęczy od 3 lat",
      color: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
      icon: "/icons/tecza-badge/3-anniversary.svg",
    },
    "5-anniversary": {
      label: "Jestem już na tęczy od 5 lat",
      color: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
      icon: "/icons/tecza-badge/5-anniversary.svg",
    },
    "10-anniversary": {
      label: "Jestem już na tęczy od 10 lat",
      color: "bg-yellow-600/15 text-yellow-300 ring-yellow-600/30",
      icon: "/icons/tecza-badge/10-anniversary.svg",
    },
  }

  useEffect(() => {
    if (!profile) return
    const socials = (profile.social_links || {}) as Record<string, string>
    setEditValues({
      display_name: profile.display_name || "",
      bio: profile.bio || "",
      pronouns: profile.pronouns || "",
      sexual_orientation: (profile.sexual_orientation || []).join(", "),
      gender_identity: (profile.gender_identity || []).join(", "),
      website: profile.website || "",
      email: (profile as unknown as { email?: string }).email || "",
      instagram: socials.instagram || "",
      twitter: socials.twitter || "",
      tiktok: socials.tiktok || "",
      contact_whatsapp: (profile.contact_whatsapp || "") as string,
      contact_telegram: (profile.contact_telegram || "") as string,
      contact_signal: (profile.contact_signal || "") as string,
      instagram_username: (profile.instagram_username || "") as string,
      twitter_username: (profile.twitter_username || "") as string,
      tiktok_username: (profile.tiktok_username || "") as string,
      city: profile.city || "",
      country: profile.country || "",
      profile_visibility: profile.profile_visibility || "public",
      show_location: profile.show_location ?? true,
      show_orientation: profile.show_orientation ?? true,
      show_friends: profile.show_friends ?? true,
      show_contacts: profile.show_contacts ?? true,
      show_socials: profile.show_socials ?? true,
    })
  }, [profile])

  async function saveEdits() {
    if (!supabase || !profile) return
    try {
      setIsSaving(true)
      let avatar_url: string | undefined
      let cover_image_url: string | undefined
      if (avatarFile) {
        if (avatarFile.size > 2 * 1024 * 1024) {
          toast.error("Avatar max 2MB")
          return
        }
        const ext = avatarFile.name.split(".").pop() || "jpg"
        const path = `${profile.id}/avatar-${Date.now()}.${ext}`
        const { data: up, error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true })
        if (!upErr) {
          const { data: pub } = await supabase.storage
            .from("avatars")
            .getPublicUrl(up.path)
          avatar_url = pub?.publicUrl
        }
      }
      if (coverFile) {
        if (coverFile.size > 5 * 1024 * 1024) {
          toast.error("Tło max 5MB")
          return
        }
        const ext = coverFile.name.split(".").pop() || "jpg"
        const path = `${profile.id}/cover-${Date.now()}.${ext}`
        const { data: up, error: upErr } = await supabase.storage
          .from("covers")
          .upload(path, coverFile, { upsert: true })
        if (!upErr) {
          const { data: pub } = await supabase.storage
            .from("covers")
            .getPublicUrl(up.path)
          cover_image_url = pub?.publicUrl
        }
      }

      const social_links_entries: [string, string][] = []
      if (editValues.instagram)
        social_links_entries.push(["instagram", editValues.instagram])
      if (editValues.twitter)
        social_links_entries.push(["twitter", editValues.twitter])
      if (editValues.tiktok)
        social_links_entries.push(["tiktok", editValues.tiktok])
      const social_links: Record<string, string> | null =
        social_links_entries.length
          ? Object.fromEntries(social_links_entries)
          : null

      const sexual_orientation = editValues.sexual_orientation
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      const gender_identity = editValues.gender_identity
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: editValues.display_name || null,
          bio: editValues.bio || null,
          pronouns: editValues.pronouns || null,
          sexual_orientation: sexual_orientation.length
            ? sexual_orientation
            : null,
          gender_identity: gender_identity.length ? gender_identity : null,
          website: editValues.website || null,
          email: editValues.email || null,
          contact_whatsapp: editValues.contact_whatsapp || null,
          contact_telegram: editValues.contact_telegram || null,
          contact_signal: editValues.contact_signal || null,
          instagram_username: editValues.instagram_username || null,
          twitter_username: editValues.twitter_username || null,
          tiktok_username: editValues.tiktok_username || null,
          social_links,
          city: editValues.city || null,
          country: editValues.country || null,
          profile_visibility: editValues.profile_visibility,
          show_location: !!editValues.show_location,
          show_orientation: !!editValues.show_orientation,
          show_friends: !!editValues.show_friends,
          show_contacts: !!editValues.show_contacts,
          show_socials: !!editValues.show_socials,
          ...(avatar_url ? { avatar_url } : {}),
          ...(cover_image_url ? { cover_image_url } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
      if (error) throw error
      toast.success("Zapisano profil")
      {
        setEditing(false)
        setEditOpen(false)
      }
      setAvatarFile(null)
      setCoverFile(null)
      // refresh view
      setProfile({
        ...profile,
        ...{
          display_name: editValues.display_name || null,
          bio: editValues.bio || null,
          pronouns: editValues.pronouns || null,
          sexual_orientation: sexual_orientation.length
            ? sexual_orientation
            : null,
          gender_identity: gender_identity.length ? gender_identity : null,
          website: editValues.website || null,
          email: editValues.email || null,
          contact_whatsapp: editValues.contact_whatsapp || null,
          contact_telegram: editValues.contact_telegram || null,
          contact_signal: editValues.contact_signal || null,
          instagram_username: editValues.instagram_username || null,
          twitter_username: editValues.twitter_username || null,
          tiktok_username: editValues.tiktok_username || null,
          social_links: social_links,
          city: editValues.city || null,
          country: editValues.country || null,
          profile_visibility: editValues.profile_visibility,
          show_location: !!editValues.show_location,
          show_orientation: !!editValues.show_orientation,
          show_friends: !!editValues.show_friends,
          show_contacts: !!editValues.show_contacts,
          show_socials: !!editValues.show_socials,
          avatar_url: avatar_url ?? profile.avatar_url,
          cover_image_url: cover_image_url ?? profile.cover_image_url,
        },
      })
      setIsSaving(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zapisać"
      toast.error(msg)
      setIsSaving(false)
    }
  }

  // --- Minimal cropping helpers ---
  async function fileToImageURL(f: File) {
    return URL.createObjectURL(f)
  }

  async function dataURLToBlob(dataUrl: string) {
    const res = await fetch(dataUrl)
    return await res.blob()
  }

  // Helpers for modern cropping
  function computeMinScale(nw: number, nh: number, fw: number, fh: number) {
    return Math.max(fw / nw, fh / nh)
  }
  function clampOffsets(
    nw: number,
    nh: number,
    scale: number,
    fw: number,
    fh: number,
    x: number,
    y: number,
  ) {
    const dw = nw * scale
    const dh = nh * scale
    const maxX = Math.max(0, (dw - fw) / 2)
    const maxY = Math.max(0, (dh - fh) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }
  async function generateCroppedDataURL(params: {
    srcUrl: string
    natW: number
    natH: number
    frameW: number
    frameH: number
    scale: number
    offsetX: number
    offsetY: number
    outW: number
    outH: number
  }) {
    const {
      srcUrl,
      natW,
      natH,
      frameW,
      frameH,
      scale,
      offsetX,
      offsetY,
      outW,
      outH,
    } = params
    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        // Displayed image top-left in frame given center offsets
        const dw = natW * scale
        const dh = natH * scale
        const x0 = frameW / 2 - dw / 2 + offsetX
        const y0 = frameH / 2 - dh / 2 + offsetY
        const sx = Math.max(0, (0 - x0) / scale)
        const sy = Math.max(0, (0 - y0) / scale)
        const sw = Math.min(natW, frameW / scale)
        const sh = Math.min(natH, frameH / scale)

        const canvas = document.createElement("canvas")
        canvas.width = outW
        canvas.height = outH
        const ctx = canvas.getContext("2d")!
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)
        resolve(canvas.toDataURL("image/webp", 0.95))
      }
      img.onerror = reject
      img.src = srcUrl
    })
  }

  // Avatar flow
  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Avatar max 2MB")
      return
    }
    const url = await fileToImageURL(f)
    const sb = supabase
    if (!sb) {
      toast.error("Brak połączenia z serwerem")
      URL.revokeObjectURL(url)
      return
    }
    // Auto-crop and upload centered without entering edit overlay
    const img = new Image()
    img.onload = () => {
      const nw = img.naturalWidth || img.width
      const nh = img.naturalHeight || img.height
      const rect = avatarContainerRef.current?.getBoundingClientRect()
      const fw = rect?.width ? Math.round(rect.width) : 96
      const fh = rect?.height ? Math.round(rect.height) : 96
      const minS = computeMinScale(nw, nh, fw, fh)
      generateCroppedDataURL({
        srcUrl: url,
        natW: nw,
        natH: nh,
        frameW: fw,
        frameH: fh,
        scale: minS,
        offsetX: 0,
        offsetY: 0,
        outW: 512,
        outH: 512,
      })
        .then(async (dataUrl) => {
          const blob = await dataURLToBlob(dataUrl)
          const file = new File([blob], `avatar-${Date.now()}.webp`, {
            type: "image/webp",
          })
          const profId = profile?.id
          if (!profId) return
          const path = `${profId}/avatar-${Date.now()}.webp`
          const { data: up, error: upErr } = await sb.storage
            .from("avatars")
            .upload(path, file, { upsert: true })
          if (upErr) {
            toast.error("Nie udało się wgrać avatara")
            return
          }
          const { data: pub } = await sb.storage
            .from("avatars")
            .getPublicUrl(up.path)
          const newUrl = pub?.publicUrl
          if (!newUrl) {
            toast.error("Brak URL avatara")
            return
          }
          await sb
            .from("profiles")
            .update({
              avatar_url: newUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profId)
          setProfile((prev) => (prev ? { ...prev, avatar_url: newUrl } : prev))
        })
        .finally(() => {
          URL.revokeObjectURL(url)
        })
    }
    img.src = url
  }
  // removed manual avatar crop save/cancel (auto-save on pick is used)

  // Remove avatar image
  async function removeAvatar() {
    if (!supabase || !profile) return
    try {
      await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", profile.id)
      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev))
      toast.success("Usunięto avatar")
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się usunąć avatara"
      toast.error(msg)
    }
  }

  // Banner flow (3:1 rectangle)
  async function onPickBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Tło max 5MB")
      return
    }
    const url = await fileToImageURL(f)
    setBannerSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    // load natural size
    const img = new Image()
    img.onload = () => {
      const nw = img.naturalWidth || img.width
      const nh = img.naturalHeight || img.height
      setBannerNatSize({ w: nw, h: nh })
      const fw = bannerFrameW || 600
      const fh = bannerFrameH || 200
      const minS = computeMinScale(nw, nh, fw, fh)
      setBannerMinScale(minS)
      setBannerScale(minS)
      // center by default
      setBannerOffset({ x: 0, y: 0 })
    }
    img.src = url
  }

  // Measure banner crop area (not including control bar) and set frame to max 3:1 that fits inside
  useEffect(() => {
    const el = bannerAreaRef.current
    if (!el) return
    const applySize = (wC: number, hC: number) => {
      const cw = Math.round(wC)
      const ch = Math.round(hC)
      const w = Math.min(cw, ch * 3)
      const h = Math.round(w / 3)
      setBannerFrameW(w)
      setBannerFrameH(h)
    }
    // initial measure
    applySize(el.clientWidth, el.clientHeight)
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        applySize(e.contentRect.width, e.contentRect.height)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [bannerSrc])

  // Ensure banner scale respects min after frame or image changes
  useEffect(() => {
    if (!bannerNatSize) return
    const minS = computeMinScale(
      bannerNatSize.w,
      bannerNatSize.h,
      bannerFrameW,
      bannerFrameH,
    )
    setBannerMinScale(minS)
    setBannerScale((prev) => {
      const next = Math.max(minS, prev)
      setBannerOffset((o) =>
        clampOffsets(
          bannerNatSize.w,
          bannerNatSize.h,
          next,
          bannerFrameW,
          bannerFrameH,
          o.x,
          o.y,
        ),
      )
      return next
    })
  }, [bannerNatSize, bannerFrameW, bannerFrameH])
  async function saveBannerFromCrop() {
    if (!supabase || !profile || !bannerSrc || !bannerNatSize) return
    const dataUrl = await generateCroppedDataURL({
      srcUrl: bannerSrc,
      natW: bannerNatSize.w,
      natH: bannerNatSize.h,
      frameW: bannerFrameW,
      frameH: bannerFrameH,
      scale: bannerScale,
      offsetX: bannerOffset.x,
      offsetY: bannerOffset.y,
      outW: 1500,
      outH: 500,
    })
    const blob = await dataURLToBlob(dataUrl)
    const file = new File([blob], `cover-${Date.now()}.webp`, {
      type: "image/webp",
    })
    const path = `${profile.id}/cover-${Date.now()}.webp`
    const { data: up, error: upErr } = await supabase.storage
      .from("covers")
      .upload(path, file, { upsert: true })
    if (upErr) {
      toast.error("Nie udało się wgrać tła")
      return
    }
    const { data: pub } = await supabase.storage
      .from("covers")
      .getPublicUrl(up.path)
    const url = pub?.publicUrl
    if (!url) {
      toast.error("Brak URL tła")
      return
    }
    await supabase
      .from("profiles")
      .update({ cover_image_url: url, updated_at: new Date().toISOString() })
      .eq("id", profile.id)
    setProfile({ ...profile, cover_image_url: url })
    URL.revokeObjectURL(bannerSrc)
    setBannerSrc(null)
    setBannerNatSize(null)
  }
  function cancelBannerCrop() {
    if (bannerSrc) URL.revokeObjectURL(bannerSrc)
    setBannerSrc(null)
    setBannerNatSize(null)
  }

  // Remove cover image
  async function removeCover() {
    if (!supabase || !profile) return
    try {
      await supabase
        .from("profiles")
        .update({ cover_image_url: null, updated_at: new Date().toISOString() })
        .eq("id", profile.id)
      setProfile((prev) => (prev ? { ...prev, cover_image_url: null } : prev))
      // Close crop overlay if open
      cancelBannerCrop()
      toast.success("Usunięto tło profilu")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się usunąć tła"
      toast.error(msg)
    }
  }

  // Removed auto-saving from edit drawer; changes are saved only when user clicks the save button.

  async function sendRequest() {
    if (!supabase || !profile) return
    setConnecting(true)
    try {
      const me = (await supabase.auth.getUser()).data.user
      if (!me) throw new Error("Zaloguj się, aby wysłać zaproszenie")
      if (me.id === profile.id)
        throw new Error("Nie możesz połączyć się z samym sobą")
      const { data, error } = await supabase
        .from("friend_requests")
        .insert({
          sender_id: me.id,
          receiver_id: profile.id,
          status: "pending",
        })
        .select("id")
        .single()
      if (error) throw error
      setRequestId(data.id)
      setRequestStatus("pending")
    } finally {
      setConnecting(false)
    }
  }

  async function acceptRequest() {
    if (!supabase || !profile || !requestId) return
    setConnecting(true)
    try {
      const me = (await supabase.auth.getUser()).data.user
      if (!me) throw new Error("Zaloguj się")
      if (me.id === profile.id) throw new Error("Nieprawidłowa operacja")
      await supabase
        .from("friend_requests")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", requestId)
      // create friendship
      const user1 = me.id < profile.id ? me.id : profile.id
      const user2 = me.id < profile.id ? profile.id : me.id
      await supabase
        .from("friendships")
        .insert({ user1_id: user1, user2_id: user2, status: "active" })
      setIsFriend(true)
      setRequestStatus("accepted")
    } finally {
      setConnecting(false)
    }
  }

  async function cancelRequest() {
    if (!supabase || !requestId) return
    setConnecting(true)
    try {
      await supabase
        .from("friend_requests")
        .update({ status: "cancelled", responded_at: new Date().toISOString() })
        .eq("id", requestId)
      setRequestStatus("none")
      setRequestId(null)
    } finally {
      setConnecting(false)
    }
  }

  async function follow() {
    if (!supabase || !profile) return
    try {
      const me = (await supabase.auth.getUser()).data.user
      if (!me) throw new Error("Zaloguj się, aby obserwować")
      if (me.id === profile.id) throw new Error("Nie możesz obserwować siebie")
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: me.id, following_id: profile.id })
      if (error) throw error
      setFollowing(true)
      setFollowersCount((c) => c + 1)
      toast("Obserwujesz użytkownika")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się obserwować"
      toast.error(msg)
    }
  }

  async function unfollow() {
    if (!supabase || !profile) return
    try {
      const me = (await supabase.auth.getUser()).data.user
      if (!me) throw new Error("Zaloguj się")
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", me.id)
        .eq("following_id", profile.id)
      if (error) throw error
      setFollowing(false)
      setFollowersCount((c) => Math.max(0, c - 1))
      toast("Przestałeś/aś obserwować")
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Nie udało się przestać obserwować"
      toast.error(msg)
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 md:px-6 py-12">
        <Card>
          <CardContent className="p-6 space-y-3">
            <h1 className="text-xl font-bold">Użytkownik nie istnieje</h1>
            <p className="text-sm text-muted-foreground">
              Nie znaleziono profilu dla @{String(username)}.
            </p>
            <div className="pt-2">
              <Button asChild>
                <Link href="/">Wróć na stronę główną</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="relative h-40 sm:h-40 w-full overflow-hidden rounded-lg border bg-muted">
        {!!profile?.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.cover_image_url}
            alt="Okładka"
            className="h-full w-full object-cover"
          />
        )}
        {/* Inline banner crop overlay */}
        {bannerSrc && (
          <div className="absolute inset-0 z-20 bg-black/30">
            <div className="absolute inset-2 md:inset-3 flex flex-col gap-2">
              <div
                ref={bannerAreaRef}
                className="relative w-full flex-1 min-h-0 grid place-items-center"
              >
                <div
                  className="mx-auto"
                  style={{
                    width: `${bannerFrameW}px`,
                    height: `${bannerFrameH}px`,
                  }}
                >
                  <CropRect
                    src={bannerSrc}
                    natSize={bannerNatSize}
                    frameW={bannerFrameW}
                    frameH={bannerFrameH}
                    scale={bannerScale}
                    minScale={bannerMinScale}
                    offset={bannerOffset}
                    dragging={bannerDragging}
                    onPointerStart={(x: number, y: number) => {
                      setBannerDragging(true)
                      setBannerLastPt({ x, y })
                    }}
                    onPointerMove={(x: number, y: number) => {
                      if (!bannerDragging || !bannerNatSize) return
                      if (!bannerLastPt) {
                        setBannerLastPt({ x, y })
                        return
                      }
                      const dx = x - bannerLastPt.x
                      const dy = y - bannerLastPt.y
                      const next = clampOffsets(
                        bannerNatSize.w,
                        bannerNatSize.h,
                        bannerScale,
                        bannerFrameW,
                        bannerFrameH,
                        bannerOffset.x + dx,
                        bannerOffset.y + dy,
                      )
                      setBannerOffset(next)
                      setBannerLastPt({ x, y })
                    }}
                    onPointerEnd={() => {
                      setBannerDragging(false)
                      setBannerLastPt(null)
                    }}
                    onZoom={(v: number) => {
                      if (!bannerNatSize) return
                      const s = Math.max(
                        bannerMinScale,
                        Math.min(bannerMinScale * 3, v),
                      )
                      setBannerScale(s)
                      setBannerOffset((prev) =>
                        clampOffsets(
                          bannerNatSize.w,
                          bannerNatSize.h,
                          s,
                          bannerFrameW,
                          bannerFrameH,
                          prev.x,
                          prev.y,
                        ),
                      )
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background/90 rounded-md p-2 shadow-sm">
                <input
                  type="range"
                  min={bannerMinScale}
                  max={bannerMinScale * 3}
                  step={0.01}
                  value={bannerScale}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!bannerNatSize) return
                    const s = Math.max(
                      bannerMinScale,
                      Math.min(bannerMinScale * 3, v),
                    )
                    setBannerScale(s)
                    setBannerOffset((prev) =>
                      clampOffsets(
                        bannerNatSize.w,
                        bannerNatSize.h,
                        s,
                        bannerFrameW,
                        bannerFrameH,
                        prev.x,
                        prev.y,
                      ),
                    )
                  }}
                />
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelBannerCrop}
                  >
                    Anuluj
                  </Button>
                  <Button size="sm" onClick={saveBannerFromCrop}>
                    Zapisz
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {isOwner && (
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {/* Mobile: icon-only */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                type="button"
                title="Usuń tło"
                aria-label="Usuń tło"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur border shadow"
                onClick={removeCover}
              >
                <Trash2 className="size-4" />
              </button>
              <button
                type="button"
                title="Zmień tło"
                aria-label="Zmień tło"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur border shadow"
                onClick={() => {
                  bannerInputRef.current?.click()
                }}
              >
                <Camera className="size-4" />
              </button>
            </div>
            {/* Desktop/tablet: with labels */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                title="Usuń tło"
                aria-label="Usuń tło"
                className="inline-flex items-center gap-1 rounded-md bg-background/80 backdrop-blur px-2 py-1 text-xs border shadow"
                onClick={removeCover}
              >
                <Trash2 className="size-4" />
                <span className="hidden sm:inline">Usuń tło</span>
                <span className="sm:hidden">Usuń</span>
              </button>
              <button
                type="button"
                title="Zmień tło"
                aria-label="Zmień tło"
                className="inline-flex items-center gap-1 rounded-md bg-background/80 backdrop-blur px-2 py-1 text-xs border shadow"
                onClick={() => {
                  bannerInputRef.current?.click()
                }}
              >
                <Camera className="size-4" />
                <span className="hidden sm:inline">Edytuj tło</span>
                <span className="sm:hidden">Edytuj</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="md:col-span-2">
          <CardContent className="pt-3 sm:pt-2 pb-4 px-3 sm:px-4">
            <div className="flex flex-wrap items-start gap-3">
              <div
                ref={avatarContainerRef}
                className="h-16 w-16 sm:h-24 sm:w-24 shrink-0 rounded-full ring-2 ring-background overflow-hidden bg-muted border relative"
              >
                {!!profile?.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                )}
                {/* Avatar auto-saves on pick; moved trigger button outside the frame */}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight flex flex-wrap items-center gap-2">
                  {loading ? "Ładowanie…" : name}
                  {profile?.pronouns ? (
                    <Badge variant="outline" title="Zaimki">
                      {profile.pronouns}
                    </Badge>
                  ) : null}
                  {profile?.badges && profile.badges.length > 0 ? (
                    <div className="flex items-center flex-wrap gap-1.5">
                      {profile.badges.map((b, i) => {
                        const info = badgeMeta[b]
                        if (!info)
                          return (
                            <Badge key={`b-${i}`} variant="secondary">
                              {b}
                            </Badge>
                          )
                        return (
                          <Popover key={`b-${i}`}>
                            <PopoverTrigger asChild>
                              <button
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full ring-1 ${info.color}`}
                                title={info.label}
                                aria-label={info.label}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={info.icon}
                                  alt=""
                                  className="h-4 w-4"
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ring-1 ${info.color}`}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={info.icon}
                                    alt=""
                                    className="h-4 w-4"
                                  />
                                  {info.label}
                                </span>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )
                      })}
                    </div>
                  ) : null}
                </h1>
                {profile?.username && (
                  <p className="text-sm text-muted-foreground truncate">
                    @{profile.username}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {orients?.map((o, i) => (
                    <Badge key={`o-${i}`} variant="secondary">
                      {o}
                    </Badge>
                  ))}
                  {genders?.map((g, i) => (
                    <Badge key={`g-${i}`}>{g}</Badge>
                  ))}
                </div>
              </div>
              {isOwner ? (
                <div className="flex items-center gap-2 w-full sm:w-auto order-last sm:order-none mt-2 sm:mt-0 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Zmień avatar"
                    aria-label="Zmień avatar"
                    onClick={() => {
                      avatarInputRef.current?.click()
                    }}
                  >
                    <Camera className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Usuń avatar"
                    aria-label="Usuń avatar"
                    onClick={removeAvatar}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <Button
                    className="self-start"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(true)
                      setEditOpen(true)
                    }}
                  >
                    <span className="hidden xs:inline">
                      {editing ? "Zamknij edycję" : "Edytuj profil"}
                    </span>
                    <span className="inline xs:hidden">Edycja</span>
                  </Button>
                </div>
              ) : (
                profile && (
                  <div className="flex items-center gap-2 w-full sm:w-auto order-last sm:order-none mt-2 sm:mt-0 flex-wrap">
                    {isFriend ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled
                      >
                        Połączeni
                      </Button>
                    ) : requestStatus === "pending" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled
                        >
                          Wysłano zaproszenie
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={cancelRequest}
                          disabled={connecting}
                        >
                          Anuluj
                        </Button>
                      </>
                    ) : requestStatus === "incoming" ? (
                      <>
                        <Button
                          size="sm"
                          className="text-xs"
                          onClick={acceptRequest}
                          disabled={connecting}
                        >
                          {connecting ? "Akceptowanie…" : "Akceptuj"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={cancelRequest}
                          disabled={connecting}
                        >
                          Odrzuć
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={sendRequest}
                        disabled={connecting}
                      >
                        {connecting ? "Wysyłanie…" : "Połącz się"}
                      </Button>
                    )}

                    {following ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                        onClick={unfollow}
                      >
                        Obserwujesz
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={follow}
                      >
                        Obserwuj
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>

            {profile?.bio && (
              <p className="mt-3 whitespace-pre-wrap">{profile.bio}</p>
            )}

            {/* Hidden file inputs for avatar/banner */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickAvatar}
            />
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickBanner}
            />

            <Sheet
              open={editOpen}
              onOpenChange={(open) => {
                setEditOpen(open)
                if (!open) {
                  setEditing(false)
                }
              }}
            >
              <SheetContent
                side="right"
                className="w-full sm:max-w-md max-h-[100dvh] overflow-y-auto p-0"
              >
                <SheetHeader className="px-4 pt-4">
                  <SheetTitle>Edytuj profil</SheetTitle>
                  <SheetDescription>
                    Uzupełnij informacje o sobie. Zapis następuje po kliknięciu
                    przycisku.
                  </SheetDescription>
                </SheetHeader>
                {/* Auto-save status removed */}
                <div className="px-4 pb-4 grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Wyświetlana nazwa
                      </label>
                      {/* Inline crop handled in preview area; buttons below just trigger file chooser */}

                      <Input
                        value={editValues.display_name}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            display_name: e.target.value,
                          }))
                        }
                        placeholder="Twoje imię/pseudonim"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Zaimki</label>
                      <Input
                        value={editValues.pronouns}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            pronouns: e.target.value,
                          }))
                        }
                        placeholder="np. ona/jej, on/jego, they/them"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Orientacja seksualna
                    </label>
                    <Input
                      value={editValues.sexual_orientation}
                      onChange={(e) =>
                        setEditValues((v) => ({
                          ...v,
                          sexual_orientation: e.target.value,
                        }))
                      }
                      placeholder="oddziel przecinkami (np. lesbijska, bi, pan, ace)"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Tożsamość płciowa
                    </label>
                    <Input
                      value={editValues.gender_identity}
                      onChange={(e) =>
                        setEditValues((v) => ({
                          ...v,
                          gender_identity: e.target.value,
                        }))
                      }
                      placeholder="oddziel przecinkami (np. trans, niebinarna, cis)"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea
                      rows={4}
                      value={editValues.bio}
                      onChange={(e) =>
                        setEditValues((v) => ({ ...v, bio: e.target.value }))
                      }
                      placeholder="Krótko o Tobie"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Miasto</label>
                      <Input
                        value={editValues.city}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, city: e.target.value }))
                        }
                        placeholder="np. Warszawa"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Kraj</label>
                      <Input
                        value={editValues.country}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            country: e.target.value,
                          }))
                        }
                        placeholder="np. Polska"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Strona www</label>
                      <Input
                        value={editValues.website}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            website: e.target.value,
                          }))
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Email (publiczny)
                      </label>
                      <Input
                        type="email"
                        value={editValues.email}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            email: e.target.value,
                          }))
                        }
                        placeholder="twoj@email.pl"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">WhatsApp</label>
                      <Input
                        value={editValues.contact_whatsapp}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            contact_whatsapp: e.target.value,
                          }))
                        }
                        placeholder="np. +48 600 000 000"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Telegram</label>
                      <Input
                        value={editValues.contact_telegram}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            contact_telegram: e.target.value,
                          }))
                        }
                        placeholder="np. username"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Signal</label>
                      <Input
                        value={editValues.contact_signal}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            contact_signal: e.target.value,
                          }))
                        }
                        placeholder="np. +48 600 000 000"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Instagram (username)
                      </label>
                      <Input
                        value={editValues.instagram_username}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            instagram_username: e.target.value,
                          }))
                        }
                        placeholder="np. tecza"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Twitter/X (username)
                      </label>
                      <Input
                        value={editValues.twitter_username}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            twitter_username: e.target.value,
                          }))
                        }
                        placeholder="np. tecza"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        TikTok (username)
                      </label>
                      <Input
                        value={editValues.tiktok_username}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            tiktok_username: e.target.value,
                          }))
                        }
                        placeholder="np. tecza"
                      />
                    </div>
                  </div>
                  {/* Privacy controls */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Widoczność profilu
                      </label>
                      <Select
                        value={editValues.profile_visibility}
                        onValueChange={(v) =>
                          setEditValues((s) => ({
                            ...s,
                            profile_visibility: (v === "public" ||
                            v === "friends" ||
                            v === "private"
                              ? v
                              : s.profile_visibility) as ProfileVisibility,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Publiczny</SelectItem>
                          <SelectItem value="friends">Znajomi</SelectItem>
                          <SelectItem value="private">Prywatny</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        Ustawienia prywatności
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center justify-between gap-3 text-sm">
                          <span>Lokalizacja</span>
                          <Switch
                            checked={editValues.show_location}
                            onCheckedChange={(v) =>
                              setEditValues((s) => ({ ...s, show_location: v }))
                            }
                          />
                        </label>
                        <label className="flex items-center justify-between gap-3 text-sm">
                          <span>Orientacja/Tożsamość</span>
                          <Switch
                            checked={editValues.show_orientation}
                            onCheckedChange={(v) =>
                              setEditValues((s) => ({
                                ...s,
                                show_orientation: v,
                              }))
                            }
                          />
                        </label>
                        <label className="flex items-center justify-between gap-3 text-sm">
                          <span>Znajomi</span>
                          <Switch
                            checked={editValues.show_friends}
                            onCheckedChange={(v) =>
                              setEditValues((s) => ({ ...s, show_friends: v }))
                            }
                          />
                        </label>
                        <label className="flex items-center justify-between gap-3 text-sm">
                          <span>Kontakty</span>
                          <Switch
                            checked={editValues.show_contacts}
                            onCheckedChange={(v) =>
                              setEditValues((s) => ({ ...s, show_contacts: v }))
                            }
                          />
                        </label>
                        <label className="flex items-center justify-between gap-3 text-sm">
                          <span>Social media</span>
                          <Switch
                            checked={editValues.show_socials}
                            onCheckedChange={(v) =>
                              setEditValues((s) => ({ ...s, show_socials: v }))
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* Removed avatar/cover edit controls from drawer; use inline triggers on profile preview */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false)
                        setEditOpen(false)
                      }}
                    >
                      Zamknij
                    </Button>
                    <Button onClick={saveEdits} disabled={isSaving}>
                      {isSaving ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="size-4 animate-spin" />{" "}
                          Zapisywanie
                        </span>
                      ) : (
                        "Zapisz teraz"
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Posty</h2>
              <div className="space-y-3">
                {posts.map((p) => (
                  <PostItem key={p.id} post={p} />
                ))}
                {posts.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Brak postów do wyświetlenia.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <h3 className="font-medium mb-3">Informacje</h3>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Obserwujący:</span>
                  <span className="text-foreground font-medium">
                    {followersCount}
                  </span>
                  <span aria-hidden>•</span>
                  <span>Obserwowani:</span>
                  <span className="text-foreground font-medium">
                    {followingCount}
                  </span>
                </div>
                {showLocation && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4" aria-hidden />
                    <span className="text-foreground">
                      {[profile?.city, profile?.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {profile?.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LinkIcon className="size-4" aria-hidden />
                    <a
                      className="text-primary hover:underline"
                      href={profile.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile?.show_orientation &&
                  (orients.length > 0 || genders.length > 0) && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="size-4" aria-hidden />
                        <span>Tożsamość i orientacja</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {orients.map((o, i) => (
                          <Badge key={`io-${i}`} variant="secondary">
                            {o}
                          </Badge>
                        ))}
                        {genders.map((g, i) => (
                          <Badge key={`ig-${i}`}>{g}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {profile?.social_links && (
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <AtSign className="size-4" aria-hidden />
                    {Object.entries(profile.social_links).map(([k, v]) => (
                      <a
                        key={k}
                        href={v}
                        className="hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {k}
                      </a>
                    ))}
                  </div>
                )}
                {contactLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <AtSign className="size-4" aria-hidden />
                    {contactLinks.map((c) => (
                      <a
                        key={c.label}
                        href={c.href}
                        className="hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {c.label}
                      </a>
                    ))}
                  </div>
                )}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    <AtSign className="size-4" aria-hidden />
                    {socialLinks.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        className="hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(profile?.show_friends ?? true) && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Znajomi</h3>
                  {friends.length > 5 && profile?.username && (
                    <Link
                      href={`/u/${profile.username}/friends`}
                      className="text-sm text-primary hover:underline"
                    >
                      Zobacz wszystkich
                    </Link>
                  )}
                </div>
                {friends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Brak znajomych do wyświetlenia.
                  </p>
                ) : (
                  <ul className="grid gap-2">
                    {friends.slice(0, 5).map((f) => (
                      <li key={f.id} className="flex items-center gap-3">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Link
                              href={f.username ? `/u/${f.username}` : "#"}
                              className="flex items-center gap-3"
                            >
                              <div
                                className="h-8 w-8 rounded-full overflow-hidden bg-muted border"
                                aria-hidden
                              >
                                {f.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={f.avatar_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="truncate">
                                <div className="text-sm font-medium truncate">
                                  {f.display_name || f.username || "Użytkownik"}
                                </div>
                                {f.username && (
                                  <div className="text-xs text-muted-foreground">
                                    @{f.username}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-10 w-10 rounded-full overflow-hidden bg-muted border"
                                aria-hidden
                              >
                                {f.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={f.avatar_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {f.display_name || f.username || "Użytkownik"}
                                </div>
                                {f.username && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    @{f.username}
                                  </div>
                                )}
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
