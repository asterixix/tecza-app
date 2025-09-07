"use client"

import { useCallback, useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  Search,
  Shield,
  Crown,
  Star,
  Award,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const ALL_ROLES = [
  {
    id: "user",
    name: "Użytkownik",
    description: "Podstawowy użytkownik platformy",
    icon: Users,
    color: "text-gray-600",
  },
  {
    id: "company",
    name: "Firma",
    description: "Konto firmowe",
    icon: Users,
    color: "text-blue-600",
  },
  {
    id: "user-supporter",
    name: "Wspierający użytkownik",
    description: "Użytkownik wspierający finansowo",
    icon: Star,
    color: "text-yellow-600",
  },
  {
    id: "company-supporter",
    name: "Wspierająca firma",
    description: "Firma wspierająca finansowo",
    icon: Star,
    color: "text-yellow-600",
  },
  {
    id: "early-tester",
    name: "Wczesny tester",
    description: "Użytkownik testujący wczesne wersje",
    icon: Award,
    color: "text-purple-600",
  },
  {
    id: "tester",
    name: "Tester",
    description: "Użytkownik testujący funkcje",
    icon: Award,
    color: "text-purple-600",
  },
  {
    id: "moderator",
    name: "Moderator",
    description: "Moderuje treści i użytkowników",
    icon: Shield,
    color: "text-orange-600",
  },
  {
    id: "administrator",
    name: "Administrator",
    description: "Zarządza platformą",
    icon: Shield,
    color: "text-red-600",
  },
  {
    id: "super-administrator",
    name: "Super Administrator",
    description: "Pełne uprawnienia administracyjne",
    icon: Crown,
    color: "text-red-800",
  },
]

// Badge catalog aligned with profile UI
const ALL_BADGES = [
  {
    id: "user-supporter",
    name: "Wspierający",
    description: "Wspiera platformę finansowo",
    icon: Star,
    color: "text-yellow-600",
  },
  {
    id: "company-supporter",
    name: "Firma wspierająca",
    description: "Firma wspierająca platformę",
    icon: Star,
    color: "text-yellow-600",
  },
  {
    id: "early-tester",
    name: "Wczesny tester",
    description: "Testował wczesne wersje",
    icon: Award,
    color: "text-purple-600",
  },
  {
    id: "tester",
    name: "Tester",
    description: "Aktywny tester funkcji",
    icon: Award,
    color: "text-purple-600",
  },
  {
    id: "moderator",
    name: "Moderator",
    description: "Moderuje społeczność",
    icon: Shield,
    color: "text-orange-600",
  },
  {
    id: "administrator",
    name: "Administrator",
    description: "Zarządza platformą",
    icon: Shield,
    color: "text-red-600",
  },
  {
    id: "super-administrator",
    name: "Super Admin",
    description: "Pełne uprawnienia",
    icon: Crown,
    color: "text-red-800",
  },
  {
    id: "ambassador",
    name: "Ambasador",
    description: "Reprezentuje platformę",
    icon: Star,
    color: "text-blue-600",
  },
  {
    id: "company",
    name: "Firma",
    description: "Konto firmowe",
    icon: Users,
    color: "text-blue-600",
  },
  {
    id: "banned",
    name: "Zablokowany",
    description: "Konto zablokowane",
    icon: XCircle,
    color: "text-red-600",
  },
  {
    id: "tecza-team",
    name: "Zespół Tęcza",
    description: "Członek zespołu",
    icon: Crown,
    color: "text-purple-600",
  },
  {
    id: "pride2026",
    name: "Pride 2026",
    description: "Uczestnik Pride 2026",
    icon: Star,
    color: "text-rainbow-600",
  },
  {
    id: "hiv-positive-campaigh",
    name: "Kampania HIV+",
    description: "Uczestnik kampanii",
    icon: Star,
    color: "text-red-600",
  },
  {
    id: "1-anniversary",
    name: "1 rok",
    description: "Rocznicowa odznaka",
    icon: Award,
    color: "text-yellow-600",
  },
  {
    id: "3-anniversary",
    name: "3 lata",
    description: "Rocznicowa odznaka",
    icon: Award,
    color: "text-yellow-600",
  },
  {
    id: "5-anniversary",
    name: "5 lat",
    description: "Rocznicowa odznaka",
    icon: Award,
    color: "text-yellow-600",
  },
  {
    id: "10-anniversary",
    name: "10 lat",
    description: "Rocznicowa odznaka",
    icon: Award,
    color: "text-yellow-600",
  },
]

export default function RolesAdmin() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"roles" | "badges">("roles")
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set())
  const [list, setList] = useState<
    Array<{
      id: string
      username: string | null
      roles: string[]
      badges: string[]
    }>
  >([])

  const refresh = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id,username,roles,badges")
        .order("username")
      const typed =
        (data as Array<{
          id: string
          username: string | null
          roles: string[] | null
          badges: string[] | null
        }> | null) || []
      setList(
        typed.map((r) => ({
          id: r.id,
          username: r.username,
          roles: r.roles || [],
          badges: r.badges || [],
        })),
      )
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Nie udało się załadować użytkowników")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    ;(async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase.auth.getUser()
        const u = data.user
        if (!u) {
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
          ["administrator", "super-administrator"].includes(r),
        )
        setAllowed(ok)

        if (!ok) {
          setLoading(false)
          return
        }

        await refresh()
      } catch (error) {
        console.error("Error checking permissions:", error)
        setLoading(false)
      }
    })()
  }, [supabase, refresh])

  async function toggleRole(userId: string, role: string) {
    if (!supabase) return

    setUpdatingUsers((prev) => new Set(prev).add(userId))

    try {
      const row = list.find((x) => x.id === userId)
      if (!row) return

      const next = new Set(row.roles || [])
      const wasActive = next.has(role)

      if (wasActive) {
        next.delete(role)
      } else {
        next.add(role)
      }

      const nextArr = Array.from(next)
      const { error } = await supabase.rpc("admin_set_roles", {
        p_user_id: userId,
        p_roles: nextArr,
      })

      if (error) {
        toast.error(`Nie udało się ${wasActive ? "usunąć" : "dodać"} rolę`)
        throw error
      }

      setList(list.map((x) => (x.id === userId ? { ...x, roles: nextArr } : x)))
      toast.success(`Rola ${wasActive ? "usunięta" : "dodana"} pomyślnie`)
    } catch (error) {
      console.error("Error toggling role:", error)
    } finally {
      setUpdatingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  async function toggleBadge(userId: string, badge: string) {
    if (!supabase) return

    setUpdatingUsers((prev) => new Set(prev).add(userId))

    try {
      const row = list.find((x) => x.id === userId)
      if (!row) return

      const next = new Set(row.badges || [])
      const wasActive = next.has(badge)

      if (wasActive) {
        next.delete(badge)
      } else {
        next.add(badge)
      }

      const nextArr = Array.from(next)
      const { error } = await supabase.rpc("admin_set_badges", {
        p_user_id: userId,
        p_badges: nextArr,
      })

      if (error) {
        toast.error(`Nie udało się ${wasActive ? "usunąć" : "dodać"} odznakę`)
        throw error
      }

      setList(
        list.map((x) => (x.id === userId ? { ...x, badges: nextArr } : x)),
      )
      toast.success(`Odznaka ${wasActive ? "usunięta" : "dodana"} pomyślnie`)
    } catch (error) {
      console.error("Error toggling badge:", error)
    } finally {
      setUpdatingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Brak uprawnień</h2>
            <p className="text-muted-foreground">
              Nie masz uprawnień do zarządzania rolami użytkowników.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const filteredUsers = list.filter(
    (user) =>
      !query ||
      (user.username || "").toLowerCase().includes(query.toLowerCase()) ||
      user.id.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Zarządzanie rolami i odznakami
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Przypisuj role i odznaki użytkownikom platformy
        </p>
      </div>

      {/* Search and Stats */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj użytkowników..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {filteredUsers.length} użytkowników
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "roles" ? "default" : "ghost"}
            onClick={() => setActiveTab("roles")}
            className="rounded-b-none"
          >
            <Shield className="h-4 w-4 mr-2" />
            Role ({ALL_ROLES.length})
          </Button>
          <Button
            variant={activeTab === "badges" ? "default" : "ghost"}
            onClick={() => setActiveTab("badges")}
            className="rounded-b-none"
          >
            <Award className="h-4 w-4 mr-2" />
            Odznaki ({ALL_BADGES.length})
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "roles" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role użytkowników
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Użytkownik</th>
                    {ALL_ROLES.map((role) => {
                      const Icon = role.icon
                      return (
                        <th
                          key={role.id}
                          className="text-center p-4 min-w-[120px]"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Icon className={cn("h-4 w-4", role.color)} />
                            <span className="text-xs font-medium">
                              {role.name}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.username || "Bez nazwy"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      {ALL_ROLES.map((role) => {
                        const checked = user.roles.includes(role.id)
                        const isUpdating = updatingUsers.has(user.id)
                        return (
                          <td key={role.id} className="p-4 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={checked}
                                disabled={isUpdating}
                                onCheckedChange={() =>
                                  toggleRole(user.id, role.id)
                                }
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                            {isUpdating && (
                              <Loader2 className="h-3 w-3 animate-spin mx-auto mt-1" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Odznaki użytkowników
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Użytkownik</th>
                    {ALL_BADGES.map((badge) => {
                      const Icon = badge.icon
                      return (
                        <th
                          key={badge.id}
                          className="text-center p-4 min-w-[120px]"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Icon className={cn("h-4 w-4", badge.color)} />
                            <span className="text-xs font-medium">
                              {badge.name}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.username || "Bez nazwy"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      {ALL_BADGES.map((badge) => {
                        const checked = user.badges.includes(badge.id)
                        const isUpdating = updatingUsers.has(user.id)
                        return (
                          <td key={badge.id} className="p-4 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={checked}
                                disabled={isUpdating}
                                onCheckedChange={() =>
                                  toggleBadge(user.id, badge.id)
                                }
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                            {isUpdating && (
                              <Loader2 className="h-3 w-3 animate-spin mx-auto mt-1" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
