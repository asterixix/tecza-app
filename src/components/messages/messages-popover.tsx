"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, MessageSquare } from "lucide-react"

type ConversationItem = {
  id: string
  last_message_at: string
}

export function MessagesPopover() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ConversationItem[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // TODO: wire to Supabase once client helper exists
        // Placeholder empty list
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <Popover>
      <PopoverTrigger asChild suppressHydrationWarning>
        <Button variant="ghost" size="icon" aria-label="Wiadomości">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" aria-label="Ostatnie rozmowy">
        <div className="p-3 font-medium">Ostatnie rozmowy</div>
        <ScrollArea className="max-h-80">
          <ul className="divide-y">
            {items.length === 0 && (
              <li className="p-3 text-sm text-muted-foreground">Brak rozmów</li>
            )}
            {items.slice(0, 5).map((c) => (
      <li key={c.id} className="p-3 hover:bg-accent/40">
    <Link href={`/m/${c.id}`} className="block">
                  <div className="text-sm font-medium">Rozmowa</div>
                  <div className="text-xs text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</div>
        </Link>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="p-2 border-t text-right">
      <Link className="text-sm underline" href="/m">Przejdź do wiadomości</Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
