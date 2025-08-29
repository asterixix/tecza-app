"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AlphaWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept: () => void
}

/**
 * AlphaWarningDialog
 * Simple confirmation dialog informing about Alpha state of the app.
 * Requires explicit acknowledgement before continuing.
 */
export function AlphaWarningDialog({
  open,
  onOpenChange,
  onAccept,
}: AlphaWarningDialogProps) {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (open) setChecked(false)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="alpha-desc" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Uwaga: wersja Alpha</DialogTitle>
          <DialogDescription id="alpha-desc">
            Aplikacja Tęcza.app jest w wersji Alpha. Oznacza to, że część
            funkcji może nie działać poprawnie, zmieniać się w sposób znaczący
            lub być chwilowo niedostępna. Możliwe są również błędy i
            reorganizacja interfejsu.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              aria-label="Potwierdzam zrozumienie ograniczeń wersji Alfa"
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              Potwierdzam, że rozumiem ograniczenia wersji Alpha i chcę
              kontynuować.
            </span>
          </label>
          <p className="text-xs text-muted-foreground">
            Kontynuując, akceptujesz ryzyko błędów i zmian oraz nasz Regulamin i
            Politykę Prywatności.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button
            onClick={() => {
              if (!checked) return
              try {
                if (typeof window !== "undefined") {
                  localStorage.setItem("alpha_ack", "true")
                }
              } catch {}
              onAccept()
              onOpenChange(false)
            }}
            disabled={!checked}
          >
            Akceptuję i kontynuuję
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AlphaWarningDialog
