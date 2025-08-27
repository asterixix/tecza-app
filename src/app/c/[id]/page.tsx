"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PostComposer } from "@/components/dashboard/post-composer"
import { CommunityAdminPanel } from "@/components/dashboard/community-admin-panel-new"
import { CommunityChat } from "@/components/dashboard/community-chat"
import { CommunityEvents } from "@/components/dashboard/community-events"
import { CommunityPosts } from "@/components/dashboard/community-posts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { toast } from "sonner"
import Link from "next/link"
import {
  Users,
  MapPin,
  Calendar,
  MessageSquare,
  FileText,
  Globe,
  Lock,
  LockKeyhole,
} from "lucide-react"
import {
  friendlyMessage,
  normalizeSupabaseError,
  withTimeout,
} from "@/lib/errors"
import { CommunityWiki } from "@/components/dashboard/community-wiki"
import { CommunityMarketplace } from "@/components/dashboard/community-marketplace"
import { CommunityKanban } from "@/components/dashboard/community-kanban"

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
  has_posts?: boolean
  has_marketplace?: boolean
  has_kanban?: boolean
}

interface CommunityMember {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: "owner" | "moderator" | "member"
  joined_at: string
}

interface Announcement {
  id: string
  title: string
  body: string | null
  created_at: string
  created_by: string
  author?: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

export default function CommunityPage() {
  const supabase = getSupabase()
  const params = useParams<{ id: string }>()
  const idOrSlug = params?.id
  const [community, setCommunity] = useState<Community | null>(null)
  const [currentUser, setCurrentUser] = useState<{
    id: string
    email?: string
  } | null>(null)
  const [membership, setMembership] = useState<{
    isMember: boolean
    role: "owner" | "moderator" | "member" | null
  }>({ isMember: false, role: null })
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [postsRefreshToken, setPostsRefreshToken] = useState(0)

  const loadCommunityData = useCallback(async () => {
    if (!supabase || !idOrSlug) return

    try {
      // Try by slug first, then by id
      let found: Community | null = null
      const bySlug = await withTimeout(
        supabase
          .from("communities")
          .select("*")
          .eq("slug", idOrSlug)
          .maybeSingle(),
        15000,
      )
      if (bySlug.data) {
        found = bySlug.data as Community
      } else {
        const byId = await withTimeout(
          supabase
            .from("communities")
            .select("*")
            .eq("id", idOrSlug)
            .maybeSingle(),
          15000,
        )
        if (byId.data) found = byId.data as Community
      }

      setCommunity(found)

      if (found) {
        // Load announcements
        const { data: annData } = await withTimeout(
          supabase
            .from("community_announcements")
            .select(
              `
              id,
              title,
              body,
              created_at,
              created_by,
              profiles!community_announcements_created_by_fkey(username, display_name, avatar_url)
            `,
            )
            .eq("community_id", found.id)
            .order("created_at", { ascending: false })
            .limit(5),
          15000,
        )

        setAnnouncements(
          (annData || []).map((ann) => ({
            ...ann,
            author: Array.isArray(ann.profiles)
              ? ann.profiles[0]
              : ann.profiles || undefined,
          })),
        )
      }
    } catch (error) {
      console.error("Failed to load community:", error)
    }
  }, [supabase, idOrSlug])

  const loadMembershipData = useCallback(async () => {
    if (!supabase || !community) return

    try {
      const { data: user } = await supabase.auth.getUser()
      setCurrentUser(user.user)

      if (user.user && community.id) {
        // Check membership
        const { data: m, error: mErr } = await supabase
          .from("community_memberships")
          .select("id,role")
          .eq("community_id", community.id)
          .eq("user_id", user.user.id)
          .maybeSingle()

        if (mErr) {
          console.error("membership check failed", mErr)
        } else {
          setMembership({
            isMember: !!m,
            role: m?.role || null,
          })
        }

        // Load members if user is admin/mod or community is active
        if (
          community.status === "active" &&
          (m?.role === "owner" || m?.role === "moderator")
        ) {
          const { data: mem } = await withTimeout(
            supabase
              .from("community_memberships")
              .select(
                `
                user_id,
                role,
                joined_at,
                profiles!community_memberships_user_id_fkey(username, display_name, avatar_url)
              `,
              )
              .eq("community_id", community.id)
              .order("joined_at", { ascending: false }),
            15000,
          )

          setMembers(
            (mem || []).map((m) => {
              const profile = Array.isArray(m.profiles)
                ? m.profiles[0]
                : m.profiles
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
        }
      }
    } catch (error) {
      console.error("Failed to load membership data:", error)
    }
  }, [supabase, community])

  useEffect(() => {
    loadCommunityData()
  }, [loadCommunityData])

  useEffect(() => {
    if (community) {
      loadMembershipData()
    }
  }, [community, loadMembershipData])

  const handleJoin = async () => {
    if (!supabase || !community || !currentUser) return

    if (community.status && community.status !== "active") {
      toast.info("Ta społeczność oczekuje na akceptację moderatora.")
      return
    }

    const role = currentUser.id === community.owner_id ? "owner" : "member"
    setJoining(true)

    try {
      const { error } = await withTimeout(
        supabase.from("community_memberships").upsert(
          {
            community_id: community.id,
            user_id: currentUser.id,
            role,
          },
          { onConflict: "community_id,user_id" },
        ),
        15000,
      )

      if (error) {
        throw error
      }

      setMembership({ isMember: true, role })
      toast.success("Dołączono do społeczności")
    } catch (error) {
      const err = normalizeSupabaseError(error, "Nie udało się dołączyć")
      toast.error(friendlyMessage(err))
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!supabase || !community || !currentUser) return

    setLeaving(true)

    try {
      const { error } = await withTimeout(
        supabase
          .from("community_memberships")
          .delete()
          .eq("community_id", community.id)
          .eq("user_id", currentUser.id),
        15000,
      )

      if (error) {
        throw error
      }

      setMembership({ isMember: false, role: null })
      toast.success("Opuszczono społeczność")
    } catch (error) {
      const err = normalizeSupabaseError(
        error,
        "Nie udało się opuścić społeczności",
      )
      toast.error(friendlyMessage(err))
    } finally {
      setLeaving(false)
    }
  }

  const handleCommunityUpdate = (updatedCommunity: Partial<Community>) => {
    if (community) {
      setCommunity({ ...community, ...updatedCommunity })
    }
  }

  const handleMemberUpdate = () => {
    loadMembershipData()
  }

  const getTypeIcon = () => {
    switch (community?.type) {
      case "private":
        return <Lock className="h-4 w-4" />
      case "restricted":
        return <LockKeyhole className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getTypeLabel = () => {
    switch (community?.type) {
      case "private":
        return "Prywatna"
      case "restricted":
        return "Ograniczona"
      default:
        return "Publiczna"
    }
  }

  if (!community) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Wczytywanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Cover Image Section */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden">
        {community.cover_image_url ? (
          <Image
            src={community.cover_image_url}
            alt="Okładka społeczności"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Community Header */}
      <div className="px-4 md:px-6 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 mb-6">
          {/* Avatar */}
          <div className="relative">
            <Image
              src={community.avatar_url || "/icons/tecza-icons/2.svg"}
              alt="Avatar społeczności"
              width={128}
              height={128}
              className="h-24 w-24 md:h-32 md:w-32 rounded-xl object-cover border-4 border-background bg-background"
            />
          </div>

          {/* Community Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white md:text-foreground">
                {community.name}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  {getTypeIcon()}
                  {getTypeLabel()}
                </Badge>
                {community.status === "pending" && (
                  <Badge variant="outline">Oczekuje moderacji</Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 md:text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {community.members_count} członków
              </div>
              {(community.city || community.country) && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {[community.city, community.country]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            {membership.isMember ? (
              <Button
                variant="outline"
                onClick={handleLeave}
                disabled={leaving}
                className="bg-background/80 backdrop-blur-sm md:bg-background"
              >
                {leaving ? "Opuszczanie…" : "Opuść"}
              </Button>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="bg-primary/90 hover:bg-primary md:bg-primary md:hover:bg-primary/90"
              >
                {joining ? "Dołączanie…" : "Dołącz"}
              </Button>
            )}

            {(membership.role === "owner" ||
              membership.role === "moderator") && (
              <CommunityAdminPanel
                community={community}
                currentUserRole={membership.role}
                onCommunityUpdate={handleCommunityUpdate}
                onMemberUpdate={handleMemberUpdate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {/* Announcements */}
        {announcements.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Ogłoszenia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="border-l-4 border-primary pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{ann.title}</h3>
                    <time className="text-xs text-muted-foreground">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </time>
                  </div>
                  {ann.body && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {ann.body}
                    </p>
                  )}
                  {ann.author && (
                    <div className="flex items-center gap-2 mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          ann.author.avatar_url || "/icons/tecza-icons/1.svg"
                        }
                        alt=""
                        className="h-4 w-4 rounded-full"
                      />
                      <span className="text-xs text-muted-foreground">
                        {ann.author.display_name || ann.author.username}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            {community.has_posts !== false && (
              <TabsTrigger value="posts">Posty</TabsTrigger>
            )}
            {community.has_chat && <TabsTrigger value="chat">Czat</TabsTrigger>}
            {community.has_events && (
              <TabsTrigger value="events">Wydarzenia</TabsTrigger>
            )}
            {community.has_wiki && <TabsTrigger value="wiki">Wiki</TabsTrigger>}
            {community.has_kanban && (
              <TabsTrigger value="kanban">Zadania</TabsTrigger>
            )}
            {community.has_marketplace && (
              <TabsTrigger value="market">Giełda</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>O społeczności</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {community.description || "Brak opisu społeczności."}
                </p>
              </CardContent>
            </Card>

            {/* Community Features */}
            <Card>
              <CardHeader>
                <CardTitle>Funkcje społeczności</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {community.has_chat && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Czat</span>
                    </div>
                  )}
                  {community.has_events && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Wydarzenia</span>
                    </div>
                  )}
                  {community.has_wiki && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Wiki</span>
                    </div>
                  )}
                  {community.has_kanban && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Zadania</span>
                    </div>
                  )}
                  {community.has_marketplace && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Giełda</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Members Preview */}
            {members.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Członkowie ({community.members_count})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {members.slice(0, 6).map((member) => (
                      <Link
                        key={member.id}
                        href={member.username ? `/u/${member.username}` : "#"}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={member.avatar_url || "/icons/tecza-icons/1.svg"}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover border"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {member.display_name ||
                              member.username ||
                              "Użytkownik"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.role === "owner"
                              ? "Właściciel"
                              : member.role === "moderator"
                                ? "Moderator"
                                : "Członek"}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {members.length > 6 && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-muted-foreground">
                        i {members.length - 6} więcej...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {community.has_posts !== false && (
            <TabsContent value="posts" className="space-y-6">
              {membership.isMember && (
                <Card>
                  <CardHeader>
                    <CardTitle>Nowy post</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PostComposer
                      communityId={community.id}
                      onPosted={() => {
                        toast.success("Post został opublikowany")
                        setPostsRefreshToken((x) => x + 1)
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              <CommunityPosts
                communityId={community.id}
                refreshToken={postsRefreshToken}
              />
            </TabsContent>
          )}

          {community.has_chat && (
            <TabsContent value="chat" className="space-y-6">
              {membership.isMember ? (
                <CommunityChat
                  communityId={community.id}
                  currentUserId={currentUser?.id || null}
                  userRole={membership.role || "member"}
                />
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Dołącz do społeczności aby uczestniczyć w chacie</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {community.has_events && (
            <TabsContent value="events" className="space-y-6">
              <CommunityEvents
                communityId={community.id}
                currentUserId={currentUser?.id || null}
                isMember={membership.isMember}
              />
            </TabsContent>
          )}

          {community.has_wiki && (
            <TabsContent value="wiki" className="space-y-6">
              <CommunityWiki
                communityId={community.id}
                isEditor={
                  /* prettier-ignore */
                  membership.role === "owner" || membership.role === "moderator"
                }
                communitySlugOrId={community.slug || community.id}
              />
            </TabsContent>
          )}

          {community.has_kanban && (
            <TabsContent value="kanban" className="space-y-6">
              {membership.isMember ? (
                <CommunityKanban communityId={community.id} />
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Dołącz do społeczności aby zobaczyć zadania</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {community.has_marketplace && (
            <TabsContent value="market" className="space-y-6">
              <CommunityMarketplace communityId={community.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
