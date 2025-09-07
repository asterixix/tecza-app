"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  MessageSquare,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react"
import { toast } from "sonner"

// Simple rainbow bar style for preview
function RainbowBar() {
  return (
    <div
      aria-hidden
      className="h-1 w-full rounded"
      style={{
        background:
          "linear-gradient(90deg,#e40303,#ff8c00,#ffed00,#008018,#0078d7,#732982)",
      }}
    />
  )
}

type AppRole =
  | "user"
  | "company"
  | "user-supporter"
  | "company-supporter"
  | "early-tester"
  | "tester"
  | "moderator"
  | "administrator"
  | "super-administrator"

type NotificationBroadcast = {
  id: string
  audience: string
  target_role?: string | null
  title: string
  send_at: string
  status: string
  dispatched_at?: string | null
  created_at: string
}

export default function AdminNotificationsPage() {
  const supabase = getSupabase()

  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [audience, setAudience] = useState<"all" | "role" | "user">("all")
  const [role, setRole] = useState<AppRole | "">("")
  const [username, setUsername] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [actionUrl, setActionUrl] = useState("")
  const [sendAt, setSendAt] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [recent, setRecent] = useState<NotificationBroadcast[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [stats, setStats] = useState({
    totalSent: 0,
    pendingCount: 0,
    todaySent: 0,
    lastWeekSent: 0,
  })

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
        const ok = roles.some((r) =>
          ["administrator", "super-administrator"].includes(r),
        )
        setAllowed(ok)

        if (!ok) {
          setLoading(false)
          window.location.href = "/d"
          return
        }

        await Promise.all([loadRecent(), loadStats()])
      } catch (error) {
        console.error("Error checking permissions:", error)
        setAllowed(false)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const loadRecent = useCallback(async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from("notification_broadcasts")
        .select(
          "id,audience,target_role,title,send_at,status,dispatched_at,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error loading recent broadcasts:", error)
        toast.error("Nie udało się załadować historii powiadomień")
        return
      }

      setRecent(data || [])
    } catch (error) {
      console.error("Error in loadRecent:", error)
      toast.error("Nie udało się załadować historii powiadomień")
    }
  }, [supabase])

  const loadStats = useCallback(async () => {
    if (!supabase) return
    try {
      const [totalResult, pendingResult, todayResult, weekResult] =
        await Promise.all([
          supabase
            .from("notification_broadcasts")
            .select("id", { count: "exact" }),
          supabase
            .from("notification_broadcasts")
            .select("id", { count: "exact" })
            .eq("status", "pending"),
          supabase
            .from("notification_broadcasts")
            .select("id", { count: "exact" })
            .gte("created_at", new Date().toISOString().split("T")[0]),
          supabase
            .from("notification_broadcasts")
            .select("id", { count: "exact" })
            .gte(
              "created_at",
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            ),
        ])

      setStats({
        totalSent: totalResult.count || 0,
        pendingCount: pendingResult.count || 0,
        todaySent: todayResult.count || 0,
        lastWeekSent: weekResult.count || 0,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }, [supabase])

  const dueHint = useMemo(() => {
    if (!sendAt) return "Wysyłka natychmiast po zatwierdzeniu"
    const d = new Date(sendAt)
    if (isNaN(d.getTime())) return "Nieprawidłowa data"
    return `Zaplanowano na ${d.toLocaleString()}`
  }, [sendAt])

  async function onSubmit() {
    if (!supabase) return
    setSubmitting(true)
    try {
      // Resolve user id for username if needed
      let target_user_id: string | null = null
      if (audience === "user") {
        const { data: u } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.toLowerCase())
          .maybeSingle()
        if (!u) throw new Error("Nie znaleziono użytkownika o takiej nazwie")
        target_user_id = (u as { id: string }).id
      }

      const { error } = await supabase.rpc("admin_create_broadcast", {
        p_audience: audience,
        p_target_role: audience === "role" ? (role as string) : null,
        p_target_user_id: target_user_id,
        p_title: title,
        p_body: body,
        p_action_url: actionUrl || null,
        p_send_at: sendAt
          ? new Date(sendAt).toISOString()
          : new Date().toISOString(),
      })
      if (error) throw error

      toast.success("Wiadomość została utworzona")
      setTitle("")
      setBody("")
      setActionUrl("")
      setUsername("")
      setRole("")
      setSendAt("")
      await Promise.all([loadRecent(), loadStats()])

      // Trigger a refresh of the notification system for all users
      // This will be handled by the database triggers and realtime subscriptions
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Nie udało się zapisać"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function dispatchDue() {
    if (!supabase) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase.rpc(
        "admin_dispatch_due_broadcasts",
      )
      if (error) throw error

      const recipientCount = (data as number) || 0
      toast.success(`Wysłano do ${recipientCount} odbiorców`)

      await Promise.all([loadRecent(), loadStats()])

      // If notifications were sent, inform users to refresh their notification popover
      if (recipientCount > 0) {
        toast.success(
          "Użytkownicy otrzymają powiadomienia w czasie rzeczywistym",
        )
      }
    } catch (e: unknown) {
      toast.error(
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Nie udało się wysłać",
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function triggerEventReminders() {
    if (!supabase) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase.rpc(
        "admin_dispatch_event_reminders",
      )
      if (error) throw error
      const count = (data as number) || 0
      toast.success(`Dodano ${count} przypomnień o wydarzeniach`)
    } catch (e: unknown) {
      toast.error(
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Nie udało się uruchomić przypomnień",
      )
    } finally {
      setSubmitting(false)
    }
  }

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
              Tylko administratorzy mogą zarządzać powiadomieniami.
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
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Powiadomienia globalne
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Zarządzaj powiadomieniami push i ogłoszeniami dla użytkowników
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Wszystkie wysyłki
                </p>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Oczekujące
                </p>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Dzisiaj
                </p>
                <p className="text-2xl font-bold">{stats.todaySent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ten tydzień
                </p>
                <p className="text-2xl font-bold">{stats.lastWeekSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Utwórz powiadomienie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Odbiorcy</Label>
                <Select
                  value={audience}
                  onValueChange={(v) =>
                    setAudience(v as "all" | "role" | "user")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz odbiorców" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszyscy</SelectItem>
                    <SelectItem value="role">Konkretną rolę</SelectItem>
                    <SelectItem value="user">
                      Konkretnego użytkownika
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {audience === "role" && (
                <div>
                  <Label>Rola</Label>
                  <Select
                    value={role}
                    onValueChange={(v) => setRole(v as AppRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz rolę" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "user",
                        "company",
                        "user-supporter",
                        "company-supporter",
                        "early-tester",
                        "tester",
                        "moderator",
                        "administrator",
                        "super-administrator",
                      ].map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {audience === "user" && (
                <div>
                  <Label>Nazwa użytkownika</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="np. janek"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Tytuł</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div>
              <Label>Treść</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label>Link (opcjonalnie)</Label>
              <Input
                type="url"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Wyślij o (opcjonalnie)</Label>
              <Input
                type="datetime-local"
                value={sendAt}
                onChange={(e) => setSendAt(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">{dueHint}</div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Podgląd powiadomienia</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showPreview ? "Ukryj" : "Pokaż"}
                </Button>
              </div>

              {showPreview && (
                <div className="rounded-md border p-4 space-y-3 bg-muted/30">
                  <RainbowBar />
                  <div className="text-sm font-medium">
                    {title || "(Tytuł)"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {body || "(Treść powiadomienia)"}
                  </div>
                  {actionUrl && (
                    <div className="text-xs text-blue-600 underline">
                      {actionUrl}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={onSubmit}
                disabled={submitting || !title || !body}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Utwórz powiadomienie
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions & Recent */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Szybkie akcje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={dispatchDue}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Wyślij zaległe teraz
              </Button>

              <Button
                variant="secondary"
                onClick={triggerEventReminders}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Wyślij przypomnienia o wydarzeniach
              </Button>

              <Button
                variant="ghost"
                onClick={() => Promise.all([loadRecent(), loadStats()])}
                disabled={submitting}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Odśwież dane
              </Button>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Ostatnie wysyłki
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Brak wysyłek</h3>
                  <p className="text-muted-foreground">
                    Nie ma jeszcze żadnych wysłanych powiadomień.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent.map((notification) => (
                    <div
                      key={notification.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              notification.status === "dispatched"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {notification.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {notification.audience}
                            {notification.target_role
                              ? `: ${notification.target_role}`
                              : ""}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(
                            notification.created_at,
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      <h4 className="font-medium mb-1">{notification.title}</h4>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Zaplanowano:{" "}
                          {new Date(notification.send_at).toLocaleString()}
                        </div>
                        {notification.dispatched_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3" />
                            Wysłano:{" "}
                            {new Date(
                              notification.dispatched_at,
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
