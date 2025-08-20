"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { PostComposer } from "@/components/dashboard/post-composer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { toast } from "sonner"
import Link from "next/link"

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
}

export default function CommunityPage() {
  const supabase = getSupabase()
  const params = useParams<{ id: string }>()
  const idOrSlug = params?.id
  const [community, setCommunity] = useState<Community | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [members, setMembers] = useState<
    {
      id: string
      username: string | null
      display_name: string | null
      avatar_url: string | null
      role: string
    }[]
  >([])
  const [announcements, setAnnouncements] = useState<
    { id: string; title: string; body: string | null }[]
  >([])
  const [newAnn, setNewAnn] = useState({ title: "", body: "" })

  useEffect(() => {
    async function load() {
      if (!supabase || !idOrSlug) return
      // Try by slug first, then by id
      let found: Community | null = null
      const bySlug = await supabase
        .from("communities")
        .select("*")
        .eq("slug", idOrSlug)
        .maybeSingle()
      if (bySlug.data) {
        found = bySlug.data as Community
      } else {
        const byId = await supabase
          .from("communities")
          .select("*")
          .eq("id", idOrSlug)
          .maybeSingle()
        if (byId.data) found = byId.data as Community
      }
      setCommunity(found)
      const me = (await supabase.auth.getUser()).data.user
      if (me && found?.id) {
        const { data: m } = await supabase
          .from("community_memberships")
          .select("id,role")
          .eq("community_id", found.id)
          .eq("user_id", me.id)
          .maybeSingle()
        setIsMember(!!m)
        setIsAdmin(!!m && (m.role === "owner" || m.role === "moderator"))
        // Load members for admins
        if (found.status === "active") {
          const { data: mem } = await supabase
            .from("community_memberships")
            .select("user_id,role")
            .eq("community_id", found.id)
          const ids = (mem || []).map((x) => x.user_id)
          if (ids.length) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id,username,display_name,avatar_url")
              .in("id", ids)
            const byId = new Map((profs || []).map((p) => [p.id, p]))
            setMembers(
              (mem || []).map((m) => ({
                id: m.user_id,
                username: byId.get(m.user_id)?.username || null,
                display_name: byId.get(m.user_id)?.display_name || null,
                avatar_url: byId.get(m.user_id)?.avatar_url || null,
                role: m.role,
              })),
            )
          } else setMembers([])
        }
        // Announcements
        const { data: ann } = await supabase
          .from("community_announcements")
          .select("id,title,body")
          .eq("community_id", found.id)
          .order("created_at", { ascending: false })
          .limit(3)
        setAnnouncements(ann || [])
      }
    }
    load()
  }, [supabase, idOrSlug])

  async function createAnnouncement() {
    if (!supabase || !community) return
    const title = newAnn.title.trim()
    const body = newAnn.body.trim()
    if (!title) {
      toast.info("Tytuł jest wymagany")
      return
    }
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return
    const { error, data } = await supabase
      .from("community_announcements")
      .insert({
        community_id: community.id,
        title,
        body: body || null,
        created_by: me.id,
      })
      .select("id,title,body")
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Dodano ogłoszenie")
    setNewAnn({ title: "", body: "" })
    setAnnouncements((prev) => [data!, ...prev].slice(0, 3))
  }

  async function updateRole(
    userId: string,
    role: "member" | "moderator" | "owner",
  ) {
    if (!supabase || !community) return
    try {
      await supabase.rpc("change_membership_role", {
        p_community: community.id,
        p_user: userId,
        p_role: role,
      })
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role } : m)),
      )
      toast.success("Zmieniono rolę")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zmienić roli"
      toast.error(msg)
    }
  }

  async function join() {
    if (!supabase || !community) return
    if (community.status && community.status !== "active") {
      toast.info("Ta społeczność oczekuje na akceptację moderatora.")
      return
    }
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return
    const role = me.id === community.owner_id ? "owner" : "member"
    const { error } = await supabase
      .from("community_memberships")
      .insert({ community_id: community.id, user_id: me.id, role })
    if (!error) setIsMember(true)
  }

  async function leave() {
    if (!supabase || !community) return
    const me = (await supabase.auth.getUser()).data.user
    if (!me) return
    await supabase
      .from("community_memberships")
      .delete()
      .eq("community_id", community.id)
      .eq("user_id", me.id)
    setIsMember(false)
  }

  if (!community)
    return <div className="mx-auto max-w-4xl p-4 md:p-6">Wczytywanie…</div>

  return (
    <div className="mx-auto max-w-4xl p-0 md:p-6">
      {announcements.length > 0 && (
        <div className="mb-4 rounded-md border bg-card">
          <div className="p-3">
            <div className="text-sm text-muted-foreground mb-2">Ogłoszenia</div>
            <ul className="grid gap-2">
              {announcements.map((a) => (
                <li key={a.id}>
                  <div className="font-medium">{a.title}</div>
                  {a.body ? (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {a.body}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {isAdmin && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-2">Dodaj ogłoszenie</h2>
            <div className="grid gap-2">
              <Input
                placeholder="Tytuł"
                value={newAnn.title}
                onChange={(e) =>
                  setNewAnn((p) => ({ ...p, title: e.target.value }))
                }
              />
              <Textarea
                placeholder="Treść (opcjonalnie)"
                value={newAnn.body}
                onChange={(e) =>
                  setNewAnn((p) => ({ ...p, body: e.target.value }))
                }
              />
              <div className="flex justify-end">
                <Button onClick={createAnnouncement}>Opublikuj</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="relative h-40 w-full overflow-hidden">
        {community.cover_image_url ? (
          <Image
            src={community.cover_image_url}
            alt="Okładka"
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      <div className="-mt-8 px-4 md:px-0">
        <div className="flex items-end gap-3">
          <Image
            src={community.avatar_url || "/icons/tecza-icons/2.svg"}
            alt="Avatar"
            width={64}
            height={64}
            className="h-16 w-16 rounded-md object-cover border bg-background"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{community.name}</h1>
            <div className="text-sm text-muted-foreground">
              {community.members_count} członków
              {community.city || community.country
                ? ` • ${[community.city, community.country].filter(Boolean).join(", ")}`
                : ""}
            </div>
          </div>
          <div>
            {isMember ? (
              <Button variant="outline" onClick={leave}>
                Opuść
              </Button>
            ) : (
              <Button onClick={join}>Dołącz</Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-1">Opis</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {community.description || "Brak opisu."}
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-3">Członkowie</h2>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak członków.</p>
              ) : (
                <ul className="grid gap-2">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <Link
                        href={m.username ? `/u/${m.username}` : `#`}
                        className="flex items-center gap-3"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.avatar_url || "/icons/tecza-icons/1.svg"}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover border"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {m.display_name || m.username || "Użytkownik"}
                          </div>
                          {m.username && (
                            <div className="text-xs text-muted-foreground truncate">
                              @{m.username}
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={
                            m.role === "member" ? "secondary" : "outline"
                          }
                          onClick={() => updateRole(m.id, "member")}
                        >
                          Member
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            m.role === "moderator" ? "secondary" : "outline"
                          }
                          onClick={() => updateRole(m.id, "moderator")}
                        >
                          Moderator
                        </Button>
                        <Button
                          size="sm"
                          variant={m.role === "owner" ? "secondary" : "outline"}
                          onClick={() => updateRole(m.id, "owner")}
                        >
                          Owner
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {isMember && (
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-3">Nowy post</h2>
              <PostComposer
                communityId={community.id}
                onPosted={() => {
                  /* could refresh list later */
                }}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-1">Wiki</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Wersja MVP: strona wiki społeczności. W kolejnej iteracji dodamy
              edycję i listę stron.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/c/${community.slug || community.id}/wiki`}>
                Przejdź do wiki
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
