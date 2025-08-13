"use client"

import Link from "next/link"
import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { UserPlus, Mail, Lock } from "lucide-react"

const schema = z.object({
  email: z.string().email("Podaj poprawny email"),
  password: z.string().min(8, "Min. 8 znaków"),
})

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const supabase = getSupabase()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!supabase) {
      toast.error("Brak konfiguracji Supabase")
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
        },
      })
      if (error) throw error
      toast.success("Sprawdź email i potwierdź rejestrację")
    } catch (e) {
      const message = e instanceof Error ? e.message : "Nie udało się zarejestrować"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 md:px-6 py-10 md:py-14">
      <Toaster richColors position="top-center" />
      <div className="mb-4"><Badge variant="secondary">Rejestracja</Badge></div>
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Załóż konto</h1>
          <p className="mt-1 text-muted-foreground">Po rejestracji włączysz 2FA w ustawieniach zabezpieczeń.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 grid gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><span className="inline-flex items-center gap-1"><Mail className="size-4" aria-hidden /> Email</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" autoComplete="email" inputMode="email" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><span className="inline-flex items-center gap-1"><Lock className="size-4" aria-hidden /> Hasło</span></FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" autoComplete="new-password" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} aria-label="Zarejestruj się">
                <UserPlus className="size-4" aria-hidden /> {loading ? "Rejestracja…" : "Zarejestruj"}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-sm text-muted-foreground">Masz już konto? <Link className="text-primary underline-offset-4 hover:underline" href="/login">Zaloguj się</Link></p>
        </CardContent>
      </Card>
    </div>
  )
}
