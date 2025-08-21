"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
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
import { useToast } from "@/hooks/use-toast"

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

export default function AdminNotificationsPage() {
  const supabase = getSupabase()
  const { toast } = useToast()

  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [audience, setAudience] = useState<"all" | "role" | "user">("all")
  const [role, setRole] = useState<AppRole | "">("")
  const [username, setUsername] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [actionUrl, setActionUrl] = useState("")
  const [sendAt, setSendAt] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [recent, setRecent] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      if (!supabase) return setAllowed(false)
      const { data } = await supabase.auth.getUser()
      const u = data.user
      if (!u) return setAllowed(false)
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
      if (!ok) window.location.href = "/d"
    })()
  }, [supabase])

  async function loadRecent() {
    if (!supabase) return
    const { data } = await supabase
      .from("notification_broadcasts")
      .select(
        "id,audience,target_role,title,send_at,status,dispatched_at,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(10)
    setRecent(data || [])
  }

  useEffect(() => {
    loadRecent()
  }, [])

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
        target_user_id = (u as any).id
      }

      const { data: created, error } = await supabase.rpc(
        "admin_create_broadcast",
        {
          p_audience: audience,
          p_target_role: audience === "role" ? (role as string) : null,
          p_target_user_id: target_user_id,
          p_title: title,
          p_body: body,
          p_action_url: actionUrl || null,
          p_send_at: sendAt
            ? new Date(sendAt).toISOString()
            : new Date().toISOString(),
        },
      )
      if (error) throw error

      toast({ title: "Zapisano", description: "Wiadomość została utworzona" })
      setTitle("")
      setBody("")
      setActionUrl("")
      setUsername("")
      setRole("")
      setSendAt("")
      await loadRecent()
    } catch (e: any) {
      toast({
        title: "Błąd",
        description: e.message || "Nie udało się zapisać",
        variant: "destructive",
      })
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
      toast({
        title: "Wysłano",
        description: `Wysłano do ${data as number} odbiorców`,
      })
      await loadRecent()
    } catch (e: any) {
      toast({
        title: "Błąd",
        description: e.message || "Nie udało się wysłać",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (allowed === null) return null
  if (!allowed) return null

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
      <h1 className="text-xl font-semibold mb-4">Powiadomienia globalne</h1>

      <div className="rounded-lg border p-4 space-y-4 bg-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Odbiorcy</Label>
            <Select
              value={audience}
              onValueChange={(v) => setAudience(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz odbiorców" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy</SelectItem>
                <SelectItem value="role">Konkretną rolę</SelectItem>
                <SelectItem value="user">Konkretnego użytkownika</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {audience === "role" && (
            <div>
              <Label>Rola</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
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

        <div className="rounded-md border p-3 space-y-2">
          <div className="text-sm font-medium">Podgląd</div>
          <RainbowBar />
          <div className="text-sm font-medium">{title || "(Tytuł)"}</div>
          <div className="text-sm text-muted-foreground">
            {body || "(Treść powiadomienia)"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onSubmit} disabled={submitting || !title || !body}>
            Zapisz
          </Button>
          <Button variant="outline" onClick={dispatchDue} disabled={submitting}>
            Wyślij zaległe teraz
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium mb-2">Ostatnie wysyłki</h2>
        <div className="rounded-lg border">
          <div className="grid grid-cols-6 gap-2 p-2 text-xs text-muted-foreground border-b">
            <div>ID</div>
            <div>Odbiorcy</div>
            <div>Tytuł</div>
            <div>Data wysyłki</div>
            <div>Status</div>
            <div>Wysłano</div>
          </div>
          {recent.map((r) => (
            <div key={r.id} className="grid grid-cols-6 gap-2 p-2 text-xs">
              <div className="truncate" title={r.id}>
                {r.id}
              </div>
              <div>
                {r.audience}
                {r.target_role ? `:${r.target_role}` : ""}
              </div>
              <div className="truncate" title={r.title}>
                {r.title}
              </div>
              <div>{new Date(r.send_at).toLocaleString()}</div>
              <div>{r.status}</div>
              <div>
                {r.dispatched_at
                  ? new Date(r.dispatched_at).toLocaleString()
                  : "-"}
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">Brak danych</div>
          )}
        </div>
      </div>
    </div>
  )
}
