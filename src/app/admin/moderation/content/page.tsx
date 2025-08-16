"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Textarea from "@/components/ui/textarea"

type Report = {
  id: string
  reporter_id: string
  target_type: "user" | "post" | "comment" | "message" | "event" | "community" | "profile_media"
  target_id: string | null
  reason: "hate_speech" | "harassment" | "spam" | "inappropriate_content" | "other"
  description: string | null
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  created_at: string
  updated_at: string
  target_meta?: Record<string, unknown>
}

export default function ContentModeration() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [statusFilter, setStatusFilter] = useState<Report["status"] | "all">("pending")
  const [typeFilter, setTypeFilter] = useState<Report["target_type"] | "all">("all")
  const [actionNotes, setActionNotes] = useState("")

  useEffect(() => {
    ;(async () => {
      if (!supabase) {
        setAllowed(false)
        return
      }
      const u = (await supabase.auth.getUser()).data.user
      if (!u) {
        setAllowed(false)
        return
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", u.id)
        .maybeSingle()
      const roles = (prof?.roles as string[] | undefined) || []
      const ok = roles.some((r) =>
        ["moderator", "administrator", "super-administrator"].includes(r)
      )
      setAllowed(ok)
      if (!ok) {
        window.location.href = "/d"
        return
      }
      await loadReports()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  async function loadReports() {
    if (!supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("moderation_reports")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) return
      setReports((data as Report[]) || [])
    } finally {
      setLoading(false)
    }
  }

  // Helpers to build typed args for admin RPCs (avoid `any`)
  type HideRpc = "admin_hide_comment" | "admin_hide_event" | "admin_hide_community"
  type RestoreRpc = "admin_restore_comment" | "admin_restore_event" | "admin_restore_community"
  type HideArgs =
    | { p_comment_id: string; p_reason: string }
    | { p_event_id: string; p_reason: string }
    | { p_community_id: string; p_reason: string }
  type RestoreArgs = { p_comment_id: string } | { p_event_id: string } | { p_community_id: string }

  function buildHideArgs(fn: HideRpc, id: string, reason: string): HideArgs {
    switch (fn) {
      case "admin_hide_comment":
        return { p_comment_id: id, p_reason: reason }
      case "admin_hide_event":
        return { p_event_id: id, p_reason: reason }
      case "admin_hide_community":
        return { p_community_id: id, p_reason: reason }
    }
  }

  function buildRestoreArgs(fn: RestoreRpc, id: string): RestoreArgs {
    switch (fn) {
      case "admin_restore_comment":
        return { p_comment_id: id }
      case "admin_restore_event":
        return { p_event_id: id }
      case "admin_restore_community":
        return { p_community_id: id }
    }
  }

  const filtered = useMemo(() => {
    return reports.filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (typeFilter === "all" || r.target_type === typeFilter)
    )
  }, [reports, statusFilter, typeFilter])

  async function updateStatus(report: Report, status: Report["status"]) {
    if (!supabase) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from("moderation_reports")
      .update({ status })
      .eq("id", report.id)
    if (!error) {
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, status } : r)))
      // log action
      await supabase.from("moderation_actions").insert({
        actor_id: user.id,
        action: status === "dismissed" ? "note" : status === "resolved" ? "restore" : "note",
        target_type: report.target_type,
        target_id: report.target_id,
        notes: actionNotes || null,
      })
      setActionNotes("")
    }
  }

  async function hidePost(report: Report) {
    if (!supabase || report.target_type !== "post" || !report.target_id) return
    const reason = actionNotes || report.reason
    const { error } = await supabase.rpc("admin_hide_post", {
      p_post_id: report.target_id,
      p_reason: reason,
    })
    if (!error) {
      await supabase.from("moderation_actions").insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: "hide",
        target_type: report.target_type,
        target_id: report.target_id,
        notes: reason,
      })
      setActionNotes("")
      await updateStatus(report, "reviewed")
    }
  }

  async function restorePost(report: Report) {
    if (!supabase || report.target_type !== "post" || !report.target_id) return
    const { error } = await supabase.rpc("admin_restore_post", {
      p_post_id: report.target_id,
    })
    if (!error) {
      await supabase.from("moderation_actions").insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: "restore",
        target_type: report.target_type,
        target_id: report.target_id,
        notes: actionNotes || null,
      })
      setActionNotes("")
      await updateStatus(report, "resolved")
    }
  }

  async function hideOther(report: Report) {
    if (!supabase || !report.target_id) return
    const reason = actionNotes || report.reason
    const map: Record<Report["target_type"], { fn: HideRpc } | undefined> = {
      user: undefined,
      message: undefined,
      post: undefined,
      comment: { fn: "admin_hide_comment" },
      event: { fn: "admin_hide_event" },
      community: { fn: "admin_hide_community" },
      profile_media: undefined,
    }
    const ent = map[report.target_type]
    if (!ent) return
    const args = buildHideArgs(ent.fn, report.target_id, reason)
    const { error } = await supabase.rpc(ent.fn, args)
    if (!error) {
      await supabase.from("moderation_actions").insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: "hide",
        target_type: report.target_type,
        target_id: report.target_id,
        notes: reason,
      })
      setActionNotes("")
      await updateStatus(report, "reviewed")
    }
  }

  async function restoreOther(report: Report) {
    if (!supabase || !report.target_id) return
    const map: Record<Report["target_type"], { fn: RestoreRpc } | undefined> = {
      user: undefined,
      message: undefined,
      post: undefined,
      comment: { fn: "admin_restore_comment" },
      event: { fn: "admin_restore_event" },
      community: { fn: "admin_restore_community" },
      profile_media: undefined,
    }
    const ent = map[report.target_type]
    if (!ent) return
    const args = buildRestoreArgs(ent.fn, report.target_id)
    const { error } = await supabase.rpc(ent.fn, args)
    if (!error) {
      await supabase.from("moderation_actions").insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: "restore",
        target_type: report.target_type,
        target_id: report.target_id,
        notes: actionNotes || null,
      })
      setActionNotes("")
      await updateStatus(report, "resolved")
    }
  }

  if (allowed === null || !allowed) return null

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Moderacja treści</h1>

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="pending">Oczekujące</SelectItem>
            <SelectItem value="reviewed">Sprawdzone</SelectItem>
            <SelectItem value="resolved">Rozwiązane</SelectItem>
            <SelectItem value="dismissed">Odrzucone</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie typy</SelectItem>
            <SelectItem value="post">Posty</SelectItem>
            <SelectItem value="comment">Komentarze</SelectItem>
            <SelectItem value="message">Wiadomości</SelectItem>
            <SelectItem value="user">Użytkownicy</SelectItem>
            <SelectItem value="event">Wydarzenia</SelectItem>
            <SelectItem value="community">Społeczności</SelectItem>
            <SelectItem value="profile_media">Media profilu</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadReports}>
          Odśwież
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Ładowanie…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak zgłoszeń do wyświetlenia.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="font-medium">{r.target_type}</span>
                  <Badge variant="outline">{r.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="text-muted-foreground">
                  Powód: <span className="text-foreground font-medium">{r.reason}</span>
                </div>
                {r.description && <div>Opis: {r.description}</div>}
                {r.target_id && <div className="text-xs">ID: {r.target_id}</div>}
                <div className="grid gap-2 md:grid-cols-2 md:items-end">
                  <div>
                    <label className="text-xs font-medium">
                      Notatka (opcjonalna, do dziennika działań)
                    </label>
                    <Textarea
                      rows={2}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Dodaj krótką notatkę do akcji"
                    />
                  </div>
                  <div className="flex gap-2 md:justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus(r, "reviewed")}
                    >
                      Oznacz jako sprawdzone
                    </Button>
                    <Button size="sm" onClick={() => updateStatus(r, "resolved")}>
                      Rozwiązane
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus(r, "dismissed")}
                    >
                      Odrzuć
                    </Button>
                    {r.target_id && (
                      <>
                        {r.target_type === "post" ? (
                          <>
                            <Button size="sm" variant="destructive" onClick={() => hidePost(r)}>
                              Ukryj post
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => restorePost(r)}>
                              Przywróć post
                            </Button>
                          </>
                        ) : ["comment", "event", "community"].includes(r.target_type) ? (
                          <>
                            <Button size="sm" variant="destructive" onClick={() => hideOther(r)}>
                              Ukryj
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => restoreOther(r)}>
                              Przywróć
                            </Button>
                          </>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
