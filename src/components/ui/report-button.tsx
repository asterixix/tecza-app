"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Textarea from "@/components/ui/textarea"
import { getSupabase } from "@/lib/supabase-browser"

type Reason =
  | "hate_speech"
  | "harassment"
  | "spam"
  | "inappropriate_content"
  | "other"

export function ReportButton({
  targetType,
  targetId,
  meta,
  label = "Zgłoś",
}: {
  targetType:
    | "user"
    | "post"
    | "comment"
    | "message"
    | "event"
    | "community"
    | "profile_media"
  targetId?: string
  meta?: Record<string, unknown>
  label?: string
}) {
  const supabase = getSupabase()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<Reason>("inappropriate_content")
  const [desc, setDesc] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!supabase) return
    try {
      setBusy(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from("moderation_reports").insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId || null,
        reason,
        description: desc || null,
        target_meta: meta || null,
      })
      setOpen(false)
      setDesc("")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Zgłoszenie</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <label className="text-sm font-medium">Powód</label>
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value as Reason)}
            >
              <option value="inappropriate_content">
                Nieodpowiednia treść
              </option>
              <option value="hate_speech">Mowa nienawiści</option>
              <option value="harassment">Nękanie</option>
              <option value="spam">Spam</option>
              <option value="other">Inne</option>
            </select>
            <label className="text-sm font-medium">Opis (opcjonalnie)</label>
            <Textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Dodaj szczegóły dla moderatora"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={submit} disabled={busy}>
                {busy ? "Wysyłanie…" : "Wyślij zgłoszenie"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ReportButton
