"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
  social_links: Record<string, string> | null
  city: string | null
  country: string | null
  profile_visibility: "public" | "friends" | "private"
  show_location: boolean
  show_orientation: boolean
  show_friends?: boolean | null
}

type PostRecord = {
  id: string
  user_id: string
  content: string
  visibility: string
  created_at: string
}

export default function PublicUserPage() {
  const supabase = getSupabase()
  const params = useParams<{ username: string }>()
  const username = params?.username
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isFriend, setIsFriend] = useState<boolean>(false)
  const [connecting, setConnecting] = useState(false)
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'incoming' | 'accepted'>('none')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [friends, setFriends] = useState<{ id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]>([])

  useEffect(() => {
    async function load() {
      if (!supabase || !username) return
      setLoading(true)
  const { data: prof } = await supabase
        .from("profiles")
        .select("id,username,display_name,bio,avatar_url,cover_image_url,sexual_orientation,gender_identity,pronouns,website,social_links,city,country,profile_visibility,show_location,show_orientation,show_friends")
        .eq("username", username)
        .maybeSingle()
  if (!prof) { setLoading(false); return }
  const profRow = prof as unknown as Profile
  setProfile(profRow)

      // check friendship
      const me = (await supabase.auth.getUser()).data.user
      if (me) {
        const { data: edges } = await supabase
          .from("friendships")
          .select("id")
          .or(`and(user1_id.eq.${me.id},user2_id.eq.${profRow.id}),and(user1_id.eq.${profRow.id},user2_id.eq.${me.id})`)
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
            setRequestStatus(reqOut[0].status === 'pending' ? 'pending' : 'accepted')
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
              setRequestStatus(reqIn[0].status === 'pending' ? 'incoming' : 'accepted')
            } else {
              setRequestStatus('none')
              setRequestId(null)
            }
          }
        }
      }

      const { data: userPosts } = await supabase
        .from("posts")
        .select("id,user_id,content,visibility,created_at")
        .eq("user_id", profRow.id)
        .order("created_at", { ascending: false })
        .limit(20)
      setPosts((userPosts as PostRecord[]) || [])

      // friends list (respect show_friends)
  if (profRow.show_friends !== false) {
        const { data: edges } = await supabase
          .from("friendships")
          .select("user1_id,user2_id")
          .or(`user1_id.eq.${profRow.id},user2_id.eq.${profRow.id}`)
          .eq("status", "active")
          .limit(50)
        const friendIds = new Set<string>()
        edges?.forEach(e => {
          if (e.user1_id === profRow.id) friendIds.add(e.user2_id)
          if (e.user2_id === profRow.id) friendIds.add(e.user1_id)
        })
        if (friendIds.size) {
          const { data: fr } = await supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url")
            .in("id", Array.from(friendIds))
            .limit(50)
          setFriends((fr as unknown as { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[]) || [])
        }
      }
      setLoading(false)
    }
    load()
  }, [supabase, username, isFriend])

  const name = profile?.display_name || profile?.username || username
  const showLocation = profile?.show_location && (profile.city || profile.country)
  const orients = (profile?.show_orientation ? profile?.sexual_orientation : null) || []
  const genders = (profile?.show_orientation ? profile?.gender_identity : null) || []

  async function sendRequest() {
    if (!supabase || !profile) return
    setConnecting(true)
    try {
      const me = (await supabase.auth.getUser()).data.user
      if (!me) throw new Error("Zaloguj się, aby wysłać zaproszenie")
      const { data, error } = await supabase.from("friend_requests").insert({ sender_id: me.id, receiver_id: profile.id, status: 'pending' }).select("id").single()
      if (error) throw error
      setRequestId(data.id)
      setRequestStatus('pending')
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
      await supabase.from("friend_requests").update({ status: 'accepted', responded_at: new Date().toISOString() }).eq("id", requestId)
      // create friendship
      const user1 = me.id < profile.id ? me.id : profile.id
      const user2 = me.id < profile.id ? profile.id : me.id
      await supabase.from("friendships").insert({ user1_id: user1, user2_id: user2, status: "active" })
      setIsFriend(true)
      setRequestStatus('accepted')
    } finally {
      setConnecting(false)
    }
  }

  async function cancelRequest() {
    if (!supabase || !requestId) return
    setConnecting(true)
    try {
      await supabase.from("friend_requests").update({ status: 'cancelled', responded_at: new Date().toISOString() }).eq("id", requestId)
      setRequestStatus('none')
      setRequestId(null)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 space-y-6">
      <div className="relative h-40 w-full overflow-hidden rounded-md border bg-muted">
        {!!profile?.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.cover_image_url} alt="Okładka" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
            <div className="-mt-12 h-24 w-24 rounded-full ring-2 ring-background overflow-hidden bg-muted border">
              {!!profile?.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold tracking-tight">{loading ? "Ładowanie…" : name}</h1>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {orients?.map((o, i) => (
                  <Badge key={`o-${i}`} variant="secondary">{o}</Badge>
                ))}
                {genders?.map((g, i) => (
                  <Badge key={`g-${i}`}>{g}</Badge>
                ))}
              </div>
            </div>
            {profile && (
              isFriend ? (
                <Button variant="outline" size="sm" disabled>Połączeni</Button>
              ) : requestStatus === 'pending' ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>Wysłano zaproszenie</Button>
                  <Button variant="ghost" size="sm" onClick={cancelRequest} disabled={connecting}>Anuluj</Button>
                </div>
              ) : requestStatus === 'incoming' ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={acceptRequest} disabled={connecting}>{connecting ? 'Akceptowanie…' : 'Akceptuj'}</Button>
                  <Button variant="ghost" size="sm" onClick={cancelRequest} disabled={connecting}>Odrzuć</Button>
                </div>
              ) : (
                <Button size="sm" onClick={sendRequest} disabled={connecting}>{connecting ? "Wysyłanie…" : "Połącz się"}</Button>
              )
            )}
            </div>

            {profile?.bio && (
              <p className="mt-4 whitespace-pre-wrap">{profile.bio}</p>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Posty</h2>
              <div className="space-y-3">
                {posts.map(p => (
                  <Card key={p.id}><CardContent className="p-4 whitespace-pre-wrap">{p.content}</CardContent></Card>
                ))}
                {posts.length === 0 && <p className="text-sm text-muted-foreground">Brak postów do wyświetlenia.</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Informacje</h3>
              <div className="grid gap-2 text-sm text-muted-foreground">
                {showLocation && (
                  <div>Miejscowość: <span className="text-foreground">{[profile?.city, profile?.country].filter(Boolean).join(", ")}</span></div>
                )}
                {profile?.website && (
                  <div>Strona: <a className="text-primary hover:underline" href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a></div>
                )}
                {profile?.social_links && (
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(profile.social_links).map(([k, v]) => (
                      <a key={k} href={v} className="hover:underline" target="_blank" rel="noreferrer">{k}</a>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(profile?.show_friends ?? true) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Znajomi</h3>
                {friends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Brak znajomych do wyświetlenia.</p>
                ) : (
                  <ul className="grid gap-2">
                    {friends.map(f => (
                      <li key={f.id} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-muted border" aria-hidden>
                          {f.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={f.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-medium truncate">{f.display_name || f.username || "Użytkownik"}</div>
                          {f.username && <div className="text-xs text-muted-foreground">@{f.username}</div>}
                        </div>
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
