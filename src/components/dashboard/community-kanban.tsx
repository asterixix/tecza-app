"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, Users } from "lucide-react"

type Column = {
  id: string
  board_id: string
  name: string
  position: number
  wip_limit: number | null
}

type Task = {
  id: string
  board_id: string
  column_id: string
  title: string
  description: string | null
  labels: string[] | null
  due_at: string | null
  created_by: string
  position: number
}

export function CommunityKanban({ communityId }: { communityId: string }) {
  const supabase = getSupabase()
  const { toast } = useToast()
  const [boardId, setBoardId] = useState<string | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingTaskFor, setCreatingTaskFor] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [canManage, setCanManage] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !communityId) return
      setLoading(true)
      try {
        const { data: meUser } = await supabase.auth.getUser()
        const uid = meUser.user?.id || null
        const { data: ensured, error: ensureErr } = await supabase.rpc(
          "ensure_default_board",
          { p_community_id: communityId, p_user_id: uid },
        )
        if (ensureErr) throw ensureErr

        const bid = (ensured as string) || null
        const targetBoard = (bid ||
          (await (async () => {
            const { data: board } = await supabase
              .from("community_boards")
              .select("id")
              .eq("community_id", communityId)
              .order("is_default", { ascending: false })
              .limit(1)
              .maybeSingle()
            return board?.id || null
          })())) as string | null
        if (!targetBoard) return

        if (!cancelled) setBoardId(targetBoard)

        const { data: cols } = await supabase
          .from("board_columns")
          .select("id,board_id,name,position,wip_limit")
          .eq("board_id", targetBoard)
          .order("position")
        if (!cancelled && cols) setColumns(cols as Column[])

        const { data: t } = await supabase
          .from("board_tasks")
          .select(
            "id,board_id,column_id,title,description,labels,due_at,created_by,position",
          )
          .eq("board_id", targetBoard)
          .order("position")
        if (!cancelled && t) setTasks(t as Task[])

        if (cols && (cols as Column[]).length) {
          const probe = (cols as Column[])[0]
          const { error: updErr } = await supabase
            .from("board_columns")
            .update({ name: probe.name })
            .eq("id", probe.id)
            .limit(1)
          setCanManage(!updErr)
        }
      } catch {
        toast({
          variant: "destructive",
          description: "Błąd wczytywania tablicy",
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [supabase, communityId, toast])

  const grouped = useMemo(() => {
    const byCol: Record<string, Task[]> = {}
    for (const c of columns) byCol[c.id] = []
    for (const t of tasks) {
      if (!byCol[t.column_id]) byCol[t.column_id] = []
      byCol[t.column_id].push(t)
    }
    Object.values(byCol).forEach((arr) =>
      arr.sort((a, b) => a.position - b.position),
    )
    return byCol
  }, [columns, tasks])

  async function addTask(columnId: string) {
    if (!supabase || !boardId) return
    const title = newTitle.trim()
    if (!title) return
    try {
      const maxPos = Math.max(
        0,
        ...tasks.filter((t) => t.column_id === columnId).map((t) => t.position),
      )
      const { data, error } = await supabase
        .from("board_tasks")
        .insert({
          board_id: boardId,
          column_id: columnId,
          title,
          description: newDesc.trim() || null,
          position: maxPos + 10,
        })
        .select("*")
        .single()
      if (error) throw error
      setTasks((prev) => [...prev, data as Task])
      setNewTitle("")
      setNewDesc("")
      setCreatingTaskFor(null)
      toast({ variant: "success", description: "Dodano zadanie" })
    } catch {
      toast({
        variant: "destructive",
        description: "Nie udało się dodać zadania",
      })
    }
  }

  async function removeTask(taskId: string) {
    if (!supabase) return
    if (!window.confirm("Usunąć zadanie?")) return
    await supabase.from("board_tasks").delete().eq("id", taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  async function renameColumn(col: Column, name: string) {
    if (!supabase) return
    const trimmed = name.trim()
    if (!trimmed || trimmed === col.name) return
    const { error } = await supabase
      .from("board_columns")
      .update({ name: trimmed })
      .eq("id", col.id)
    if (!error)
      setColumns((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, name: trimmed } : c)),
      )
  }

  if (loading) return <div>Wczytywanie…</div>

  return (
    <div className="space-y-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Zadania społeczności</h2>
        <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
          <Users className="h-4 w-4" /> Tylko członkowie widzą zadania
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <Card key={col.id} className="bg-muted/30">
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">
                <InlineEditable
                  text={col.name}
                  onSave={(v) => renameColumn(col, v)}
                  disabled={!canManage}
                />
              </CardTitle>
              <Badge variant="outline" className="ml-2">
                {(grouped[col.id] || []).length}
                {col.wip_limit ? `/${col.wip_limit}` : ""}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(grouped[col.id] || []).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-md bg-background p-3 shadow-sm border"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium leading-snug">
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-sm text-muted-foreground line-clamp-3 mt-1">
                            {t.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeTask(t.id)}
                          aria-label="Usuń"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {t.labels && t.labels.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.labels.map((l, i) => (
                          <Badge key={i} variant="secondary">
                            {l}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-2">
                  {creatingTaskFor === col.id ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Tytuł zadania"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder="Opis (opcjonalnie)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        rows={3}
                      />
                      <div className="flex items-center gap-2">
                        <Button onClick={() => addTask(col.id)}>Dodaj</Button>
                        <Button
                          variant="outline"
                          onClick={() => setCreatingTaskFor(null)}
                        >
                          Anuluj
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreatingTaskFor(col.id)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Nowe zadanie
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function InlineEditable({
  text,
  onSave,
  disabled,
}: {
  text: string
  onSave: (value: string) => void
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(text)

  useEffect(() => {
    setValue(text)
  }, [text])

  if (!editing) {
    return (
      <div className="inline-flex items-center gap-2">
        <span>{text}</span>
        {!disabled && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(true)}
            aria-label="Edytuj"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8"
      />
      <Button
        size="sm"
        onClick={() => {
          onSave(value)
          setEditing(false)
        }}
      >
        Zapisz
      </Button>
    </div>
  )
}
