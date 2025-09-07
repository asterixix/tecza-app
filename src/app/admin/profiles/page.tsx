"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Search,
  Edit,
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  email: string | null
  bio: string | null
  city: string | null
  country: string | null
  roles: string[]
  badges: string[]
  suspended_at: string | null
  suspended_reason: string | null
  created_at: string
  updated_at: string
  avatar_url: string | null
  cover_image_url: string | null
  profile_visibility: "public" | "friends" | "private"
  show_location: boolean
  show_orientation: boolean
  show_friends: boolean
  show_contacts: boolean
  show_socials: boolean
}

const ROLE_OPTIONS = [
  { id: "user", name: "Użytkownik", color: "text-gray-600" },
  { id: "company", name: "Firma", color: "text-blue-600" },
  { id: "user-supporter", name: "Wspierający", color: "text-yellow-600" },
  {
    id: "company-supporter",
    name: "Firma wspierająca",
    color: "text-yellow-600",
  },
  { id: "early-tester", name: "Wczesny tester", color: "text-purple-600" },
  { id: "tester", name: "Tester", color: "text-purple-600" },
  { id: "moderator", name: "Moderator", color: "text-orange-600" },
  { id: "administrator", name: "Administrator", color: "text-red-600" },
  {
    id: "super-administrator",
    name: "Super Administrator",
    color: "text-red-800",
  },
]

export default function ProfilesManagement() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended"
  >("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const loadProfiles = useCallback(async () => {
    if (!supabase) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id, username, display_name, email, bio, city, country,
          roles, badges, suspended_at, suspended_reason,
          created_at, updated_at, avatar_url, cover_image_url,
          profile_visibility, show_location, show_orientation,
          show_friends, show_contacts, show_socials
        `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error
      setProfiles((data as Profile[]) || [])
    } catch (error) {
      console.error("Error loading profiles:", error)
      toast.error("Nie udało się załadować profili")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    ;(async () => {
      if (!supabase) {
        setAllowed(false)
        setLoading(false)
        return
      }

      try {
        const u = (await supabase.auth.getUser()).data.user
        if (!u) {
          setAllowed(false)
          setLoading(false)
          return
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("roles")
          .eq("id", u.id)
          .maybeSingle()

        const roles = (prof?.roles as string[] | undefined) || []
        const ok = roles.includes("super-administrator")
        setAllowed(ok)

        if (!ok) {
          setLoading(false)
          window.location.href = "/d"
          return
        }

        await loadProfiles()
      } catch (error) {
        console.error("Error checking permissions:", error)
        setAllowed(false)
      } finally {
        setLoading(false)
      }
    })()
  }, [supabase, loadProfiles])

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        !searchQuery ||
        (profile.username || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (profile.display_name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (profile.email || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !profile.suspended_at) ||
        (statusFilter === "suspended" && profile.suspended_at)

      const matchesRole =
        roleFilter === "all" || profile.roles.includes(roleFilter)

      return matchesSearch && matchesStatus && matchesRole
    })
  }, [profiles, searchQuery, statusFilter, roleFilter])

  if (allowed === null || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Brak uprawnień</h2>
            <p className="text-muted-foreground">
              Tylko super administratorzy mogą zarządzać profilami.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Zarządzanie profilami
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Zarządzaj profilami użytkowników, rolami i uprawnieniami
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Wszyscy użytkownicy
                </p>
                <p className="text-2xl font-bold">{profiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aktywni
                </p>
                <p className="text-2xl font-bold">
                  {profiles.filter((p) => !p.suspended_at).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Zablokowani
                </p>
                <p className="text-2xl font-bold">
                  {profiles.filter((p) => p.suspended_at).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Moderatorzy
                </p>
                <p className="text-2xl font-bold">
                  {profiles.filter((p) => p.roles.includes("moderator")).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj użytkowników..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy</SelectItem>
                <SelectItem value="active">Aktywni</SelectItem>
                <SelectItem value="suspended">Zablokowani</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Rola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie role</SelectItem>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={loadProfiles}>
            <Loader2 className="h-4 w-4 mr-2" />
            Odśwież
          </Button>
        </div>
      </div>

      {/* Profiles List */}
      <div className="space-y-4">
        {filteredProfiles.map((profile) => (
          <Card key={profile.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {profile.display_name ||
                              profile.username ||
                              "Bez nazwy"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            @{profile.username || profile.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {profile.suspended_at ? (
                          <Badge variant="destructive">Zablokowany</Badge>
                        ) : (
                          <Badge variant="outline">Aktywny</Badge>
                        )}

                        {profile.roles.map((role) => {
                          const roleOption = ROLE_OPTIONS.find(
                            (r) => r.id === role,
                          )
                          return (
                            <Badge
                              key={role}
                              variant="secondary"
                              className={roleOption?.color}
                            >
                              {roleOption?.name || role}
                            </Badge>
                          )
                        })}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        {profile.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {profile.email}
                          </div>
                        )}
                        {profile.city && profile.country && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {profile.city}, {profile.country}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Dołączył:{" "}
                          {new Date(profile.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {profile.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {profile.bio}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edytuj
                      </Button>

                      {profile.suspended_at ? (
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Odblokuj
                        </Button>
                      ) : (
                        <Button variant="destructive" size="sm">
                          <XCircle className="h-4 w-4 mr-2" />
                          Zablokuj
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProfiles.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Brak użytkowników</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || roleFilter !== "all"
                  ? "Nie znaleziono użytkowników spełniających kryteria wyszukiwania."
                  : "Nie ma jeszcze żadnych użytkowników w systemie."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
