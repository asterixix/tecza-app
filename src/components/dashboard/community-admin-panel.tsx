"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { getSupabase } from "@/lib/supabase-browser"
import { toast } from "sonner"
import {
  Settings,
  Users,
  Megaphone,
  Shield,
  Upload,
  Trash2,
  UserMinus,
  Crown,
  UserCheck,
  ImageIcon,
  Save,
  X,
} from "lucide-react"
import Link from "next/link"
import { withTimeout } from "@/lib/errors"

interface Community {
  id: string
  slug?: string | null
  name: string
  description: string | null
  avatar_url: string | null
  cover_image_url: string | null
  members_count: number
  owner_id: string
  city: string | null
  country: string | null
  type: "public" | "private" | "restricted"
  status?: "pending" | "active" | "rejected"
  has_chat: boolean
  has_events: boolean
  has_wiki: boolean
}

interface CommunityMember {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: "owner" | "moderator" | "member"
  joined_at: string
  is_banned?: boolean
  is_muted?: boolean
}

interface CommunityPost {
  id: string
  content: string
  created_at: string
  hidden_at: string | null
  hidden_reason: string | null
  user_id: string
  profiles?: {
    username?: string | null
    display_name?: string | null
    avatar_url?: string | null
  }
}

interface CommunityAdminPanelProps {
  community: Community
  currentUserRole: "owner" | "moderator" | "member" | null
  onCommunityUpdate: (updatedCommunity: Partial<Community>) => void
  onMemberUpdate: () => void
}

