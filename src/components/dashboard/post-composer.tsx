"use client"
import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

const schema = z.object({
  content: z.string().min(1, "Wpis nie może być pusty").max(5000),
  visibility: z.enum(["public","friends","private","unlisted"]),
})

export function PostComposer({ onPosted }: { onPosted?: () => void }) {
  const [loading, setLoading] = useState(false)
  const supabase = getSupabase()
  type FormValues = z.infer<typeof schema>
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: "", visibility: "public" },
  })

  async function onSubmit(values: FormValues) {
    if (!supabase) return toast.error("Brak konfiguracji Supabase")
    try {
      setLoading(true)
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error("Brak zalogowanego użytkownika")
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: values.content,
        type: "text",
        visibility: values.visibility,
      })
      if (error) throw error
      toast.success("Opublikowano post")
      form.reset({ content: "", visibility: values.visibility })
      onPosted?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się dodać posta"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Treść</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Podziel się czymś... (Markdown wspierany)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 justify-between">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem className="w-40">
                    <FormLabel className="sr-only">Widoczność</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="Widoczność posta">
                        <SelectValue placeholder="Publiczny" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Publiczny</SelectItem>
                        <SelectItem value="friends">Tylko znajomi</SelectItem>
                        <SelectItem value="unlisted">Nielistowany (z linkiem)</SelectItem>
                        <SelectItem value="private">Prywatny</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading}>{loading ? "Publikuję…" : "Opublikuj"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
