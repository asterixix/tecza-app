"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Users,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Mail,
  Filter,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  email: string | null
  suspended_at: string | null
  suspended_reason: string | null
  created_at: string
  roles: string[]
  badges: string[]
}

export default function ProfilesModeration() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended"
  >("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [updatingProfiles, setUpdatingProfiles] = useState<Set<string>>(
    new Set(),
  )
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    moderators: 0,
  })

  const loadProfiles = useCallback(async () => {
    if (!supabase) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id, username, display_name, email, suspended_at, suspended_reason,
          created_at, roles, badges
        `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error
      setProfiles((data as ProfileRow[]) || [])

      // Calculate stats
      const totalUsers = data?.length || 0
      const activeUsers = data?.filter((p) => !p.suspended_at).length || 0
      const suspendedUsers = data?.filter((p) => p.suspended_at).length || 0
      const moderators =
        data?.filter((p) => p.roles?.includes("moderator")).length || 0

      setStats({
        totalUsers,
        activeUsers,
        suspendedUsers,
        moderators,
      })
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
        const ok = roles.some((r) =>
          ["moderator", "administrator", "super-administrator"].includes(r),
        )
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

  const banUser = async (id: string, reason: string) => {
    if (!supabase) return

    setUpdatingProfiles((prev) => new Set(prev).add(id))

    try {
      const { error } = await supabase.rpc("admin_ban_user", {
        p_user_id: id,
        p_reason: reason,
      })

      if (error) throw error

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                suspended_at: new Date().toISOString(),
                suspended_reason: reason,
              }
            : p,
        ),
      )

      toast.success("Użytkownik został zablokowany")
    } catch (error) {
      console.error("Error banning user:", error)
      toast.error("Nie udało się zablokować użytkownika")
    } finally {
      setUpdatingProfiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const unbanUser = async (id: string) => {
    if (!supabase) return

    setUpdatingProfiles((prev) => new Set(prev).add(id))

    try {
      const { error } = await supabase.rpc("admin_unban_user", {
        p_user_id: id,
      })

      if (error) throw error

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, suspended_at: null, suspended_reason: null }
            : p,
        ),
      )

      toast.success("Użytkownik został odblokowany")
    } catch (error) {
      console.error("Error unbanning user:", error)
      toast.error("Nie udało się odblokować użytkownika")
    } finally {
      setUpdatingProfiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const filtered = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        !query ||
        (profile.username || "").toLowerCase().includes(query.toLowerCase()) ||
        (profile.display_name || "")
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        (profile.email || "").toLowerCase().includes(query.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !profile.suspended_at) ||
        (statusFilter === "suspended" && profile.suspended_at)

      const matchesRole =
        roleFilter === "all" || profile.roles?.includes(roleFilter)

      return matchesSearch && matchesStatus && matchesRole
    })
  }, [profiles, query, statusFilter, roleFilter])

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
              Tylko moderatorzy mogą zarządzać profilami.
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
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Moderacja profili
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Zarządzaj statusem użytkowników i moderuj konta
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
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
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
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
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
                <p className="text-2xl font-bold">{stats.suspendedUsers}</p>
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
                <p className="text-2xl font-bold">{stats.moderators}</p>
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
                <SelectItem value="user">Użytkownik</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
                <SelectItem value="super-administrator">
                  Super Administrator
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={loadProfiles}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Odśwież
          </Button>
        </div>
      </div>

      {/* Profiles List */}
      <div className="space-y-4">
        {filtered.map((profile) => {
          const isUpdating = updatingProfiles.has(profile.id)

          return (
            <Card key={profile.id} className={isUpdating ? "opacity-50" : ""}>
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

                          {profile.roles?.map((role) => (
                            <Badge key={role} variant="secondary">
                              {role}
                            </Badge>
                          ))}
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          {profile.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {profile.email}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Dołączył:{" "}
                            {new Date(profile.created_at).toLocaleDateString()}
                          </div>
                          {profile.suspended_at && (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-3 w-3" />
                              Zablokowany:{" "}
                              {new Date(
                                profile.suspended_at,
                              ).toLocaleDateString()}
                              {profile.suspended_reason &&
                                ` - ${profile.suspended_reason}`}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {profile.suspended_at ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unbanUser(profile.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Odblokuj
                              </>
                            )}
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Zablokuj
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Zablokuj użytkownika
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Czy na pewno chcesz zablokować użytkownika{" "}
                                  {profile.display_name || profile.username}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    const reason =
                                      prompt("Powód blokady:") || "moderation"
                                    banUser(profile.id, reason)
                                  }}
                                >
                                  Zablokuj
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Brak użytkowników</h3>
              <p className="text-muted-foreground">
                {query || statusFilter !== "all" || roleFilter !== "all"
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
