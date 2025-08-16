"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeyManager } from "@/lib/crypto/key-manager"
import { encryptPrivateKeyPkcs8B64, decryptPrivateKeyPkcs8B64, VaultBlob } from "@/lib/crypto/vault"

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/i, "Tylko litery, cyfry i _"),
  display_name: z.string().min(1).max(60),
  bio: z.string().max(500).optional().nullable(),
  pronouns: z.string().max(32).optional().nullable(),
  sexual_orientation: z.array(z.string()).optional().nullable(),
  gender_identity: z.array(z.string()).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  twitter: z.string().url().optional().nullable(),
  tiktok: z.string().url().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  profile_visibility: z.enum(["public", "friends", "private"]),
  show_location: z.boolean(),
  show_orientation: z.boolean(),
  show_friends: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export default function SettingsPage() {
  const supabase = getSupabase()
  const [loading, setLoading] = useState(false)
  // Security state
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [mfaSupported, setMfaSupported] = useState(false)
  const [mfaEnrolled, setMfaEnrolled] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaQR, setMfaQR] = useState<string>("")
  const [mfaSecret, setMfaSecret] = useState<string>("")
  const [otpCode, setOtpCode] = useState("")
  // OAuth state
  const [identities, setIdentities] = useState<Array<{ id?: string; provider?: string }>>([])
  // Accessibility
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("pref-reduce-motion") === "1"
  })
  const [fontScale, setFontScale] = useState<string>(() => {
    if (typeof window === "undefined") return "100"
    return localStorage.getItem("pref-font-scale") || "100"
  })
  // Private account email
  const [accountEmail, setAccountEmail] = useState<string>("")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      display_name: "",
      bio: "",
      pronouns: "",
      sexual_orientation: [],
      gender_identity: [],
      email: "",
      website: "",
      instagram: "",
      twitter: "",
      tiktok: "",
      city: "",
      country: "Poland",
      profile_visibility: "public",
      show_location: false,
      show_orientation: true,
      show_friends: true,
    },
  })

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) return
      setAccountEmail(user.email || "")
      // identities (OAuth links)
      try {
        const ids = (user.identities as Array<{ id?: string; provider?: string }>) || []
        setIdentities(ids)
      } catch {}
      const { data } = await supabase
        .from("profiles")
        .select(
          "username,display_name,bio,pronouns,sexual_orientation,gender_identity,email,website,social_links,city,country,profile_visibility,show_location,show_orientation,avatar_url,cover_image_url,show_friends"
        )
        .eq("id", user.id)
        .maybeSingle()
      if (data) {
        const socials = (data.social_links || {}) as Record<string, string>
        form.reset({
          username: data.username || "",
          display_name: data.display_name || "",
          bio: data.bio || "",
          pronouns: data.pronouns || "",
          sexual_orientation: (data.sexual_orientation as string[] | null) || [],
          gender_identity: (data.gender_identity as string[] | null) || [],
          email: data.email || "",
          website: data.website || "",
          instagram: socials.instagram || "",
          twitter: socials.twitter || "",
          tiktok: socials.tiktok || "",
          city: data.city || "",
          country: data.country || "Poland",
          profile_visibility:
            (data.profile_visibility as "public" | "friends" | "private") || "public",
          show_location: !!data.show_location,
          show_orientation: !!data.show_orientation,
          show_friends: (data as { show_friends?: boolean }).show_friends ?? true,
        })
      }
      // MFA capability and status
      try {
        if (supabase.auth.mfa) {
          setMfaSupported(true)
          const res = await supabase.auth.mfa.listFactors?.()
          const enrolled: Array<{ id: string; factor_type?: string }> =
            (res?.data?.all as Array<{ id: string; factor_type?: string }>) ?? []
          const totp = enrolled.find((f) => f.factor_type === "totp")
          setMfaEnrolled(!!totp)
          if (totp) setMfaFactorId(totp.id)
        }
      } catch {
        setMfaSupported(false)
      }
    }
    load()
  }, [supabase, form])

  async function onSubmit(values: FormValues) {
    if (!supabase) return toast.error("Brak konfiguracji Supabase")
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) throw new Error("Brak zalogowanego użytkownika")

      const { error } = await supabase
        .from("profiles")
        .update({
          profile_visibility: values.profile_visibility,
          show_location: values.show_location,
          show_orientation: values.show_orientation,
          show_friends: values.show_friends ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
      if (error) throw error
      toast.success("Zapisano profil")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zapisać"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Ustawienia</h1>
      <Tabs defaultValue="privacy">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          <TabsTrigger value="privacy">Prywatność</TabsTrigger>
          <TabsTrigger value="security">Bezpieczeństwo</TabsTrigger>
          <TabsTrigger value="accessibility">Dostępność</TabsTrigger>
          <TabsTrigger value="danger">Strefa ryzyka</TabsTrigger>
        </TabsList>

        <TabsContent value="privacy">
          <Card>
            <CardContent className="p-4 grid gap-4">
              <Form {...form}>
                <p className="text-sm text-muted-foreground">
                  Ustaw widoczność profilu i elementów widocznych publicznie.
                </p>
                {/* Reuse existing privacy toggles by rendering the same fields here for quick access */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="profile_visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Widoczność profilu</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Publiczny" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Publiczny</SelectItem>
                            <SelectItem value="friends">Tylko znajomi</SelectItem>
                            <SelectItem value="private">Prywatny</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="show_location"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel className="m-0">Pokazuj lokalizację</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="show_orientation"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel className="m-0">Pokazuj orientację/tożsamość</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="show_friends"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel className="m-0">Pokazuj listę znajomych</FormLabel>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                    {loading ? "Zapisywanie…" : "Zapisz prywatność"}
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">2FA (TOTP)</h2>
                {!mfaSupported ? (
                  <p className="text-sm text-muted-foreground">
                    2FA nie jest dostępne w tej instancji. Upewnij się, że MFA jest włączone w
                    Supabase.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {mfaEnrolled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">2FA jest włączone.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              if (!supabase) {
                                toast.error("Brak konfiguracji Supabase")
                                return
                              }
                              if (!mfaFactorId) return
                              await supabase.auth.mfa.unenroll({ factorId: mfaFactorId })
                              setMfaEnrolled(false)
                              setMfaFactorId(null)
                              toast.success("Wyłączono 2FA")
                            } catch {
                              toast.error("Nie udało się wyłączyć 2FA")
                            }
                          }}
                        >
                          Wyłącz
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              if (!supabase) {
                                toast.error("Brak konfiguracji Supabase")
                                return
                              }
                              const { data, error } = await supabase.auth.mfa.enroll({
                                factorType: "totp",
                              })
                              if (error) throw error
                              const { id, totp } = data || {}
                              setMfaFactorId(id || null)
                              setMfaQR(totp?.qr_code || "")
                              setMfaSecret(totp?.secret || "")
                              toast.message("Zeskanuj kod i wpisz kod z aplikacji.")
                            } catch {
                              toast.error("Nie udało się rozpocząć rejestracji 2FA")
                            }
                          }}
                        >
                          Włącz 2FA
                        </Button>
                        {(mfaQR || mfaSecret) && (
                          <div className="grid gap-2">
                            {mfaQR && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={mfaQR} alt="Kod QR 2FA" className="h-40 w-40" />
                            )}
                            {mfaSecret && (
                              <p className="text-xs text-muted-foreground">Sekret: {mfaSecret}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Kod z aplikacji"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="max-w-[160px]"
                              />
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    if (!supabase) {
                                      toast.error("Brak konfiguracji Supabase")
                                      return
                                    }
                                    if (!mfaFactorId || !otpCode) return
                                    const ch = await supabase.auth.mfa.challenge({
                                      factorId: mfaFactorId,
                                    })
                                    const challengeId = (ch?.data as { id?: string } | undefined)
                                      ?.id
                                    if (!challengeId)
                                      throw new Error("Brak identyfikatora wyzwania 2FA")
                                    const { error: verr } = await supabase.auth.mfa.verify({
                                      factorId: mfaFactorId,
                                      code: otpCode,
                                      challengeId,
                                    })
                                    if (verr) throw verr
                                    setMfaEnrolled(true)
                                    setMfaQR("")
                                    setMfaSecret("")
                                    setOtpCode("")
                                    toast.success("2FA włączone")
                                  } catch {
                                    toast.error("Nie udało się zweryfikować kodu 2FA")
                                  }
                                }}
                              >
                                Zatwierdź
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">Zmiana hasła</h2>
                <div className="grid md:grid-cols-2 gap-2 max-w-lg">
                  <Input
                    type="password"
                    placeholder="Nowe hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Powtórz hasło"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                  />
                </div>
                <div>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        if (!supabase) {
                          toast.error("Brak konfiguracji Supabase")
                          return
                        }
                        if (!password || password !== password2) {
                          toast.error("Hasła nie są zgodne")
                          return
                        }
                        const { error } = await supabase.auth.updateUser({ password })
                        if (error) throw error
                        setPassword("")
                        setPassword2("")
                        toast.success("Hasło zmienione")
                      } catch {
                        toast.error("Nie udało się zmienić hasła")
                      }
                    }}
                  >
                    Zapisz hasło
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">Email konta (prywatny)</h2>
                <div className="grid md:grid-cols-2 gap-2 max-w-lg">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (!supabase) {
                          toast.error("Brak konfiguracji Supabase")
                          return
                        }
                        const { error } = await supabase.auth.updateUser({ email: accountEmail })
                        if (error) throw error
                        toast.success("Zaktualizowano email. Sprawdź skrzynkę, aby potwierdzić.")
                      } catch {
                        toast.error("Nie udało się zaktualizować emaila")
                      }
                    }}
                  >
                    Zapisz email
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ten email służy do logowania i odzyskiwania konta. Nie jest wyświetlany
                  publicznie.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">Połączenia OAuth</h2>
                <div className="text-sm text-muted-foreground">
                  Połącz dodatkowe logowanie przez Google lub Discord.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        if (!supabase) {
                          toast.error("Brak konfiguracji Supabase")
                          return
                        }
                        const { data, error } = await supabase.auth.linkIdentity({
                          provider: "google",
                          options: { redirectTo: `${window.location.origin}/settings` },
                        })
                        if (error) throw error
                        if (data?.url) window.location.href = data.url
                      } catch {
                        toast.error("Nie udało się zainicjować połączenia Google")
                      }
                    }}
                  >
                    Połącz Google
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        if (!supabase) {
                          toast.error("Brak konfiguracji Supabase")
                          return
                        }
                        const { data, error } = await supabase.auth.linkIdentity({
                          provider: "discord",
                          options: { redirectTo: `${window.location.origin}/settings` },
                        })
                        if (error) throw error
                        if (data?.url) window.location.href = data.url
                      } catch {
                        toast.error("Nie udało się zainicjować połączenia Discord")
                      }
                    }}
                  >
                    Połącz Discord
                  </Button>
                </div>
                <div className="text-sm">
                  Połączone:{" "}
                  {identities.length ? identities.map((i) => i.provider).join(", ") : "brak"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">Klucze szyfrowania (E2EE)</h2>
                <p className="text-sm text-muted-foreground">
                  Zabezpiecz swój klucz prywatny hasłem i przechowuj zaszyfrowaną kopię w profilu.
                  Dzięki temu możesz odszyfrowywać wiadomości na innych urządzeniach.
                </p>
                <div className="grid md:grid-cols-2 gap-2 max-w-xl">
                  <Input
                    type="password"
                    placeholder="Hasło do sejfu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          if (!supabase) {
                            toast.error("Brak konfiguracji Supabase")
                            return
                          }
                          // Export current private key and encrypt into vault
                          const pkcs8b64 = await KeyManager.exportPrivateKeyPkcs8B64().catch(
                            () => ""
                          )
                          if (!pkcs8b64) {
                            toast.error("Brak klucza prywatnego w pamięci. Zaloguj się ponownie.")
                            return
                          }
                          if (!password) {
                            toast.error("Podaj hasło do sejfu")
                            return
                          }
                          const vault = await encryptPrivateKeyPkcs8B64(pkcs8b64, password)
                          const { error } = await supabase
                            .from("profiles")
                            .update({ private_key_vault: vault as unknown as VaultBlob })
                            .eq("id", (await supabase.auth.getUser()).data.user?.id)
                          if (error) throw error
                          toast.success("Zapisano zaszyfrowany klucz prywatny")
                        } catch {
                          toast.error("Nie udało się zapisać sejfu klucza")
                        }
                      }}
                    >
                      Zapisz sejf
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          if (!supabase) {
                            toast.error("Brak konfiguracji Supabase")
                            return
                          }
                          const { data } = await supabase
                            .from("profiles")
                            .select("private_key_vault")
                            .eq("id", (await supabase.auth.getUser()).data.user?.id)
                            .maybeSingle()
                          const vault = (data?.private_key_vault || null) as VaultBlob | null
                          if (!vault) {
                            toast.error("Brak sejfu w profilu")
                            return
                          }
                          if (!password) {
                            toast.error("Podaj hasło do sejfu")
                            return
                          }
                          const pkcs8b64 = await decryptPrivateKeyPkcs8B64(vault, password)
                          await KeyManager.setPrivateKeyFromPkcs8(pkcs8b64)
                          toast.success("Zaimportowano klucz prywatny na to urządzenie")
                        } catch {
                          toast.error("Nie udało się odszyfrować sejfu. Błędne hasło?")
                        }
                      }}
                    >
                      Odszyfruj na tym urządzeniu
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Uwaga: hasło nie jest przechowywane. Zadbaj o jego zapamiętanie.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accessibility">
          <Card>
            <CardContent className="p-4 grid gap-3 max-w-xl">
              <p className="text-sm text-muted-foreground">
                Preferencje wyświetlania zapisywane lokalnie w przeglądarce.
              </p>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">Ogranicz animacje</div>
                  <div className="text-sm text-muted-foreground">
                    Zmniejsza ruchome animacje i przejścia.
                  </div>
                </div>
                <Switch
                  checked={reduceMotion}
                  onCheckedChange={(v) => {
                    setReduceMotion(v)
                    try {
                      localStorage.setItem("pref-reduce-motion", v ? "1" : "0")
                    } catch {}
                    document.documentElement.classList.toggle("reduce-motion", v)
                  }}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3 gap-3">
                <div>
                  <div className="font-medium">Skala czcionki</div>
                  <div className="text-sm text-muted-foreground">
                    Powiększ lub zmniejsz bazowy rozmiar tekstu.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="range"
                    min={90}
                    max={130}
                    step={5}
                    value={fontScale}
                    onChange={(e) => {
                      const v = e.target.value
                      setFontScale(v)
                      try {
                        localStorage.setItem("pref-font-scale", v)
                      } catch {}
                      document.documentElement.style.setProperty("--app-font-scale", `${v}%`)
                    }}
                  />
                  <div className="w-14 text-right text-sm text-muted-foreground">{fontScale}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardContent className="p-4 grid gap-3">
              <h2 className="text-lg font-semibold text-red-600">Usuń konto</h2>
              <p className="text-sm text-muted-foreground">
                To usunie Twoje posty, interakcje i połączenia. Tej operacji nie można cofnąć.
              </p>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    if (!supabase) {
                      toast.error("Brak konfiguracji Supabase")
                      return
                    }
                    const me = (await supabase.auth.getUser()).data.user
                    if (!me) throw new Error("Brak użytkownika")
                    // Best effort client-side cleanup under RLS
                    await supabase.from("post_interactions").delete().eq("user_id", me.id)
                    await supabase.from("posts").delete().eq("user_id", me.id)
                    await supabase
                      .from("friend_requests")
                      .delete()
                      .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
                    await supabase
                      .from("friendships")
                      .delete()
                      .or(`user1_id.eq.${me.id},user2_id.eq.${me.id}`)
                    await supabase.from("profiles").delete().eq("id", me.id)
                    // Sign out after cleanup
                    await supabase.auth.signOut()
                    window.location.href = "/"
                  } catch {
                    toast.error("Nie udało się usunąć konta. Skontaktuj się ze wsparciem.")
                  }
                }}
              >
                Usuń moje konto
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
