"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import Link from "next/link"

const schema = z.object({
  display_name: z.string().min(1, "Podaj nazwę widoczną").max(50),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/i, "Tylko litery, cyfry i _"),
  password: z.string().min(8, "Min. 8 znaków").optional().or(z.literal("")),
})
type FormValues = z.infer<typeof schema>

export default function AccountOnboardingPage() {
  const supabase = getSupabase()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  // Prefill isn't needed beyond reset; avoid unused state

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: useMemo(() => ({ display_name: "", username: "", password: "" }), []),
    mode: "onBlur",
  })

  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) {
        window.location.href = "/l"
        return
      }
      // Check profile state
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, display_name, onboarded_at")
        .eq("id", u.user.id)
        .single()
      if (profile?.onboarded_at) {
        window.location.href = "/d"
        return
      }
      form.reset({
        display_name: profile?.display_name ?? u.user.user_metadata?.full_name ?? "",
        username: profile?.username ?? "",
        password: "",
      })
      setLoading(false)
    })()
  }, [supabase, form])

  async function onSubmit(values: FormValues) {
    if (!supabase) return
    setSubmitting(true)
    try {
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) throw new Error("Brak sesji")
      const uname = values.username.trim().toLowerCase()
      // Check username uniqueness
      const { data: exists } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", uname)
        .neq("id", u.user.id)
        .limit(1)
      if (exists && exists.length > 0) throw new Error("Nazwa użytkownika zajęta")

      // Optionally set password for OAuth users
      if (values.password && values.password.length >= 8) {
        const { error: updErr } = await supabase.auth.updateUser({ password: values.password })
        if (updErr) throw updErr
      }

      const { error: upErr } = await supabase
        .from("profiles")
        .update({ username: uname, display_name: values.display_name, onboarded_at: null })
        .eq("id", u.user.id)
      if (upErr) throw upErr

      window.location.href = "/onboarding/profile"
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zapisać")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="mx-auto max-w-md px-4 md:px-6 py-10 md:py-14">
      <Toaster richColors position="top-center" />
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">Ustaw konto</h1>
          <p className="mt-1 text-muted-foreground">
            Wybierz nazwę użytkownika i nazwę widoczną. Opcjonalnie ustaw hasło.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 grid gap-3">
              <FormField
                name="display_name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Widoczna nazwa</FormLabel>
                    <FormControl>
                      <Input required placeholder="Twoje imię/pseudonim" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="username"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa użytkownika</FormLabel>
                    <FormControl>
                      <Input required placeholder="nazwa_uzytkownika" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasło (opcjonalne)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  Dalej
                </Button>
                <Link
                  className="ml-auto text-sm text-muted-foreground hover:text-foreground"
                  href="/l"
                >
                  Anuluj
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