export function CommunityAdminPanel({
  community,
  currentUserRole,
  onCommunityUpdate,
  onMemberUpdate,
}: CommunityAdminPanelProps) {
  const supabase = getSupabase()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)

  // Edit form states
  const [editForm, setEditForm] = useState({
    name: community.name,
    description: community.description || "",
    city: community.city || "",
    country: community.country || "",
    type: community.type,
    has_chat: community.has_chat,
    has_events: community.has_events,
    has_wiki: community.has_wiki,
  })

  // Announcement state
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
  })
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  // Members state
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [actioningMember, setActioningMember] = useState<string | null>(null)

  // Posts moderation state
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [hidingPost, setHidingPost] = useState<string | null>(null)

  // Image upload refs
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const isOwner = currentUserRole === "owner"
  const isModerator = currentUserRole === "moderator" || isOwner
  const canManage = isModerator

  if (!canManage) {
    return null
  }

  // (deduped) posts moderation state – already declared above

  const loadCommunityPosts = async () => {
    if (!supabase) return
    setLoadingPosts(true)
    try {
      const { data: posts } = await withTimeout(
        supabase
          .from("posts")
          .select(
            `
            id,
            content,
            created_at,
            hidden_at,
            hidden_reason,
            user_id,
            profiles!posts_user_id_fkey(username, display_name, avatar_url)
          `,
          )
          .eq("community_id", community.id)
          .order("created_at", { ascending: false })
          .limit(20),
        15000,
      )

      setCommunityPosts(
        (posts || []).map(
          (post: {
            id: string
            content: string
            created_at: string
            hidden_at: string | null
            hidden_reason: string | null
            user_id: string
            profiles?:
              | {
                  username?: string | null
                  display_name?: string | null
                  avatar_url?: string | null
                }
              | Array<{
                  username?: string | null
                  display_name?: string | null
                  avatar_url?: string | null
                }>
          }) => ({
            ...post,
            profiles: Array.isArray(post.profiles)
              ? post.profiles[0]
              : post.profiles,
          }),
        ),
      )
    } catch (error) {
      console.error("Failed to load community posts:", error)
      toast.error("Nie udało się wczytać postów")
    } finally {
      setLoadingPosts(false)
    }
  }

  const handleHidePost = async (postId: string, reason: string) => {
    if (!supabase || !canManage) return

    setHidingPost(postId)
    try {
      const { error } = await withTimeout(
        supabase
          .from("posts")
          .update({
            hidden_at: new Date().toISOString(),
            hidden_reason: reason,
          })
          .eq("id", postId),
        15000,
      )

      if (error) throw error

      setCommunityPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                hidden_at: new Date().toISOString(),
                hidden_reason: reason,
              }
            : post,
        ),
      )
      toast.success("Post został ukryty")
    } catch (error) {
      console.error("Failed to hide post:", error)
      toast.error("Nie udało się ukryć postu")
    } finally {
      setHidingPost(null)
    }
  }

  const handleUnhidePost = async (postId: string) => {
    if (!supabase || !canManage) return

    setHidingPost(postId)
    try {
      const { error } = await withTimeout(
        supabase
          .from("posts")
          .update({
            hidden_at: null,
            hidden_reason: null,
          })
          .eq("id", postId),
        15000,
      )

      if (error) throw error

      setCommunityPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                hidden_at: null,
                hidden_reason: null,
              }
            : post,
        ),
      )
      toast.success("Post został przywrócony")
    } catch (error) {
      console.error("Failed to unhide post:", error)
      toast.error("Nie udało się przywrócić postu")
    } finally {
      setHidingPost(null)
    }
  }
  const loadMembers = async () => {
    if (!supabase) return
    setLoadingMembers(true)
    try {
      const { data: memberships } = await withTimeout(
        supabase
          .from("community_memberships")
          .select("user_id,role,joined_at")
          .eq("community_id", community.id)
          .order("joined_at", { ascending: false }),
        15000,
      )

      if (memberships?.length) {
        const userIds = memberships.map((m) => m.user_id)
        const { data: profiles } = await withTimeout(
          supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url")
            .in("id", userIds),
          15000,
        )

        const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || [])

        setMembers(
          memberships.map((m) => {
            const profile = profilesMap.get(m.user_id)
            return {
              id: m.user_id,
              username: profile?.username || null,
              display_name: profile?.display_name || null,
              avatar_url: profile?.avatar_url || null,
              role: m.role,
              joined_at: m.joined_at,
            }
          }),
        )
      } else {
        setMembers([])
      }
    } catch (error) {
      console.error("Failed to load members:", error)
      toast.error("Nie udało się wczytać listy członków")
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!supabase || !isOwner) return
    setLoading(true)
    try {
      const { error } = await withTimeout(
        supabase
          .from("communities")
          .update({
            name: editForm.name.trim(),
            description: editForm.description.trim() || null,
            city: editForm.city.trim() || null,
            country: editForm.country.trim() || null,
            type: editForm.type,
            has_chat: editForm.has_chat,
            has_events: editForm.has_events,
            has_wiki: editForm.has_wiki,
            updated_at: new Date().toISOString(),
          })
          .eq("id", community.id),
        15000,
      )

      if (error) {
        throw error
      }

      onCommunityUpdate(editForm)
      toast.success("Ustawienia zostały zapisane")
    } catch (error) {
      console.error("Failed to update community:", error)
      toast.error("Nie udało się zapisać ustawień")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File, type: "avatar" | "cover") => {
    if (!supabase) return

    const maxSize = type === "avatar" ? 2 * 1024 * 1024 : 5 * 1024 * 1024 // 2MB for avatar, 5MB for cover
    if (file.size > maxSize) {
      toast.error(
        `Plik jest za duży. Maksymalny rozmiar: ${type === "avatar" ? "2MB" : "5MB"}`,
      )
      return
    }

    setLoading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${community.id}/${type}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("community-images").getPublicUrl(fileName)

      const updateField = type === "avatar" ? "avatar_url" : "cover_image_url"
      const { error: updateError } = await supabase
        .from("communities")
        .update({ [updateField]: publicUrl })
        .eq("id", community.id)

      if (updateError) throw updateError

      onCommunityUpdate({ [updateField]: publicUrl })
      toast.success(
        `${type === "avatar" ? "Awatar" : "Okładka"} została zaktualizowana`,
      )
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error)
      toast.error(
        `Nie udało się zaktualizować ${type === "avatar" ? "awatara" : "okładki"}`,
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async () => {
    if (!supabase || !canManage) return
    if (!announcementForm.title.trim()) {
      toast.error("Tytuł ogłoszenia jest wymagany")
      return
    }

    setSavingAnnouncement(true)
    try {
      const me = (await supabase.auth.getUser()).data.user
      if (!me) throw new Error("Nie jesteś zalogowany")

      const { error } = await withTimeout(
        supabase.from("community_announcements").insert({
          community_id: community.id,
          title: announcementForm.title.trim(),
          body: announcementForm.body.trim() || null,
          created_by: me.id,
        }),
        15000,
      )

      if (error) throw error

      setAnnouncementForm({ title: "", body: "" })
      toast.success("Ogłoszenie zostało dodane")
    } catch (error) {
      console.error("Failed to create announcement:", error)
      toast.error("Nie udało się dodać ogłoszenia")
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const handleRoleChange = async (
    userId: string,
    newRole: "member" | "moderator" | "owner",
  ) => {
    if (!supabase || !isOwner) return

    setActioningMember(userId)
    try {
      await supabase.rpc("change_membership_role", {
        p_community: community.id,
        p_user: userId,
        p_role: newRole,
      })

      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)),
      )
      toast.success("Rola została zmieniona")
      onMemberUpdate()
    } catch (error) {
      console.error("Failed to change role:", error)
      toast.error("Nie udało się zmienić roli")
    } finally {
      setActioningMember(null)
    }
  }

  const handleKickMember = async (userId: string) => {
    if (!supabase || !canManage) return

    setActioningMember(userId)
    try {
      const { error } = await withTimeout(
        supabase
          .from("community_memberships")
          .delete()
          .eq("community_id", community.id)
          .eq("user_id", userId),
        15000,
      )

      if (error) throw error

      setMembers((prev) => prev.filter((m) => m.id !== userId))
      toast.success("Użytkownik został usunięty ze społeczności")
      onMemberUpdate()
    } catch (error) {
      console.error("Failed to kick member:", error)
      toast.error("Nie udało się usunąć użytkownika")
    } finally {
      setActioningMember(null)
    }
  }

  const handleDeleteCommunity = async () => {
    if (!supabase || !isOwner) return

    setLoading(true)
    try {
      const { error } = await withTimeout(
        supabase.from("communities").delete().eq("id", community.id),
        15000,
      )

      if (error) throw error

      toast.success("Społeczność została usunięta")
      setOpen(false)
      // Redirect to communities list
      window.location.href = "/c"
    } catch (error) {
      console.error("Failed to delete community:", error)
      toast.error("Nie udało się usunąć społeczności")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Zarządzaj
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zarządzanie społecznością</DialogTitle>
            <DialogDescription>
              Konfiguruj ustawienia, zarządzaj członkami i moderuj treści
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="gap-2">
                <Settings className="h-4 w-4" />
                Ustawienia
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="gap-2"
                onClick={loadMembers}
              >
                <Users className="h-4 w-4" />
                Członkowie
              </TabsTrigger>
              <TabsTrigger value="announcements" className="gap-2">
                <Megaphone className="h-4 w-4" />
                Ogłoszenia
              </TabsTrigger>
              <TabsTrigger
                value="moderation"
                className="gap-2"
                onClick={loadCommunityPosts}
              >
                <Shield className="h-4 w-4" />
                Moderacja
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Podstawowe informacje</CardTitle>
                  <CardDescription>
                    Edytuj nazwę, opis i inne podstawowe dane społeczności
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nazwa społeczności</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        disabled={!isOwner}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Typ społeczności</Label>
                      <Select
                        value={editForm.type}
                        onValueChange={(
                          value: "public" | "private" | "restricted",
                        ) => setEditForm((prev) => ({ ...prev, type: value }))}
                        disabled={!isOwner}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Publiczna</SelectItem>
                          <SelectItem value="restricted">
                            Ograniczona
                          </SelectItem>
                          <SelectItem value="private">Prywatna</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Opis</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                      disabled={!isOwner}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Miasto</Label>
                      <Input
                        id="city"
                        value={editForm.city}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        disabled={!isOwner}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Kraj</Label>
                      <Input
                        id="country"
                        value={editForm.country}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                        disabled={!isOwner}
                      />
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex justify-end">
                      <Button onClick={handleSaveSettings} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? "Zapisywanie..." : "Zapisz zmiany"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Zdjęcia społeczności</CardTitle>
                  <CardDescription>
                    Zmień awatar i okładkę społeczności
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Awatar społeczności</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg border overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              community.avatar_url || "/icons/tecza-icons/1.svg"
                            }
                            alt="Awatar"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={loading}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Zmień awatar
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Maksymalny rozmiar: 2MB
                          </p>
                        </div>
                      </div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, "avatar")
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Okładka społeczności</Label>
                      <div className="space-y-2">
                        <div className="h-24 w-full rounded-lg border overflow-hidden bg-muted">
                          {community.cover_image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={community.cover_image_url}
                              alt="Okładka"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => coverInputRef.current?.click()}
                            disabled={loading}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Zmień okładkę
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Maksymalny rozmiar: 5MB
                          </p>
                        </div>
                      </div>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, "cover")
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Funkcje społeczności</CardTitle>
                  <CardDescription>
                    Włącz lub wyłącz funkcje dostępne w społeczności
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Czat społeczności</Label>
                      <p className="text-sm text-muted-foreground">
                        Pozwala członkom na rozmowy w czasie rzeczywistym
                      </p>
                    </div>
                    <Switch
                      checked={editForm.has_chat}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) => ({ ...prev, has_chat: checked }))
                      }
                      disabled={!isOwner}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Wydarzenia</Label>
                      <p className="text-sm text-muted-foreground">
                        Umożliwia tworzenie i zarządzanie wydarzeniami
                      </p>
                    </div>
                    <Switch
                      checked={editForm.has_events}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) => ({
                          ...prev,
                          has_events: checked,
                        }))
                      }
                      disabled={!isOwner}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Wiki społeczności</Label>
                      <p className="text-sm text-muted-foreground">
                        Wspólna baza wiedzy i dokumentacji
                      </p>
                    </div>
                    <Switch
                      checked={editForm.has_wiki}
                      onCheckedChange={(checked) =>
                        setEditForm((prev) => ({ ...prev, has_wiki: checked }))
                      }
                      disabled={!isOwner}
                    />
                  </div>
                </CardContent>
              </Card>

              {isOwner && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">
                      Strefa niebezpieczeństwa
                    </CardTitle>
                    <CardDescription>
                      Nieodwracalne akcje administracyjne
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Usuń społeczność
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Czy na pewno chcesz usunąć społeczność?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Ta akcja jest nieodwracalna. Wszystkie dane
                            społeczności, posty, członkowie i historia zostaną
                            trwale usunięte.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteCommunity}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Usuń społeczność
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Członkowie społeczności ({members.length})
                  </CardTitle>
                  <CardDescription>
                    Zarządzaj rolami i uprawnieniami członków
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMembers ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Wczytywanie członków...
                      </p>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Brak członków do wyświetlenia
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Link
                              href={
                                member.username ? `/u/${member.username}` : "#"
                              }
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={
                                  member.avatar_url ||
                                  "/icons/tecza-icons/1.svg"
                                }
                                alt="Awatar"
                                className="h-10 w-10 rounded-full object-cover border"
                              />
                            </Link>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {member.display_name ||
                                    member.username ||
                                    "Użytkownik"}
                                </p>
                                <Badge
                                  variant={
                                    member.role === "owner"
                                      ? "default"
                                      : member.role === "moderator"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {member.role === "owner"
                                    ? "Właściciel"
                                    : member.role === "moderator"
                                      ? "Moderator"
                                      : "Członek"}
                                </Badge>
                              </div>
                              {member.username && (
                                <p className="text-sm text-muted-foreground">
                                  @{member.username}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isOwner && member.role !== "owner" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRoleChange(member.id, "member")
                                  }
                                  disabled={actioningMember === member.id}
                                  className={
                                    member.role === "member"
                                      ? "bg-secondary"
                                      : ""
                                  }
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Członek
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRoleChange(member.id, "moderator")
                                  }
                                  disabled={actioningMember === member.id}
                                  className={
                                    member.role === "moderator"
                                      ? "bg-secondary"
                                      : ""
                                  }
                                >
                                  <Shield className="h-4 w-4 mr-1" />
                                  Moderator
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRoleChange(member.id, "owner")
                                  }
                                  disabled={actioningMember === member.id}
                                >
                                  <Crown className="h-4 w-4 mr-1" />
                                  Właściciel
                                </Button>
                              </>
                            )}

                            {canManage && member.role !== "owner" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={actioningMember === member.id}
                                  >
                                    <UserMinus className="h-4 w-4 mr-1" />
                                    Usuń
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Usunąć{" "}
                                      {member.display_name || member.username}{" "}
                                      ze społeczności?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Użytkownik zostanie usunięty ze
                                      społeczności i będzie musiał ponownie
                                      dołączyć.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Anuluj
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleKickMember(member.id)
                                      }
                                    >
                                      Usuń
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="announcements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Nowe ogłoszenie</CardTitle>
                  <CardDescription>
                    Dodaj ogłoszenie które będzie widoczne dla wszystkich
                    członków
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ann-title">Tytuł ogłoszenia</Label>
                    <Input
                      id="ann-title"
                      value={announcementForm.title}
                      onChange={(e) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Wprowadź tytuł ogłoszenia..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ann-body">Treść ogłoszenia</Label>
                    <Textarea
                      id="ann-body"
                      value={announcementForm.body}
                      onChange={(e) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          body: e.target.value,
                        }))
                      }
                      placeholder="Wprowadź treść ogłoszenia..."
                      rows={6}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleCreateAnnouncement}
                      disabled={
                        savingAnnouncement || !announcementForm.title.trim()
                      }
                    >
                      <Megaphone className="h-4 w-4 mr-2" />
                      {savingAnnouncement
                        ? "Publikowanie..."
                        : "Opublikuj ogłoszenie"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Moderacja postów</CardTitle>
                  <CardDescription>
                    Ukrywaj i przywracaj posty dodane w społeczności
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPosts ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Wczytywanie…</p>
                    </div>
                  ) : communityPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Brak postów do moderacji
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {communityPosts.map((post) => (
                        <div
                          key={post.id}
                          className="p-4 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                post.profiles?.avatar_url ||
                                "/icons/tecza-icons/1.svg"
                              }
                              alt="Awatar"
                              className="h-8 w-8 rounded-full border object-cover"
                            />
                            <div>
                              <p className="font-medium">
                                {post.profiles?.display_name ||
                                  post.profiles?.username ||
                                  "Użytkownik"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {post.hidden_at ? (
                            <Badge variant="destructive">Ukryty</Badge>
                          ) : null}

                          <p className="whitespace-pre-wrap break-words">
                            {post.content}
                          </p>

                          {post.hidden_reason ? (
                            <p className="text-xs text-muted-foreground">
                              Powód ukrycia: {post.hidden_reason}
                            </p>
                          ) : null}

                          <div className="flex justify-end">
                            {post.hidden_at ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={hidingPost === post.id}
                                onClick={() => handleUnhidePost(post.id)}
                              >
                                Przywróć
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={hidingPost === post.id}
                                onClick={() => {
                                  const reason =
                                    prompt("Podaj powód ukrycia:")?.trim() ||
                                    "Naruszenie zasad"
                                  handleHidePost(post.id, reason)
                                }}
                              >
                                Ukryj
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Zamknij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
