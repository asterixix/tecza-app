"use client"

import Link from "next/link"
import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Mail, Lock } from "lucide-react"
import AlphaWarningDialog from "@/components/site/alpha-warning-dialog"

const schema = z.object({
  email: z.string().email("Podaj poprawny email"),
  password: z.string().min(8, "Min. 8 znaków"),
  display_name: z
    .string()
    .min(1, "Podaj widoczne imię/nazwę")
    .max(50, "Max 50 znaków"),
  username: z
    .string()
    .min(3, "Min. 3 znaki")
    .max(30, "Max 30 znaków")
    .regex(/^[a-z0-9_]+$/i, "Tylko litery, cyfry i _"),
})
type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [alphaOpen, setAlphaOpen] = useState(false)
  const [pending, setPending] = useState<FormValues | null>(null)
  const supabase = getSupabase()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", display_name: "", username: "" },
    mode: "onBlur",
  })

  async function doSignUp(values: FormValues) {
    if (!supabase) {
      toast.error("Brak konfiguracji Supabase")
      return
    }
    setLoading(true)
    try {
      const uname = values.username.trim().toLowerCase()
      // Check username availability (client-side guard)
      const { data: taken, error: checkErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", uname)
        .limit(1)
      if (!checkErr && taken && taken.length > 0) {
        throw new Error("Nazwa użytkownika jest już zajęta")
      }

      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined,
          data: { username: uname, display_name: values.display_name.trim() },
        },
      })
      if (error) throw error
      toast.success("Sprawdź email i potwierdź rejestrację")
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Nie udało się zarejestrować"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values: FormValues) {
    // Show Alpha dialog once per device/session unless acknowledged
    try {
      const ack =
        typeof window !== "undefined"
          ? localStorage.getItem("alpha_ack")
          : "true"
      if (!ack) {
        setPending(values)
        setAlphaOpen(true)
        return
      }
    } catch {
      // if localStorage not accessible, still require confirmation
      setPending(values)
      setAlphaOpen(true)
      return
    }
    await doSignUp(values)
  }

  return (
    <div className="mx-auto max-w-md px-4 md:px-6 py-10 md:py-14">
      <Toaster richColors position="top-center" />
      <div className="mb-4">
        <Badge variant="secondary">Rejestracja</Badge>
      </div>
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Załóż konto</h1>
          <p className="mt-1 text-muted-foreground">
            Po rejestracji przejdziesz przez konfigurator ustawień i profilu.
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-4 grid gap-3"
            >
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Widoczna nazwa</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Twoje imię/pseudonim"
                        autoComplete="name"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa użytkownika</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="nazwa_uzytkownika"
                        autoComplete="username"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-4" aria-hidden /> Email
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="twoj@adres.pl"
                        autoComplete="email"
                        inputMode="email"
                        required
                        {...field}
                      />
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
                    <FormLabel>
                      <span className="inline-flex items-center gap-1">
                        <Lock className="size-4" aria-hidden />
                        Hasło min. 8 znaków
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={loading}
                aria-label="Zarejestruj się"
              >
                {loading ? "Rejestracja…" : "Zarejestruj się"}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-sm text-muted-foreground">
            Masz już konto?{" "}
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href="/l"
            >
              Zaloguj się
            </Link>
          </p>
        </CardContent>
      </Card>
      <AlphaWarningDialog
        open={alphaOpen}
        onOpenChange={setAlphaOpen}
        onAccept={() => {
          if (pending) {
            void doSignUp(pending)
            setPending(null)
          }
        }}
      />
    </div>
  )
}
