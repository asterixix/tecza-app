"use client"
import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Toaster, toast } from "sonner"
import Link from "next/link"

const schema = z.object({
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Hasła muszą być identyczne",
  path: ["confirm"],
})

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
    mode: "onTouched",
  })

  useEffect(() => {
    // Supabase sends a "type=recovery" link that sets a session via hash fragment.
    // We just need to render a form for a new password.
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    if (hash.includes("type=recovery")) {
      setReady(true)
    } else {
      setReady(true) // still allow form; supabase-js will error if session missing
    }
  }, [])

  async function onSubmit(values: z.infer<typeof schema>) {
    const supabase = getSupabase()
    if (!supabase) return toast.error("Brak konfiguracji Supabase")
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({ password: values.password })
      if (error) throw error
      toast.success("Hasło zostało zaktualizowane. Możesz się zalogować.")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Nie udało się zaktualizować hasła"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100svh-6rem)] flex items-center justify-center p-4">
      <Toaster richColors position="top-center" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ustaw nowe hasło</CardTitle>
          <CardDescription>Wpisz nowe hasło dla swojego konta.</CardDescription>
        </CardHeader>
        <CardContent>
          {ready ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label="Formularz zmiany hasła">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nowe hasło</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Powtórz hasło</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between gap-2">
                  <Link className="text-sm underline underline-offset-4" href="/login">Wróć do logowania</Link>
                  <Button type="submit" disabled={loading} aria-busy={loading}>
                    {loading ? "Zapisywanie…" : "Zapisz nowe hasło"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <p>Ładowanie…</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
