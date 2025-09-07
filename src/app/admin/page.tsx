"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Shield,
  Users,
  Bell,
  Settings,
  Database,
  ExternalLink,
  Search,
  Activity,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminHome() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [userRole, setUserRole] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingReports: 0,
    totalCommunities: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      if (!supabase) {
        setAllowed(false)
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase.auth.getUser()
        const u = data.user
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
        const highestRole =
          roles.find((r) =>
            ["super-administrator", "administrator", "moderator"].includes(r),
          ) || "user"

        setUserRole(highestRole)

        const ok = roles.some((r) =>
          ["moderator", "administrator", "super-administrator"].includes(r),
        )
        setAllowed(ok)

        if (!ok) {
          // Non-admins: redirect to dashboard
          window.location.href = "/d"
          return
        }

        // Load dashboard metrics
        const loadDashboardMetrics = async () => {
          try {
            // Load basic metrics
            const [usersResult, reportsResult, communitiesResult] =
              await Promise.all([
                supabase
                  .from("profiles")
                  .select("id,created_at", { count: "exact" }),
                supabase
                  .from("reports")
                  .select("id", { count: "exact" })
                  .eq("status", "pending"),
                supabase.from("communities").select("id", { count: "exact" }),
              ])

            setMetrics({
              totalUsers: usersResult.count || 0,
              activeUsers: usersResult.count || 0, // Simplified for now
              pendingReports: reportsResult.count || 0,
              totalCommunities: communitiesResult.count || 0,
              recentActivity: 0, // Placeholder
            })
          } catch (error) {
            console.error("Error loading metrics:", error)
          }
        }

        await loadDashboardMetrics()
      } catch (error) {
        console.error("Error loading admin data:", error)
        setAllowed(false)
      } finally {
        setLoading(false)
      }
    })()
  }, [supabase])

  if (allowed === null || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!allowed) return null

  // Define admin sections based on role
  const adminSections = [
    {
      title: "Moderacja",
      icon: Shield,
      color: "text-red-600",
      bgColor: "bg-red-50",
      items: [
        {
          title: "Moderacja treści",
          description: "Zgłoszenia, ukrywanie/usuwanie postów i komentarzy",
          href: "/admin/moderation/content",
          icon: MessageSquare,
          badge:
            metrics.pendingReports > 0
              ? `${metrics.pendingReports} oczekujących`
              : null,
          badgeColor: "bg-red-100 text-red-800",
        },
        {
          title: "Moderacja profili",
          description: "Zgłoszenia użytkowników, blokady",
          href: "/admin/moderation/profiles",
          icon: UserCheck,
        },
        {
          title: "Społeczności i wydarzenia",
          description: "Przegląd i interwencje",
          href: "/admin/moderation/communities",
          icon: Globe,
        },
      ],
    },
    {
      title: "Zarządzanie",
      icon: Settings,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      items: [
        {
          title: "Powiadomienia globalne",
          description: "Wyślij ogłoszenia do użytkowników",
          href: "/admin/notifications",
          icon: Bell,
        },
        {
          title: "Role i uprawnienia",
          description: "Zarządzaj rolami użytkowników",
          href: "/admin/roles",
          icon: Users,
          restricted: ["administrator", "super-administrator"],
        },
        {
          title: "Zarządzanie profilami",
          description: "Dodaj, modyfikuj, usuwaj profile",
          href: "/admin/profiles",
          icon: Database,
          restricted: ["super-administrator"],
        },
      ],
    },
    {
      title: "Narzędzia zewnętrzne",
      icon: ExternalLink,
      color: "text-green-600",
      bgColor: "bg-green-50",
      items: [
        {
          title: "Supabase Dashboard",
          description: "Przejdź do zarządzania bazą danych",
          href: "https://supabase.com/dashboard/project/earfxvgvrqgyfzuwaqga",
          icon: Database,
          external: true,
        },
        {
          title: "Vercel Projekt",
          description: "Zarządzanie wdrożeniem",
          href: "https://vercel.com/asterixixs-projects/tecza-app",
          icon: Globe,
          external: true,
        },
      ],
    },
  ]

  const filteredSections = adminSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !("restricted" in item) ||
          ("restricted" in item && item.restricted?.includes(userRole)),
      ),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">
                Panel administracyjny
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Zarządzaj platformą Tęcza.app
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {userRole === "super-administrator"
              ? "Super Administrator"
              : userRole === "administrator"
                ? "Administrator"
                : "Moderator"}
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj w panelu administracyjnym..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Użytkownicy
                </p>
                <p className="text-2xl font-bold">
                  {metrics.totalUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aktywni
                </p>
                <p className="text-2xl font-bold">
                  {metrics.activeUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Zgłoszenia
                </p>
                <p className="text-2xl font-bold">
                  {metrics.pendingReports.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Społeczności
                </p>
                <p className="text-2xl font-bold">
                  {metrics.totalCommunities.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections */}
      <div className="space-y-8">
        {filteredSections.map((section) => {
          const Icon = section.icon
          const filteredItems = section.items.filter(
            (item) =>
              !searchQuery ||
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
          )

          if (filteredItems.length === 0) return null

          return (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-6">
                <div className={cn("p-2 rounded-lg", section.bgColor)}>
                  <Icon className={cn("h-5 w-5", section.color)} />
                </div>
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => {
                  const ItemIcon = item.icon
                  const Component = "external" in item ? "a" : Link
                  const props =
                    "external" in item
                      ? {
                          href: item.href,
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                      : { href: item.href }

                  return (
                    <Component
                      key={item.title}
                      {...props}
                      className="group block"
                    >
                      <Card className="h-full transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                              <ItemIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold group-hover:text-primary transition-colors">
                                  {item.title}
                                </h3>
                                {"external" in item && (
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {item.description}
                              </p>
                              {"badge" in item && item.badge && (
                                <Badge
                                  variant="secondary"
                                  className={
                                    "badgeColor" in item ? item.badgeColor : ""
                                  }
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Component>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
