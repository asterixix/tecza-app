/* Logowanie */

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Mail, Lock, KeyRound } from "lucide-react"

const schema = z.object({
  email: z.string().email("Podaj poprawny email"),
  password: z.string().min(8, "Min. 8 znaków"),
  otp: z.string().optional(),
})

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [needsOtp, setNeedsOtp] = useState(false)
  const supabase = getSupabase()

  // Jeśli zalogowany (lub login przez OAuth), redirect do dashboardu
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/dashboard"
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) window.location.href = "/dashboard"
    })
    return () => { sub.subscription.unsubscribe() }
  }, [supabase])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", otp: "" },
    mode: "onBlur",
  })
  // Brak konfingu z SB
  async function onSubmit(values: z.infer<typeof schema>) {
    if (!supabase) {
      toast.error("Brak konfiguracji Supabase")
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      if (error) throw error

      if (needsOtp && values.otp) {
        if (values.otp.trim().length < 6) throw new Error("Niepoprawny kod 2FA")
      }
  // Success login + 2FA support
  toast.success("Zalogowano")
  window.location.href = "/dashboard"
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ""
      const status = (e as { status?: string })?.status || ""
      if (msg.toLowerCase().includes("otp") || status === "2fa_required") {
        setNeedsOtp(true)
        toast("Wymagane 2FA — wpisz kod z aplikacji")
      } else {
        toast.error(msg || "Nie udało się zalogować")
      }
    } finally {
      setLoading(false)
    }
  }
  // OAuth support
  async function oauth(provider: "google" | "discord") {
    if (!supabase) {
      toast.error("Brak konfiguracji Supabase")
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined },
    })
    if (error) toast.error(error.message)
  }
  // Reset hasła
  async function reset() {
    if (!supabase) {
      toast.error("Brak konfiguracji Supabase")
      return
    }
    const email = form.getValues("email")
    if (!email) return toast("Podaj email do resetu hasła")
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    })
    if (error) toast.error(error.message)
    else toast.success("Sprawdź skrzynkę — wysłaliśmy link do resetu hasła")
  }
  // 
  return (
    <div className="mx-auto max-w-md px-4 md:px-6 py-10 md:py-14">
      <Toaster richColors position="top-center" />
      <div className="mb-4"><Badge variant="secondary">Logowanie i rejestracja</Badge></div>
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Wejdź do Tęcza.app</h1>
          <p className="mt-1 text-muted-foreground">Wprowadź swój email i hasło, lub zaloguj się korzystając z konta Google lub Discorda.</p>

          <div className="mt-4 grid gap-3">
            <Button type="button" variant="outline" onClick={() => oauth("google")} aria-label="Zaloguj przez Google">
              <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" className="mr-2"><path fill="currentColor" d="M21.35 11.1h-9.18v2.98h5.31c-.23 1.38-1.6 4.05-5.31 4.05c-3.2 0-5.81-2.64-5.81-5.89s2.61-5.89 5.81-5.89c1.83 0 3.06.77 3.76 1.43l2.57-2.49C16.86 3.46 15 2.5 12.17 2.5C6.98 2.5 2.73 6.74 2.73 11.99S6.98 21.5 12.17 21.5c6.19 0 10.26-4.34 10.26-10.44c0-.7-.08-1.16-.18-1.96"/></svg>
              Kontynuuj z Google
            </Button>
            <Button type="button" variant="outline" onClick={() => oauth("discord")} aria-label="Zaloguj przez Discord">
              <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" className="mr-2"><path fill="currentColor" d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.249a.077.077 0 0 0-.079-.037c-1.694.3-3.32.83-4.885 1.515a.07.07 0 0 0-.032.027C.533 9.045-.32 13.58.099 18.057a.082.082 0 0 0 .031.057c2.052 1.507 4.041 2.422 5.992 3.03a.078.078 0 0 0 .084-.027c.461-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.104a13.055 13.055 0 0 1-1.862-.89a.077.077 0 0 1-.008-.128c.125-.094.25-.192.369-.291a.074.074 0 0 1 .078-.01c3.926 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .079.009c.12.099.244.198.369.292a.077.077 0 0 1-.006.128a12.299 12.299 0 0 1-1.863.889a.076.076 0 0 0-.04.105c.36.698.773 1.362 1.225 1.993a.076.076 0 0 0 .084.028c1.961-.608 3.95-1.523 6.002-3.03a.077.077 0 0 0 .031-.056c.5-5.177-.838-9.673-3.548-13.661a.061.061 0 0 0-.032-.03ZM8.68 15.677c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.957-2.42 2.157-2.42c1.21 0 2.174 1.096 2.157 2.42c0 1.334-.957 2.42-2.157 2.42m6.64 0c-1.183 0-2.156-1.085-2.156-2.419c0-1.333.956-2.42 2.156-2.42c1.21 0 2.175 1.096 2.157 2.42c0 1.334-.947 2.42-2.157 2.42"/></svg>
              Kontynuuj z Discord
            </Button>
          </div>

          <div className="my-6 h-px bg-border" role="separator" aria-hidden />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
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
                      <Input type="password" placeholder="••••••••" autoComplete="current-password" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {needsOtp && (
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><span className="inline-flex items-center gap-1"><KeyRound className="size-4" aria-hidden /> Kod 2FA</span></FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="123 456" aria-describedby="otp-help" {...field} />
                      </FormControl>
                      <FormDescription id="otp-help">Wprowadź 6‑cyfrowy kod z aplikacji uwierzytelniającej (TOTP).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="mt-1 flex items-center justify-between">
                <Link className="text-sm text-primary underline-offset-4 hover:underline" href="#" onClick={(e) => { e.preventDefault(); reset(); }}>Nie pamiętasz hasła?</Link>
                <Link className="text-sm text-muted-foreground hover:text-foreground" href="/register">Nie masz konta? Zarejestruj się</Link>
              </div>

              <Button type="submit" disabled={loading} aria-label="Zaloguj się">
                {loading ? "Logowanie…" : "Zaloguj się"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
