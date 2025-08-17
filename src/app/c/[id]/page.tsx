"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { PostComposer } from "@/components/dashboard/post-composer"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { toast } from "sonner"

interface Community {
  id: string
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
          .select("id")
          .eq("community_id", found.id)
          .eq("user_id", me.id)
          .maybeSingle()
        setIsMember(!!m)
      }
    }
    load()
  }, [supabase, idOrSlug])

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
            <h2 className="text-lg font-semibold mb-1">Członkowie i treści</h2>
            <p className="text-sm text-muted-foreground">
              Wersja MVP: lista członków i postów społeczności do dodania w
              kolejnych iteracjach.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
